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

  try {
    // Check if already subscribed using maybeSingle to avoid errors if not found
    const { data: existing, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('[Subscription] Fetch error:', fetchError)
      throw fetchError
    }

    // Get current bundle to set start_nav
    const { data: latestBundle } = await supabase
      .from('bundles')
      .select('id, bundle_items(base_nav, weight)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let startNav = 0
    if (latestBundle?.bundle_items) {
      // Explicitly type acc and item to avoid issues
      startNav = (latestBundle.bundle_items as any[]).reduce((acc: number, item: any) => acc + (Number(item.base_nav) * Number(item.weight) / 100), 0)
    }

    // Get current index value
    const { data: latestIndex } = await supabase
      .from('bundle_index_history')
      .select('index_value')
      .order('recorded_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    const startIndexValue = latestIndex?.index_value || 1000

    // Create new mock subscription or update
    let subscriptionId: string
    
    if (existing) {
      console.log('[Subscription] Updating existing subscription:', existing.id)
      subscriptionId = existing.id
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          start_nav: startNav,
          start_index_value: startIndexValue,
          current_bundle_id: latestBundle?.id,
          subscribed_at: new Date().toISOString(),
          next_billing_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      if (updateError) {
        console.error('[Subscription] Update error:', updateError)
        throw updateError
      }
    } else {
      console.log('[Subscription] Creating new subscription for user:', user.id)
      const { data: newSub, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          status: 'active',
          plan_amount: 4900,
          currency: 'KRW',
          start_nav: startNav,
          start_index_value: startIndexValue,
          current_bundle_id: latestBundle?.id,
          subscribed_at: new Date().toISOString(),
          next_billing_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          customer_key: `mock_${user.id.substring(0, 8)}`,
        })
        .select('id')
        .single()
      
      if (insertError) {
        console.error('[Subscription] Insert error:', insertError)
        throw insertError
      }
      subscriptionId = newSub.id
    }

    // Initial Patience Log
    console.log('[Subscription] Creating initial patience log for subscription:', subscriptionId)
    const { error: logError } = await supabase.from('patience_logs').upsert({
      user_id: user.id,
      subscription_id: subscriptionId,
      patience_score: 50.00, // Starting point
      virtual_return_pct: 0,  // Initialize ROI at 0%
      delta: 0,
      reason: '구독 시작 기념 지표 부여 및 수익률 트래킹 시작',
      recorded_date: new Date().toISOString().split('T')[0]
    }, { onConflict: 'user_id,recorded_date' })

    if (logError) {
      console.error('[Subscription] Log error:', logError)
      throw logError
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/subscription')
    revalidatePath('/dashboard/performance')
    console.log('[Subscription] Success. Redirecting to dashboard.')
  } catch (err) {
    console.error('[Subscription] Action failed:', err)
    throw err
  }
  
  redirect('/dashboard')
}


