import { createAdminClient } from '@/lib/supabase/admin';

export async function updateDailyPatienceScores() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Get all active subscriptions
  const { data: subs, error: subError } = await supabase
    .from('user_subscriptions')
    .select('user_id, start_nav')
    .eq('status', 'active');

  if (subError) throw subError;
  if (!subs) return;

  // 2. Get latest prices for all ETFs in current bundle
  // (We assume the current bundle is the same for all users for now)
  const { data: bundle } = await supabase
    .from('bundles')
    .select('*, bundle_items(*)')
    .eq('status', 'published')
    .order('valid_from', { ascending: false })
    .limit(1)
    .single();

  if (!bundle) return;

  const tickers = bundle.bundle_items.map((i: any) => i.etf_ticker);
  const { data: prices } = await supabase
    .from('etf_prices')
    .select('ticker, price_date, nav')
    .in('ticker', tickers)
    .order('price_date', { ascending: false });

  // Group latest prices
  const latestPrices: Record<string, number> = {};
  prices?.forEach((p: any) => {
    if (!latestPrices[p.ticker]) {
      latestPrices[p.ticker] = p.nav;
    }
  });

  // Calculate current bundle NAV
  const currentBundleNav = bundle.bundle_items.reduce((acc: number, item: any) => {
    const price = latestPrices[item.etf_ticker] || item.base_nav;
    return acc + (price * item.weight / 100);
  }, 0);

  // 3. Update each user's score
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
      let roi = 0;
      if (sub.start_nav > 0) {
          roi = ((currentBundleNav - sub.start_nav) / sub.start_nav) * 100;
      }

      // Points Logic
      let delta = 0.1; // Base point for holding
      if (roi > 0) delta += 0.2; // Bonus for profit
      if (roi < -5) delta -= 0.1; // Penalty for major loss stress (testing patience)

      const newScore = Math.min(100, Math.max(0, currentScore + delta));

      await supabase.from('patience_logs').upsert({
        user_id: sub.user_id,
        patience_score: parseFloat(newScore.toFixed(2)),
        delta: parseFloat(delta.toFixed(2)),
        reason: `일일 지수 업데이트 (ROI: ${roi.toFixed(2)}%)`,
        recorded_date: today
      }, { onConflict: 'user_id,recorded_date' });

    } catch (err) {
      console.error(`Error updating user ${sub.user_id}:`, err);
    }
  }
}
