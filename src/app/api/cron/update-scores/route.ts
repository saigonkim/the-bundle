import { NextResponse } from 'next/server';
import { updateDailyPatienceScores } from '@/services/patience-service';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await updateDailyPatienceScores();
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('[Cron Error] Score Update:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
