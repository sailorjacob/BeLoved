'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { MemberRideStatus } from '@/app/components/member-ride-status'
import Image from 'next/image'
import { UserNav } from '@/app/components/user-nav'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MemberRidesPage() {
  const { isLoggedIn, isLoading: authLoading, role } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const memberRideStatusRef = useRef<{ fetchRides: () => Promise<void> }>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/')
        return
      }
      
      if (role !== 'member') {
        const dashboardPath = role === 'super_admin' 
          ? '/super-admin-dashboard'
          : role === 'admin'
            ? '/admin-dashboard'
            : '/driver-dashboard'
        router.push(dashboardPath)
        return
      }
      
      setIsReady(true)
    }
  }, [isLoggedIn, role, router, authLoading])

  const handleRefresh = () => {
    if (memberRideStatusRef.current) {
      memberRideStatusRef.current.fetchRides();
    } else {
      router.refresh();
    }
  };

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
          <h1 className="text-4xl font-bold">Member Dashboard</h1>
        </div>
        <UserNav />
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/member-dashboard')}>
          ← Back to Dashboard
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button asChild className="bg-red-500 hover:bg-red-600">
            <Link href="/schedule-ride">Schedule New Ride</Link>
          </Button>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">My Rides</h2>
      <MemberRideStatus ref={memberRideStatusRef} />
    </main>
  )
} 