import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey || supabaseServiceKey === 'placeholder-service-role-key') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing or not set in .env.local');
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}
