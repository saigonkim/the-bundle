import { createAdminClient } from '@/lib/supabase/admin';
import { getKISToken } from '@/lib/kis/auth';
import { getETFPrice, getETFHoldings } from '@/lib/kis/etf';

export async function fetchAndStoreAllEtfPrices() {
  const supabase = createAdminClient();
  const token = await getKISToken();

  // 1. Get active ETFs
  const { data: etfs, error: etfError } = await supabase
    .from('etf_master')
    .select('ticker, name')
    .eq('is_active', true);

  if (etfError) throw etfError;
  if (!etfs || etfs.length === 0) {
    console.log('No active ETFs found in etf_master.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // 2. Fetch and store prices (sequentially or with limit to respect rate limits)
  // For simplicity for now, we do them in sequence or small batches.
  for (const etf of etfs) {
    try {
      console.log(`Fetching data for ${etf.name} (${etf.ticker})...`);
      const priceData = await getETFPrice(etf.ticker, token);

      const { error: priceError } = await supabase
        .from('etf_prices')
        .upsert({
          ticker: etf.ticker,
          price_date: today,
          close_price: parseFloat(priceData.stck_prpr),
          nav: parseFloat(priceData.nav),
          prev_close: parseFloat(priceData.stck_sdpr),
          change_pct: parseFloat(priceData.prdy_ctrt),
          volume: parseInt(priceData.acml_vol),
          fetched_at: new Date().toISOString(),
        }, { onConflict: 'ticker,price_date' });

      if (priceError) throw priceError;

      // 3. Update holdings
      const holdingsData = await getETFHoldings(etf.ticker, token);
      if (holdingsData.output2 && holdingsData.output2.length > 0) {
        for (const item of holdingsData.output2) {
          await supabase
            .from('etf_holdings')
            .upsert({
              ticker: etf.ticker,
              component_ticker: item.stck_shrn_iscd,
              component_name: item.iscd_nm,
              weight: parseFloat(item.bssas_invst_rate),
              fetched_at: new Date().toISOString(),
            }, { onConflict: 'ticker,component_name' });
        }
      }

      console.log(`Successfully updated ${etf.ticker}`);
    } catch (err) {
      console.error(`Error processing ${etf.ticker}:`, err);
    }
  }
}
