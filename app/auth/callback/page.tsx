'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Processing auth callback')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[AuthCallback] Session error:', error)
          throw error
        }

        if (!session?.user) {
          console.log('[AuthCallback] No session found, redirecting to home')
          window.location.href = '/'
          return
        }

        console.log('[AuthCallback] Session found, fetching profile')
        // Get user profile to determine redirect
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_role, provider_id')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('[AuthCallback] Profile error:', profileError)
          throw profileError
        }

        console.log('[AuthCallback] Profile found:', profile)

        // Determine redirect URL
        let redirectUrl = '/'
        switch (profile?.user_role) {
          case 'super_admin':
            redirectUrl = '/super-admin-dashboard'
            break
          case 'admin':
            redirectUrl = '/admin-dashboard'
            break
          case 'driver':
            redirectUrl = '/driver-dashboard'
            break
          case 'member':
            redirectUrl = '/member-dashboard'
            break
          default:
            console.log('[AuthCallback] Unknown user role:', profile?.user_role)
            redirectUrl = '/'
        }

        console.log('[AuthCallback] Redirecting to:', redirectUrl)
        window.location.href = redirectUrl

      } catch (error) {
        console.error('[AuthCallback] Error:', error)
        window.location.href = '/'
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
    </div>
  )
} 