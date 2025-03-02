'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'
import { UserNav } from '@/app/components/user-nav'
import Image from 'next/image'

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, isLoading: authLoading, role } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

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

  // If still loading auth or not ready, show loading spinner
  if (authLoading || !hasCheckedAuth || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
          {hasCheckedAuth && !isReady && (
            <p className="text-sm text-gray-500 mt-2">Preparing your dashboard content...</p>
          )}
        </div>
      </div>
    )
  }

  // Don't render the dashboard if auth requirements aren't met
  if (!isLoggedIn || role !== 'super_admin') {
    return null
  }

  return <SuperAdminDashboard />
} 