'use client'

import { useEffect, useState, useRef } from 'react'
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
  const redirectLockRef = useRef(false)
  const lastPathRef = useRef(window.location.pathname)

  useEffect(() => {
    const handleAuth = async () => {
      if (isLoading || redirectLockRef.current) return

      const pathname = window.location.pathname
      if (pathname === lastPathRef.current) return
      lastPathRef.current = pathname

      try {
        redirectLockRef.current = true
        
        // If we're on a public path and logged in with a profile
        if (publicPaths.includes(pathname) && isLoggedIn && profile) {
          const redirectPath = getRedirectPath(profile.user_type)
          if (pathname !== redirectPath) {
            setIsRedirecting(true)
            await router.replace(redirectPath)
            return
          }
        }
        
        // Non-public path and not logged in
        if (!publicPaths.includes(pathname) && !isLoggedIn) {
          setIsRedirecting(true)
          await router.replace('/login')
          return
        }

        // Check if user is on the correct dashboard
        if (!publicPaths.includes(pathname) && profile) {
          const correctPath = getRedirectPath(profile.user_type)
          if (pathname !== correctPath) {
            setIsRedirecting(true)
            await router.replace(correctPath)
            return
          }
        }

        setIsRedirecting(false)
        setHasCheckedAuth(true)
      } catch (error) {
        console.error('Error during auth redirect:', error)
        setIsRedirecting(false)
        setHasCheckedAuth(true)
      } finally {
        redirectLockRef.current = false
      }
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