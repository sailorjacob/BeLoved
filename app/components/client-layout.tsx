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
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const publicPaths = ['/login', '/driver-login', '/admin-login', '/']
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!isLoading && !isRedirecting && !user && !publicPaths.includes(pathname)) {
      console.log('ClientLayout redirecting to login')
      setIsRedirecting(true)
      router.push('/login')
    }
  }, [user, isLoading, pathname, router, isRedirecting])

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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  )
} 