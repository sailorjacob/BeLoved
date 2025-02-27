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
    return null
  }

  return (
    <AuthProvider>
      <Layout>{children}</Layout>
    </AuthProvider>
  )
} 