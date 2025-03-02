'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, role, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('[SuperAdminDashboard] Auth state:', { isLoggedIn, role, isLoading })
    
    if (!isLoading) {
      if (!isLoggedIn) {
        console.log('[SuperAdminDashboard] Not logged in, redirecting to home')
        router.replace('/')
        return
      }
      
      if (role !== 'super_admin') {
        console.log('[SuperAdminDashboard] Not super admin, redirecting to home')
        router.replace('/')
        return
      }
    }
  }, [isLoggedIn, role, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!isLoggedIn || role !== 'super_admin') {
    return null
  }

  console.log('[SuperAdminDashboard] Rendering dashboard for super admin')
  return <SuperAdminDashboard />
} 