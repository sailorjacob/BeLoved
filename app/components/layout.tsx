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
  const { isLoggedIn, isLoading, profile } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    const handleAuth = async () => {
      if (isLoading) return

      const pathname = window.location.pathname
      console.log('Layout checking path:', pathname, { isLoggedIn, profile })

      // If we're on a public path
      if (publicPaths.includes(pathname)) {
        // Only redirect if logged in with a profile
        if (isLoggedIn && profile) {
          setIsRedirecting(true)
          const redirectPath = getRedirectPath(profile.user_type)
          if (pathname !== redirectPath) {
            console.log('Layout: redirecting to dashboard:', redirectPath)
            await router.push(redirectPath)
          }
        }
      } else {
        // Non-public path
        if (!isLoggedIn) {
          setIsRedirecting(true)
          console.log('Layout: redirecting to login')
          await router.push('/login')
          return
        }

        // Check if user is on the correct dashboard
        if (profile) {
          const correctPath = getRedirectPath(profile.user_type)
          if (pathname !== correctPath) {
            setIsRedirecting(true)
            console.log('Layout: redirecting to correct dashboard:', correctPath)
            await router.push(correctPath)
            return
          }
        }
      }

      setHasCheckedAuth(true)
      setIsRedirecting(false)
    }

    handleAuth()
  }, [isLoading, isLoggedIn, profile, router, publicPaths])

  // Only show loading on initial auth check or during redirects
  if (!hasCheckedAuth || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return <>{children}</>
}

function getRedirectPath(userType: string): string {
  switch (userType) {
    case 'super_admin':
      return '/super-admin-dashboard'
    case 'admin':
      return '/admin-dashboard'
    case 'driver':
      return '/driver-dashboard'
    case 'member':
      return '/dashboard'
    default:
      return '/dashboard'
  }
} 