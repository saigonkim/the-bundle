import { createAdminClient } from '@/lib/supabase/admin';

export async function updateDailyPatienceScores() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Get all active subscriptions
  const { data: subs, error: subError } = await supabase
    .from('user_subscriptions')
    .select('user_id, start_nav, start_index_value')
    .eq('status', 'active');

  if (subError) throw subError;
  if (!subs) return;

  // 2. Get latest published bundle
  const { data: bundle } = await supabase
    .from('bundles')
    .select('*, bundle_items(*)')
    .eq('status', 'published')
    .order('valid_from', { ascending: false })
    .limit(1)
    .single();

  if (!bundle) return;

  // 3. Calculate Global Bundle Index
  const tickers = bundle.bundle_items.map((i: any) => i.etf_ticker);
  const { data: prices } = await supabase
    .from('etf_prices')
    .select('ticker, price_date, nav')
    .in('ticker', tickers)
    .order('price_date', { ascending: false });

  // Group latest prices
  const latestPrices: Record<string, number> = {};
  const yesterdayPrices: Record<string, number> = {};
  
  prices?.forEach((p: any) => {
    if (!latestPrices[p.ticker]) {
      latestPrices[p.ticker] = p.nav;
    } else if (!yesterdayPrices[p.ticker]) {
      yesterdayPrices[p.ticker] = p.nav;
    }
  });

  // Calculate current and previous (yesterday) bundle NAV
  const currentBundleNav = bundle.bundle_items.reduce((acc: number, item: any) => {
    const price = latestPrices[item.etf_ticker] || item.base_nav;
    return acc + (price * item.weight / 100);
  }, 0);

  const prevBundleNav = bundle.bundle_items.reduce((acc: number, item: any) => {
    const price = yesterdayPrices[item.etf_ticker] || item.base_nav;
    return acc + (price * item.weight / 100);
  }, 0);

  // Update Bundle Index History
  const { data: lastIndexEntry } = await supabase
    .from('bundle_index_history')
    .select('index_value')
    .lt('recorded_date', today)
    .order('recorded_date', { ascending: false })
    .limit(1)
    .single();

  const lastIndexValue = Number(lastIndexEntry?.index_value || 1000);
  const dailyReturn = prevBundleNav > 0 ? (currentBundleNav - prevBundleNav) / prevBundleNav : 0;
  const currentIndexValue = lastIndexValue * (1 + dailyReturn);

  // Save today's index
  await supabase.from('bundle_index_history').upsert({
    recorded_date: today,
    index_value: parseFloat(currentIndexValue.toFixed(4)),
    daily_return: parseFloat((dailyReturn * 100).toFixed(4))
  });

  // 4. Update each user's score using Index-based ROI
  for (const sub of subs) {
    try {
      // Get current score
      const { data: lastLog } = await supabase
        .from('patience_logs')
        .select('patience_score')
        .eq('user_id', sub.user_id)
        .order('recorded_date', { ascending: false })
        .limit(1)
        .single();

      let currentScore = lastLog?.patience_score || 50;
      
      // Option B: Cumulative ROI since subscription start
      let roi = 0;
      const userStartIndex = Number(sub.start_index_value || 1000);
      if (userStartIndex > 0) {
          roi = ((currentIndexValue - userStartIndex) / userStartIndex) * 100;
      }

      // Points Logic
      let delta = 0.1; // Base point for holding
      if (roi > 0) delta += 0.2; // Bonus for profit
      if (roi < -5) delta -= 0.1; // Penalty for major loss stress

      const newScore = Math.min(100, Math.max(0, currentScore + delta));

      await supabase.from('patience_logs').upsert({
        user_id: sub.user_id,
        patience_score: parseFloat(newScore.toFixed(2)),
        delta: parseFloat(delta.toFixed(2)),
        reason: `연속 지수 업데이트 (누적 ROI: ${roi.toFixed(2)}%)`,
        recorded_date: today
      }, { onConflict: 'user_id,recorded_date' });

    } catch (err) {
      console.error(`Error updating user ${sub.user_id}:`, err);
    }
  }
}
