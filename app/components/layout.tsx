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
  
  const { isLoading } = useAuth()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const initialCheckDoneRef = useRef(false)

  // Handle initial auth check
  useEffect(() => {
    if (!isLoading && !initialCheckDoneRef.current) {
      console.log('[Layout] Initial auth check complete')
      initialCheckDoneRef.current = true
      setHasCheckedAuth(true)
    }
  }, [isLoading])

  // Only show loading on initial auth check
  if (!hasCheckedAuth) {
    console.log('[Layout] Showing loading state:', { hasCheckedAuth })
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