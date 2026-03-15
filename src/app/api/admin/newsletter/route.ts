import { createClient } from '@/lib/supabase/server'
import { isTestEmail } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // 1. Fetch all subscribed users from your DB
    // Assuming you have a 'profiles' table or similar linked to auth
    const { data: users, error } = await supabase
      .from('profiles')
      .select('email, full_name')
      
    if (error) throw error

    const results = {
      total: users.length,
      sent: 0,
      skipped: 0,
      details: [] as any[]
    }

    for (const user of users) {
      if (!user.email || isTestEmail(user.email)) {
        results.skipped++
        results.details.push({ email: user.email, status: 'skipped', reason: 'Test/Dummy Account' })
        continue
      }

      // 2. Here you would normally integrate with Resend, SendGrid, etc.
      // Since we are in mock mode, we log the "sending"
      console.log(`[NEWSLETTER] Sending weekly report to: ${user.email}`)
      
      // simulate success
      results.sent++
      results.details.push({ email: user.email, status: 'sent', reason: 'Success' })
    }

    return NextResponse.json({
      success: true,
      message: `${results.sent} emails sent, ${results.skipped} skipped.`,
      data: results
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
