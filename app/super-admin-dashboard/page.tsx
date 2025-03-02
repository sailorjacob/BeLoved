'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'
import Image from 'next/image'
import { UserNav } from '@/app/components/user-nav'

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, isLoading: authLoading, role } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [forceRender, setForceRender] = useState(false)

  // Log every render and state
  console.log('[SuperAdminPage] Rendering with state:', { 
    isLoggedIn, role, authLoading, isReady, hasCheckedAuth, forceRender 
  })

  useEffect(() => {
    console.log('[SuperAdminPage] Initial render, auth state:', { isLoggedIn, role, authLoading })
    
    // Only run the check once auth is no longer loading
    if (!authLoading) {
      console.log('[SuperAdminPage] Auth loading complete, checking access:', { isLoggedIn, role })
      setHasCheckedAuth(true)
      
      if (!isLoggedIn) {
        console.log('[SuperAdminPage] User not logged in, redirecting to home')
        router.push('/')
        return
      }
      
      if (role !== 'super_admin') {
        console.log('[SuperAdminPage] User does not have super_admin role, redirecting to appropriate dashboard')
        const dashboardPath = role === 'admin' 
          ? '/admin-dashboard'
          : role === 'driver'
            ? '/driver-dashboard'
            : '/member-dashboard'
        router.push(dashboardPath)
        return
      }
      
      // If we got here, user is logged in as super_admin
      console.log('[SuperAdminPage] User authenticated as super_admin, showing dashboard')
      // Add a small delay to ensure any route transitions have completed
      setTimeout(() => {
        setIsReady(true)
      }, 300)
    }
  }, [isLoggedIn, role, router, authLoading])

  // Force render after 2 seconds if still not ready but auth is complete
  useEffect(() => {
    if (hasCheckedAuth && !isReady && isLoggedIn && role === 'super_admin') {
      const timer = setTimeout(() => {
        console.log('[SuperAdminPage] Force rendering dashboard after timeout')
        setForceRender(true)
        setIsReady(true)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [hasCheckedAuth, isReady, isLoggedIn, role])

  // If still loading auth, show loading spinner
  if (authLoading || (!hasCheckedAuth && !forceRender)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show a different loading state if auth is checked but dash not ready
  if (!isReady && !forceRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Preparing dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Authentication complete, loading content...</p>
        </div>
      </div>
    )
  }

  // If we're forcing render or ready, render the dashboard
  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"
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
      
      <div>
        {/* Render the actual dashboard component with flag to indicate we're in forced render mode */}
        <SuperAdminDashboard isDebugMode={forceRender} />
      </div>
    </main>
  )
} 