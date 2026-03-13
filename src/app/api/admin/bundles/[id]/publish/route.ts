import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  // 1. Admin check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    // 2. Transaction-like: Unpublish previous bundles and publish the new one
    // In Supabase, we can just update all published to archived, then this one to published
    
    // First, unpublish all
    const { error: unpublishError } = await supabase
      .from('bundles')
      .update({ status: 'archived' })
      .eq('status', 'published')

    if (unpublishError) throw unpublishError

    // Second, publish target
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
