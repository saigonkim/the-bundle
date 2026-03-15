'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(fullName: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' }
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName }
  })

  if (error) {
    console.error('Profile update error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
