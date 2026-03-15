import { createAdminClient } from '@/lib/supabase/admin';

export async function updateDailyPatienceScores() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Get all active subscriptions
  const { data: subs, error: subError } = await supabase
    .from('user_subscriptions')
    .select('user_id, start_nav, start_index_value, created_at')
    .eq('status', 'active');

  if (subError) throw subError;
  if (!subs) return;

  // 2. Get all active bundle series
  const { data: allSeries } = await supabase
    .from('bundle_series')
    .select('id, name')
    .eq('is_active', true);

  if (!allSeries || allSeries.length === 0) return;

  const DEFAULT_SERIES_ID = 'aabe7761-e6e2-45d0-aee9-29c727644c3f'; // 미국 우량주 번들

  // 3. Process each series to update Global Bundle Index
  const seriesIndexValues: Record<string, number> = {};

  for (const series of allSeries) {
    try {
      // Get latest published bundle for this series
      const { data: bundle } = await supabase
        .from('bundles')
        .select('*, bundle_items(*)')
        .eq('status', 'published')
        .eq('series_id', series.id)
        .order('valid_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!bundle || !bundle.bundle_items || bundle.bundle_items.length === 0) continue;

      const tickers = bundle.bundle_items.map((i: any) => i.etf_ticker);
      const { data: prices } = await supabase
        .from('etf_prices')
        .select('ticker, price_date, nav')
        .in('ticker', tickers)
        .order('price_date', { ascending: false });

      if (!prices || prices.length === 0) continue;

      const latestPrices: Record<string, number> = {};
      const yesterdayPrices: Record<string, number> = {};
      
      prices.forEach((p: any) => {
        if (!latestPrices[p.ticker]) {
          latestPrices[p.ticker] = p.nav;
        } else if (!yesterdayPrices[p.ticker]) {
          yesterdayPrices[p.ticker] = p.nav;
        }
      });

      const currentBundleNav = bundle.bundle_items.reduce((acc: number, item: any) => {
        const price = latestPrices[item.etf_ticker] || item.base_nav;
        return acc + (price * item.weight / 100);
      }, 0);

      const prevBundleNav = bundle.bundle_items.reduce((acc: number, item: any) => {
        const price = yesterdayPrices[item.etf_ticker] || item.base_nav;
        return acc + (price * item.weight / 100);
      }, 0);

      const { data: lastIndexEntry } = await supabase
        .from('bundle_index_history')
        .select('index_value')
        .eq('series_id', series.id)
        .lt('recorded_date', today)
        .order('recorded_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastIndexValue = Number(lastIndexEntry?.index_value || 1000);
      const dailyReturn = prevBundleNav > 0 ? (currentBundleNav - prevBundleNav) / prevBundleNav : 0;
      const currentIndexValue = lastIndexValue * (1 + dailyReturn);

      seriesIndexValues[series.id] = currentIndexValue;

      await supabase.from('bundle_index_history').upsert({
        series_id: series.id,
        recorded_date: today,
        index_value: parseFloat(currentIndexValue.toFixed(4)),
        daily_return: parseFloat((dailyReturn * 100).toFixed(4))
      }, { onConflict: 'series_id,recorded_date' });

    } catch (err) {
      console.error(`Error calculating index for series ${series.id}:`, err);
    }
  }

  // 4. Update each user's score and logs for ALL series
  for (const sub of subs) {
    try {
      // Get current overall score (based on default/master series)
      const { data: lastLog } = await supabase
        .from('patience_logs')
        .select('patience_score')
        .eq('user_id', sub.user_id)
        .eq('series_id', DEFAULT_SERIES_ID)
        .order('recorded_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      let currentScore = lastLog?.patience_score || 50;
      
      // Calculate Global ROI based on DEFAULT series to determine overall score delta
      const masterIndexValue = seriesIndexValues[DEFAULT_SERIES_ID] || 1000;
      const userMasterStartIndex = Number(sub.start_index_value || 1000);
      let masterRoi = 0;
      if (userMasterStartIndex > 0) {
        masterRoi = ((masterIndexValue - userMasterStartIndex) / userMasterStartIndex) * 100;
      }

      // Universal Points Logic (shared across all theme logs for consistency)
      let delta = 0.1; 
      if (masterRoi > 0) delta += 0.2; 
      if (masterRoi < -5) delta -= 0.1; 

      const newScore = Math.min(100, Math.max(0, currentScore + delta));

      // Update logs for EVERY series so the user can filter the graph
      for (const seriesId of Object.keys(seriesIndexValues)) {
        const seriesIndexValue = seriesIndexValues[seriesId];
        
        // Find series-specific start index value for this user
        // If not stored, we'd ideally find the index from history on sub.created_at
        // For now, let's use a simpler ROI if we don't have start_index per series
        // Optimization: In real prod, we'd store series_start_indices joined table
        let seriesRoi = 0;
        const userStartIndex = Number(sub.start_index_value || 1000); // Fallback to global
        seriesRoi = ((seriesIndexValue - userStartIndex) / userStartIndex) * 100;

        await supabase.from('patience_logs').upsert({
          user_id: sub.user_id,
          series_id: seriesId,
          patience_score: parseFloat(newScore.toFixed(2)),
          virtual_return_pct: parseFloat(seriesRoi.toFixed(2)),
          delta: parseFloat(delta.toFixed(2)),
          reason: `지수 업데이트 (${allSeries.find(s => s.id === seriesId)?.name})`,
          recorded_date: today
        }, { onConflict: 'user_id,series_id,recorded_date' });
      }

    } catch (err) {
      console.error(`Error updating user ${sub.user_id}:`, err);
    }
  }
}
