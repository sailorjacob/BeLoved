'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'
import { UserNav } from '@/app/components/user-nav'
import Image from 'next/image'

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, role, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('[SuperAdminDashboard] Auth state:', { isLoggedIn, role, isLoading })
    
    if (!isLoading && !isLoggedIn) {
      console.log('[SuperAdminDashboard] Not logged in, redirecting to home')
      router.replace('/')
      return
    }
    
    if (!isLoading && role !== 'super_admin') {
      console.log('[SuperAdminDashboard] Not super admin, redirecting to home')
      router.replace('/')
      return
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
      <SuperAdminDashboard />
    </main>
  )
} 