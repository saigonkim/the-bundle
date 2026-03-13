'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createMockSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Get current bundle to set start_nav
  const { data: latestBundle } = await supabase
    .from('bundles')
    .select('*, bundle_items(*)')
    .eq('status', 'published')
    .order('valid_from', { ascending: false })
    .limit(1)
    .single()

  let startNav = 0
  if (latestBundle) {
    startNav = latestBundle.bundle_items.reduce((acc: number, item: any) => acc + (item.base_nav * item.weight / 100), 0)
  }

  if (existing) {
    // Update status to active if it exists
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        start_nav: startNav,
        subscribed_at: new Date().toISOString(),
        next_billing_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('user_id', user.id)
  } else {
    // Create new mock subscription
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        status: 'active',
        plan_amount: 4900,
        currency: 'KRW',
        start_nav: startNav,
        subscribed_at: new Date().toISOString(),
        next_billing_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_key: `mock_${user.id.substring(0, 8)}`,
      })
    
    if (error) throw error
  }

  // Initial Patience Log
  await supabase.from('patience_logs').upsert({
    user_id: user.id,
    patience_score: 50.00, // Starting point
    delta: 0,
    reason: '구독 시작 기념 지수 부여',
    recorded_date: new Date().toISOString().split('T')[0]
  }, { onConflict: 'user_id,recorded_date' })

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
