import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  { email: 'tester1@thebundle.test', password: 'password123' },
  { email: 'tester2@thebundle.test', password: 'password123' },
  { email: 'tester3@thebundle.test', password: 'password123' }
]

async function run() {
  console.log('🚀 Syncing test users...')
  
  // Get all users to check existing
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('Error listing users:', listError.message)
    return
  }

  for (const userSpec of testUsers) {
    let userId: string | undefined
    const existingUser = users.find(u => u.email === userSpec.email)

    if (existingUser) {
      console.log(`ℹ️ User ${userSpec.email} already exists.`)
      userId = existingUser.id
    } else {
      console.log(`Creating user: ${userSpec.email}...`)
      const { data, error } = await supabase.auth.admin.createUser({
        email: userSpec.email,
        password: userSpec.password,
        email_confirm: true
      })
      if (error) {
        console.error(`❌ Error creating ${userSpec.email}:`, error.message)
        continue
      }
      userId = data.user?.id
      console.log(`✅ User ${userSpec.email} created successfully.`)
    }

    if (userId) {
      // Seed Subscription
      console.log(`  Seeding subscription for ${userSpec.email}...`)
      const { data: subData, error: subError } = await supabase.from('user_subscriptions').upsert({
        user_id: userId,
        status: 'active',
        plan_type: 'monthly',
        start_nav: 1000,
        current_nav: 1000,
      }, { onConflict: 'user_id' }).select().single()

      if (subError) {
        console.error(`❌ Error seeding subscription for ${userSpec.email}:`, subError.message)
        continue
      }
      const subscriptionId = subData.id

      // Seed Patience Logs
      console.log(`  Seeding patience logs for ${userSpec.email}...`)
      
      const logs = []
      let currentRoi = 0
      let currentScore = 15
      const now = new Date()

      for (let i = 14; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        
        // Use stable date format YYYY-MM-DD
        const dateStr = date.toISOString().split('T')[0]
        
        currentRoi += (Math.random() * 2) - 0.5
        currentScore += (Math.random() * 1) + 0.5

        logs.push({
          user_id: userId,
          subscription_id: subscriptionId,
          recorded_date: dateStr,
          virtual_return_pct: parseFloat(currentRoi.toFixed(2)),
          patience_score: parseFloat(currentScore.toFixed(1)),
          reason: i === 14 ? '투여의 시작' : '일간 자본 성장 기록'
        })
      }
      const { error: logError } = await supabase
        .from('patience_logs')
        .upsert(logs, { onConflict: 'user_id,recorded_date' })
      
      if (logError) {
        console.error(`❌ Error seeding logs for ${userSpec.email}:`, logError.message)
      }
    }
  }
  
  console.log('✨ Sync complete.')
}

run()
