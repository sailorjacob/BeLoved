'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { toast } from '@/components/ui/use-toast'

export default function TripsRedirectPage() {
  const router = useRouter()
  const { isLoggedIn, role } = useAuth()

  useEffect(() => {
    // Inform user about the redirect
    toast({
      title: "Trips Management",
      description: "Redirecting you to your dashboard where all trip information is now managed.",
    })
    
    // Determine which dashboard to redirect to based on role
    if (isLoggedIn) {
      if (role === 'driver') {
        router.push('/driver-dashboard')
      } else if (role === 'admin') {
        router.push('/admin-dashboard')
      } else if (role === 'super_admin') {
        router.push('/super-admin-dashboard')
      } else {
        router.push('/member-dashboard')
      }
    } else {
      router.push('/')
    }
  }, [router, isLoggedIn, role])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4 mx-auto"></div>
        <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
        <p className="text-gray-500">
          The trips management interface has been integrated into your main dashboard.
        </p>
      </div>
    </div>
  )
} 