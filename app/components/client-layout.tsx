'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { AuthProvider } from '@/app/contexts/auth-context'
import { Layout } from './layout'

interface ClientLayoutProps {
  children: React.ReactNode
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
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
      
      <Layout>{children}</Layout>
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