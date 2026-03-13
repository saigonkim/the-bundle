import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  // Admin check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    // Fetch bundle details
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', id)
      .single()

    if (bundleError) throw bundleError

    // Fetch bundle items
    const { data: items, error: itemsError } = await supabase
      .from('bundle_items')
      .select('*')
      .eq('bundle_id', id)
      .order('order_index', { ascending: true })

    if (itemsError) throw itemsError

    return NextResponse.json({ bundle, items })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
