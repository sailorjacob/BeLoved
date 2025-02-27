'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { AuthProvider } from '@/hooks/useAuth'
import { Layout } from './layout'

interface AuthWrapperProps {
  children: React.ReactNode
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
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
    <AuthProvider>
      <Layout>{children}</Layout>
    </AuthProvider>
  )
} 