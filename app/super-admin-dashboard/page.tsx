'use client'

import { useAuth } from '@/app/contexts/auth-context'
import { UserNav } from '@/app/components/user-nav'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const LOGO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, role, isLoading, user, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('[SuperAdminDashboard] Auth state:', { isLoggedIn, role, isLoading, hasUser: !!user, hasProfile: !!profile })
    
    // Only redirect if we're done loading and the user is either not logged in or not a super admin
    if (!isLoading) {
      if (!isLoggedIn) {
        console.log('[SuperAdminDashboard] Not logged in, redirecting to home')
        router.replace('/')
      } else if (role !== 'super_admin') {
        console.log('[SuperAdminDashboard] Not a super admin, redirecting to appropriate dashboard')
        router.replace('/')
      }
    }
  }, [isLoading, isLoggedIn, role, router, user, profile])

  // Show loading state while checking auth
  if (isLoading) {
    console.log('[SuperAdminDashboard] Loading auth state...')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
      </div>
    )
  }

  // If not logged in or not a super admin, show nothing (redirect will happen)
  if (!isLoggedIn || role !== 'super_admin') {
    console.log('[SuperAdminDashboard] Access denied:', { isLoggedIn, role })
    return null
  }

  console.log('[SuperAdminDashboard] Rendering dashboard for super admin')
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