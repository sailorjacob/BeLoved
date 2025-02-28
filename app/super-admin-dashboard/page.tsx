'use client'

import { useAuth } from '@/app/contexts/auth-context'
import { UserNav } from '@/app/components/user-nav'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'
import Image from 'next/image'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const LOGO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <Image
            src={LOGO_URL}
            alt="BeLoved Transportation Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, isSuperAdmin, isLoading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const isMounted = useRef(true)
  const redirectTimeoutRef = useRef<NodeJS.Timeout>()

  const safeSetState = useCallback((value: boolean) => {
    if (isMounted.current) {
      setIsRedirecting(value)
    }
  }, [])

  const handleRedirect = useCallback((path: string) => {
    if (!isMounted.current) return

    safeSetState(true)
    redirectTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        router.replace(path)
      }
    }, 100)
  }, [router, safeSetState])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    console.log('[SuperAdminDashboard] Auth state:', { isLoggedIn, isSuperAdmin, isLoading })
    
    // Clear any existing redirect timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
    }
    
    if (!isLoading) {
      if (!isLoggedIn) {
        console.log('[SuperAdminDashboard] Not logged in, redirecting to login')
        handleRedirect('/login')
        return
      }

      if (!isSuperAdmin) {
        console.log('[SuperAdminDashboard] Not super admin, redirecting to dashboard')
        handleRedirect('/dashboard')
        return
      }

      safeSetState(false)
    }
  }, [isLoggedIn, isSuperAdmin, isLoading, handleRedirect, safeSetState])

  // Show loading state while checking auth or during redirect
  if (isLoading || isRedirecting || !isLoggedIn || !isSuperAdmin) {
    return <LoadingSpinner />
  }

  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12">
            <Image
              src={LOGO_URL}
              alt="BeLoved Transportation Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold">Super Admin Dashboard</h1>
        </div>
        <UserNav />
      </div>
      <SuperAdminDashboard />
    </main>
  )
} 