import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { documentId, note } = await req.json()

    if (!documentId || !note?.trim()) {
      return NextResponse.json({ error: 'Missing documentId or note.' }, { status: 400 })
    }

    // 1. Verify the requester is authenticated and owns this document
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // 2. Check document belongs to this user and is in 'released' status
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('id, status, submitted_by, client_acknowledged_at')
      .eq('id', documentId)
      .single()

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    if (doc.submitted_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    if (doc.status !== 'released') {
      return NextResponse.json({ error: 'Document is not in released status.' }, { status: 400 })
    }

    if (doc.client_acknowledged_at) {
      return NextResponse.json({ error: 'Already acknowledged.' }, { status: 400 })
    }

    // 3. Use service role client to bypass RLS and write the acknowledgement
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date().toISOString()
    const { error: updateError } = await adminSupabase
      .from('documents')
      .update({
        client_acknowledged_at:      now,
        client_acknowledgement_note: note.trim(),
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('[Acknowledge] Update failed:', updateError.message)
      return NextResponse.json({ error: 'Failed to save acknowledgement.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, acknowledgedAt: now })

  } catch (err) {
    console.error('[Acknowledge] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
