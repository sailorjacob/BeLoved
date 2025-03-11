'use client'

import { AdminDashboard } from '../components/admin-dashboard'
import { UserNav } from '../components/user-nav'
import { useAuth } from '@/app/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function AdminDashboardPage() {
  const { isLoggedIn, isAdmin, isInitialized } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle auth redirects
  useEffect(() => {
    if (mounted && isInitialized) {
      if (!isLoggedIn) {
        // Redirect to main login page if not logged in
        console.log('[AdminDashboardPage] Not logged in, redirecting to home/login')
        router.push('/')
      } else if (!isAdmin) {
        // If logged in but not an admin, redirect to appropriate dashboard
        console.log('[AdminDashboardPage] Not an admin, redirecting to home')
        router.push('/')
      }
    }
  }, [isLoggedIn, isAdmin, isInitialized, mounted, router])

  // Show nothing while checking auth
  if (!mounted || !isInitialized || !isLoggedIn || !isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading dashboard...</div>
          <div className="text-sm text-gray-500">Please wait while we verify your account</div>
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
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"
              alt="BeLoved Transportation Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        </div>
        <UserNav />
      </div>
      <AdminDashboard />
    </main>
  )
}

