'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'

interface LayoutProps {
  children: React.ReactNode
  publicPaths?: string[]
}

export function Layout({ children, publicPaths = ['/login', '/auth/callback', '/'] }: LayoutProps) {
  const router = useRouter()
  const { isLoggedIn, isLoading, user, profile } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      const pathname = window.location.pathname

      // Allow access to public paths
      if (publicPaths.includes(pathname)) {
        return
      }

      // Redirect to login if not logged in
      if (!isLoggedIn) {
        router.push('/login')
        return
      }

      // Redirect based on user type if on incorrect dashboard
      if (profile) {
        const isOnAdminPath = pathname.includes('admin')
        const isOnDriverPath = pathname.includes('driver')
        const isOnSuperAdminPath = pathname.includes('super-admin')
        const isOnMemberPath = pathname === '/dashboard'

        switch (profile.user_type) {
          case 'super_admin':
            if (!isOnSuperAdminPath) {
              router.push('/super-admin-dashboard')
            }
            break
          case 'admin':
            if (isOnSuperAdminPath || !isOnAdminPath) {
              router.push('/admin-dashboard')
            }
            break
          case 'driver':
            if (!isOnDriverPath) {
              router.push('/driver-dashboard')
            }
            break
          case 'member':
            if (!isOnMemberPath) {
              router.push('/dashboard')
            }
            break
        }
      }
    }
  }, [isLoading, isLoggedIn, profile, router, publicPaths])

  // Only show loading state when checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return <>{children}</>
} 