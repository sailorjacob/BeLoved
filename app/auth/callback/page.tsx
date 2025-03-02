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
        if (error) throw error

        if (session?.user) {
          console.log('[AuthCallback] Session found, fetching profile')
          // Get user profile to determine redirect
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single()

          console.log('[AuthCallback] Profile found:', profile)

          // Redirect based on user type
          switch (profile?.user_type) {
            case 'super_admin':
              console.log('[AuthCallback] Redirecting super admin to dashboard')
              router.replace('/super-admin-dashboard')
              break
            case 'admin':
              router.replace('/admin-dashboard')
              break
            case 'driver':
              router.replace('/driver-dashboard')
              break
            case 'member':
              router.replace('/dashboard')
              break
            default:
              console.log('[AuthCallback] No profile or unknown user type')
              router.replace('/')
          }
        } else {
          console.log('[AuthCallback] No session found')
          router.replace('/')
        }
      } catch (error) {
        console.error('[AuthCallback] Error:', error)
        router.replace('/')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
    </div>
  )
} 