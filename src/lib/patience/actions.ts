'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function seedTestData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // 1. Ensure user has a subscription
  let { data: sub } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub) {
    const { data: newSub, error: subError } = await supabase.from('user_subscriptions').insert({
      user_id: user.id,
      status: 'active',
      plan_type: 'monthly',
      start_nav: 1000,
      current_nav: 1000,
    }).select().single()
    
    if (subError) throw subError
    sub = newSub
  } else if (sub.status !== 'active') {
    const { data: updatedSub, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ status: 'active' })
      .eq('user_id', user.id)
      .select().single()
      
    if (updateError) throw updateError
    sub = updatedSub
  }

  const subscriptionId = sub.id

  // 2. Generate 14 days of mock data
  const logs = []
  const now = new Date()
  let currentRoi = 0
  let currentScore = 15 // Start as a seed

  for (let i = 14; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Use stable date format YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0]
    
    const dailyChange = (Math.random() * 2) - 0.5
    currentRoi += dailyChange
    currentScore += (Math.random() * 1) + 0.5

    logs.push({
      user_id: user.id,
      subscription_id: subscriptionId,
      recorded_date: dateStr,
      virtual_return_pct: parseFloat(currentRoi.toFixed(2)),
      patience_score: parseFloat(currentScore.toFixed(1)),
      reason: i === 14 ? '투여의 시작' : '일간 자본 성장 기록'
    })
  }

  const { error } = await supabase
    .from('patience_logs')
    .upsert(logs, { onConflict: 'user_id,recorded_date' })
  
  if (error) throw error

  revalidatePath('/dashboard/performance')
  revalidatePath('/dashboard/settings')
  
  return { success: true }
}
