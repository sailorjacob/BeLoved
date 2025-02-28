'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'

interface LayoutProps {
  children: React.ReactNode
  publicPaths?: string[]
}

export function Layout({ children, publicPaths = ['/login', '/auth/callback', '/'] }: LayoutProps) {
  console.log('[Layout] Rendering')
  
  const router = useRouter()
  const { isLoggedIn, isLoading, profile } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const redirectLockRef = useRef(false)
  const lastPathRef = useRef(window.location.pathname)
  const initialCheckDoneRef = useRef(false)

  // Handle initial auth check
  useEffect(() => {
    if (!isLoading && !initialCheckDoneRef.current) {
      console.log('[Layout] Initial auth check complete')
      initialCheckDoneRef.current = true
      setHasCheckedAuth(true)
    }
  }, [isLoading])

  useEffect(() => {
    console.log('[Layout] Auth state changed:', { isLoggedIn, isLoading, userType: profile?.user_type })
  }, [isLoggedIn, isLoading, profile])

  useEffect(() => {
    const handleAuth = async () => {
      if (isLoading || redirectLockRef.current) {
        console.log('[Layout] Skipping auth check:', { isLoading, isLocked: redirectLockRef.current })
        return
      }

      const pathname = window.location.pathname
      if (pathname === lastPathRef.current) {
        console.log('[Layout] Path unchanged:', pathname)
        return
      }
      lastPathRef.current = pathname
      console.log('[Layout] Checking path:', pathname)

      try {
        redirectLockRef.current = true
        console.log('[Layout] Starting auth check:', { isLoggedIn, hasProfile: !!profile })
        
        // If we're on a public path and logged in with a profile
        if (publicPaths.includes(pathname) && isLoggedIn && profile) {
          const redirectPath = getRedirectPath(profile.user_type)
          if (pathname !== redirectPath) {
            console.log('[Layout] Public path redirect:', { from: pathname, to: redirectPath })
            setIsRedirecting(true)
            await router.replace(redirectPath)
            return
          }
        }
        
        // Non-public path and not logged in
        if (!publicPaths.includes(pathname) && !isLoggedIn) {
          console.log('[Layout] Unauthorized redirect to login')
          setIsRedirecting(true)
          await router.replace('/login')
          return
        }

        // Check if user is on the correct dashboard
        if (!publicPaths.includes(pathname) && profile) {
          const correctPath = getRedirectPath(profile.user_type)
          if (pathname !== correctPath) {
            console.log('[Layout] Wrong dashboard redirect:', { from: pathname, to: correctPath })
            setIsRedirecting(true)
            await router.replace(correctPath)
            return
          }
        }

        console.log('[Layout] No redirect needed')
        setIsRedirecting(false)
      } catch (error) {
        console.error('[Layout] Error during auth redirect:', error)
        setIsRedirecting(false)
      } finally {
        redirectLockRef.current = false
      }
    }

    if (hasCheckedAuth) {
      handleAuth()
    }
  }, [isLoading, isLoggedIn, profile, router, publicPaths, hasCheckedAuth])

  // Only show loading on initial auth check or during redirects
  if (!hasCheckedAuth || isRedirecting) {
    console.log('[Layout] Showing loading state:', { hasCheckedAuth, isRedirecting })
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