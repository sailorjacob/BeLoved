'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { UserNav } from '../components/user-nav'
import { DriverDashboard } from '../components/driver-dashboard'
import Image from 'next/image'
import { Star } from 'lucide-react'

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
        <UserNav />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-full">
            <Star className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-800">Crew Carwash Stars</h3>
            <p className="text-sm text-blue-600">Remember to visit Crew Carwash 5 times per week! Track your stars in your profile.</p>
          </div>
        </div>
      </div>
      
      <DriverDashboard />
    </main>
  )
}

