'use client'

import * as React from 'react'
import { AuthProvider } from '@/app/contexts/auth-context'
import { Layout } from './layout'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
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
    <AuthProvider>
      <Layout>{children}</Layout>
    </AuthProvider>
  )
} 