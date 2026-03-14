'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function seedTestData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // 1. Ensure user has a subscription
  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub) {
    await supabase.from('user_subscriptions').insert({
      user_id: user.id,
      status: 'active',
      plan_type: 'monthly',
      start_nav: 1000,
      current_nav: 1000,
    })
  } else if (sub.status !== 'active') {
    await supabase
      .from('user_subscriptions')
      .update({ status: 'active' })
      .eq('user_id', user.id)
  }

  // 2. Clear existing logs for fresh start (optional, but better for testing)
  await supabase.from('patience_logs').delete().eq('user_id', user.id)

  // 3. Generate 14 days of mock data
  const logs = []
  const now = new Date()
  let currentRoi = 0
  let currentScore = 15 // Start as a seed

  for (let i = 14; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Add some random variation to ROI (-0.5% to +1.5% daily)
    const dailyChange = (Math.random() * 2) - 0.5
    currentRoi += dailyChange
    
    // Patience score grows steadily (+0.5 to +1.5 daily)
    currentScore += (Math.random() * 1) + 0.5

    logs.push({
      user_id: user.id,
      recorded_date: date.toISOString(),
      virtual_return_pct: currentRoi.toFixed(2),
      patience_score: currentScore.toFixed(1),
      reason: i === 14 ? '투여의 시작' : '일간 자본 성장 기록'
    })
  }

  const { error } = await supabase.from('patience_logs').insert(logs)
  
  if (error) throw error

  revalidatePath('/dashboard/performance')
  revalidatePath('/dashboard/settings')
  
  return { success: true }
}
