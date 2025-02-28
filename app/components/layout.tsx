'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'

interface LayoutProps {
  children: React.ReactNode
  publicPaths?: string[]
}

export function Layout({ children, publicPaths = ['/login', '/auth/callback', '/'] }: LayoutProps) {
  const router = useRouter()
  const { isLoggedIn, isLoading, user, profile } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!isLoading && !isRedirecting) {
      const pathname = window.location.pathname
      console.log('Layout checking path:', pathname, { isLoggedIn, profile })

      // Allow access to public paths
      if (publicPaths.includes(pathname)) {
        // If logged in on a public path, redirect to appropriate dashboard
        if (isLoggedIn && profile) {
          setIsRedirecting(true)
          switch (profile.user_type) {
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
          }
        }
        return
      }

      // Redirect to login if not logged in
      if (!isLoggedIn) {
        setIsRedirecting(true)
        router.push('/login')
        return
      }

      // Redirect based on user type if on incorrect dashboard
      if (profile) {
        const isOnAdminPath = pathname.includes('admin')
        const isOnDriverPath = pathname.includes('driver')
        const isOnSuperAdminPath = pathname.includes('super-admin')
        const isOnMemberPath = pathname === '/dashboard'

        let shouldRedirect = false
        let redirectPath = ''

        switch (profile.user_type) {
          case 'super_admin':
            if (!isOnSuperAdminPath) {
              shouldRedirect = true
              redirectPath = '/super-admin-dashboard'
            }
            break
          case 'admin':
            if (isOnSuperAdminPath || !isOnAdminPath) {
              shouldRedirect = true
              redirectPath = '/admin-dashboard'
            }
            break
          case 'driver':
            if (!isOnDriverPath) {
              shouldRedirect = true
              redirectPath = '/driver-dashboard'
            }
            break
          case 'member':
            if (!isOnMemberPath) {
              shouldRedirect = true
              redirectPath = '/dashboard'
            }
            break
        }

        if (shouldRedirect) {
          console.log('Redirecting to:', redirectPath)
          setIsRedirecting(true)
          router.push(redirectPath)
        }
      }
    }
  }, [isLoading, isLoggedIn, profile, router, publicPaths, isRedirecting])

  // Only show loading state when checking auth
  if (isLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return <>{children}</>
} 