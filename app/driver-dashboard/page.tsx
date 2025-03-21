'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { UserNav } from '../components/user-nav'
import { DriverDashboard } from '../components/driver-dashboard'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DriverDashboardPage() {
  const { isLoggedIn, isDriver, isInitialized } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle auth redirects
  useEffect(() => {
    if (mounted && isInitialized) {
      if (!isLoggedIn) {
        // Redirect to main login page instead of driver-specific login
        console.log('[DriverDashboardPage] Not logged in, redirecting to home/login')
        router.push('/')
      } else if (!isDriver) {
        // If logged in but not a driver, redirect to appropriate dashboard
        console.log('[DriverDashboardPage] Not a driver, redirecting to home')
        router.push('/')
      }
    }
  }, [isLoggedIn, isDriver, isInitialized, mounted, router])

  // Show nothing while checking auth
  if (!mounted || !isInitialized || !isLoggedIn || !isDriver) {
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
          <h1 className="text-4xl font-bold">Driver Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="hidden sm:flex" 
            onClick={() => router.push('/driver-dashboard/rides')}
          >
            View All My Rides
          </Button>
          <UserNav />
        </div>
      </div>
      
      <div className="sm:hidden mb-4">
        <Button 
          className="w-full bg-red-600 hover:bg-red-700"
          onClick={() => router.push('/driver-dashboard/rides')}
        >
          View All My Rides
        </Button>
      </div>
      
      <DriverDashboard />
    </main>
  )
}

