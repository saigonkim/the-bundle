import { config } from 'dotenv';
import path from 'path';

// Load .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { fetchAndStoreAllEtfPrices } from '../src/services/etf-collection';

async function test() {
  console.log('🚀 Starting Phase 2 Test: ETF Data Collection...');
  try {
    await fetchAndStoreAllEtfPrices();
    console.log('✅ Test Completed Successfully!');
  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  }
}

test();
