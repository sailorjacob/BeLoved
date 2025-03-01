'use client'

import { useAuth } from '@/app/contexts/auth-context'
import { UserNav } from '@/app/components/user-nav'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const LOGO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, role, isLoading } = useAuth()
  const router = useRouter()

  console.log('[SuperAdminDashboard] Auth state:', { isLoggedIn, role, isLoading })

  useEffect(() => {
    console.log('[SuperAdminDashboard] Checking auth...', { isLoggedIn, role, isLoading })
    
    if (!isLoading) {
      if (!isLoggedIn) {
        console.log('[SuperAdminDashboard] Not logged in, redirecting to login')
        router.push('/login')
      } else if (role !== 'super_admin') {
        console.log('[SuperAdminDashboard] Not super admin, redirecting to appropriate dashboard')
        switch (role) {
          case 'admin':
            router.push('/admin-dashboard')
            break
          case 'driver':
            router.push('/driver-dashboard')
            break
          case 'member':
            router.push('/dashboard')
            break
          default:
            router.push('/login')
        }
      }
    }
  }, [isLoading, isLoggedIn, role, router])

  // Show loading state while checking auth or if not logged in
  if (isLoading || !isLoggedIn || role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
          <p className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    )
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