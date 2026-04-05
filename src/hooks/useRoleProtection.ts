'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types'

/**
 * Hook to protect routes based on user role
 * Redirects to appropriate dashboard if user doesn't have the required role
 */
export function useRoleProtection(requiredRole: UserRole) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        router.push('/login')
        return
      }

      // If user is inactive, sign them out and redirect
      if (!profile.is_active) {
        await supabase.auth.signOut()
        router.push('/login?error=inactive')
        return
      }

      // If user's role doesn't match required role, redirect to their dashboard
      if (profile.role !== requiredRole) {
        const roleRedirectMap: Record<UserRole, string> = {
          super_admin: '/super-admin/dashboard',
          office_head: '/office-head/dashboard',
          client: '/client/dashboard',
        }
        router.push(roleRedirectMap[profile.role as UserRole])
      }
    }

    checkRole()
  }, [requiredRole, router, supabase])
}
