import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single()

      if (!profile || !profile.is_active) {
        // Get the latest deletion reason (if any)
        const { data: deletionLog } = await supabase
          .from('user_deletion_logs')
          .select('reason')
          .eq('user_id', data.user.id)
          .order('deleted_at', { ascending: false })
          .limit(1)
          .maybeSingle()   // <-- use maybeSingle() to avoid error

        let reason = 'Your account has been deactivated.'
        if (deletionLog?.reason) {
          reason = deletionLog.reason
        }

        const encodedReason = encodeURIComponent(reason)

        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=inactive&reason=${encodedReason}`)
      }

      const role = profile?.role ?? 'client'
      const redirectMap: Record<string, string> = {
        super_admin: '/super-admin/dashboard',
        office_head: '/office-head/dashboard',
        client: '/client/dashboard',
      }
      return NextResponse.redirect(`${origin}${redirectMap[role]}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}