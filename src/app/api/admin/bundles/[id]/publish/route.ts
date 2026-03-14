import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  // 1. Admin check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // 2. Fetch the bundle to get its series_id
    const { data: targetBundle, error: fetchError } = await supabase
      .from('bundles')
      .select('series_id')
      .eq('id', id)
      .single()

    if (fetchError || !targetBundle) throw new Error('Bundle not found')

    // 3. Archive previous bundles of the SAME series
    if (targetBundle.series_id) {
        const { error: unpublishError } = await supabase
          .from('bundles')
          .update({ status: 'archived' })
          .eq('status', 'published')
          .eq('series_id', targetBundle.series_id)

        if (unpublishError) throw unpublishError
    } else {
        // Fallback for bundles without series (archive all existing published - old behavior)
        const { error: unpublishError } = await supabase
          .from('bundles')
          .update({ status: 'archived' })
          .eq('status', 'published')
          .is('series_id', null)

        if (unpublishError) throw unpublishError
    }

    // 4. Publish target
    const { error: publishError } = await supabase
      .from('bundles')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', id)

    if (publishError) throw publishError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Publish error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
