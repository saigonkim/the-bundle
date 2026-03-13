import { NextResponse } from 'next/server';
import { fetchAndStoreAllEtfPrices } from '@/services/etf-collection';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await fetchAndStoreAllEtfPrices();
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('[Cron Error] ETF Fetch:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
