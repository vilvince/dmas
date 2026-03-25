'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CheckActive() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkActive = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', user.id)
          .single()

        if (!profile || !profile.is_active) {
          // Get the latest deletion reason
          const { data: deletionLog } = await supabase
            .from('user_deletion_logs')
            .select('reason')
            .eq('user_id', user.id)
            .order('deleted_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          let reason = 'Your account has been deactivated.'
          if (deletionLog?.reason) {
            reason = deletionLog.reason
          }

          const encodedReason = encodeURIComponent(reason)

          await supabase.auth.signOut()
          router.push(`/login?error=inactive&reason=${encodedReason}`)
        }
      }
    }
    checkActive()
  }, [supabase, router])

  return null
}