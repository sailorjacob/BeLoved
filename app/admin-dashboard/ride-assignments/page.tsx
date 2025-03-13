'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { ProviderRideAssignments } from '@/app/components/provider-ride-assignments'
import Image from 'next/image'
import { UserNav } from '@/app/components/user-nav'
import { Button } from '@/components/ui/button'

export default function AdminRideAssignmentsPage() {
  const { isLoggedIn, isLoading: authLoading, role } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/')
        return
      }
      
      if (role !== 'admin') {
        const dashboardPath = role === 'super_admin' 
          ? '/super-admin-dashboard'
          : role === 'driver'
            ? '/driver-dashboard'
            : '/member-dashboard'
        router.push(dashboardPath)
        return
      }
      
      setIsReady(true)
    }
  }, [isLoggedIn, role, router, authLoading])

  if (authLoading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

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
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        </div>
        <UserNav />
      </div>
      
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/admin-dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>
      
      <h2 className="text-2xl font-bold mb-6">Ride Assignments</h2>
      
      <ProviderRideAssignments />
    </main>
  )
} 