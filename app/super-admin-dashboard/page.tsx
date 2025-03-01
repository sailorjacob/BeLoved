'use client'

import { useEffect } from 'react'
import { useAuth } from '@/app/contexts/auth-context'
import { UserNav } from '@/app/components/user-nav'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'
import Image from 'next/image'

const LOGO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, role, isLoading, user, profile } = useAuth()

  useEffect(() => {
    console.log('[SuperAdminDashboard] Auth state:', {
      isLoggedIn,
      role,
      isLoading,
      hasUser: !!user,
      hasProfile: !!profile
    })
  }, [isLoggedIn, role, isLoading, user, profile])

  // Show loading state while checking auth
  if (isLoading) {
    console.log('[SuperAdminDashboard] Loading state')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
      </div>
    )
  }

  // Show unauthorized message if not logged in or not a super admin
  if (!isLoggedIn || role !== 'super_admin') {
    console.log('[SuperAdminDashboard] Unauthorized:', { isLoggedIn, role })
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Unauthorized Access</h1>
          <p className="mt-2">You must be logged in as a super admin to view this page.</p>
          <p className="mt-2 text-sm text-gray-500">Current state: {isLoggedIn ? `Logged in as ${role}` : 'Not logged in'}</p>
          <a href="/" className="mt-4 inline-block text-blue-500 hover:underline">Return to Home</a>
        </div>
      </div>
    )
  }

  console.log('[SuperAdminDashboard] Rendering dashboard for super admin')
  
  // Show the dashboard content
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