'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (session?.user) {
          // Get user profile to determine redirect
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single()

          // Redirect based on user type
          switch (profile?.user_type) {
            case 'super_admin':
              router.push('/super-admin-dashboard')
              break
            case 'admin':
              router.push('/admin-dashboard')
              break
            case 'driver':
              router.push('/driver-dashboard')
              break
            case 'member':
              router.push('/dashboard')
              break
            default:
              // If no profile or unknown user type, redirect to login
              router.push('/login')
          }
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error in auth callback:', error)
        router.push('/login')
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