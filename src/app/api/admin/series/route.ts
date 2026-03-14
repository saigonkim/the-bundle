import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Admin check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: series, error } = await supabase
      .from('bundle_series')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) throw error

    return NextResponse.json({ series })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
