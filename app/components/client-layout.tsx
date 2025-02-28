'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { AuthProvider } from '@/app/contexts/auth-context'
import { useAuth } from '@/app/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'

interface ClientLayoutProps {
  children: React.ReactNode
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const publicPaths = ['/login', '/driver-login', '/admin-login', '/']
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const handleAuth = async () => {
      if (!isLoading && !isRedirecting) {
        // If on a public path and logged in, redirect to appropriate dashboard
        if (publicPaths.includes(pathname) && user && profile) {
          setIsRedirecting(true)
          console.log('ClientLayout: redirecting logged in user from public path')
          switch (profile.user_type) {
            case 'super_admin':
              await router.push('/super-admin-dashboard')
              break
            case 'admin':
              await router.push('/admin-dashboard')
              break
            case 'driver':
              await router.push('/driver-dashboard')
              break
            default:
              await router.push('/dashboard')
          }
          return
        }

        // If not on a public path and not logged in, redirect to login
        if (!publicPaths.includes(pathname) && !user) {
          setIsRedirecting(true)
          console.log('ClientLayout: redirecting to login')
          await router.push('/login')
        }
      }
    }

    handleAuth()
  }, [user, profile, isLoading, pathname, router, publicPaths, isRedirecting, isMounted])

  if (!isMounted) return null

  if (isLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {process.env.NEXT_PUBLIC_ENV !== 'production' && (
        <div className="bg-yellow-400 text-black p-2 text-center text-sm font-medium">
          {process.env.NEXT_PUBLIC_ENV === 'development' ? 'Development' : 'Staging'} Environment
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  )
} 