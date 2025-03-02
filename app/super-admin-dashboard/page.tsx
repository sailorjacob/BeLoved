'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, role, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || role !== 'super_admin')) {
      console.log('[SuperAdminDashboard] Unauthorized access, redirecting to home')
      router.replace('/')
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

  return <SuperAdminDashboard />
} 