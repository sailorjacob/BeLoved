'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export default function DriverRidesPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Inform user that the interface has been consolidated
    toast({
      title: "Dashboard Update",
      description: "The rides interface is now integrated into the main driver dashboard for better accessibility.",
    })
    
    // Redirect to the main dashboard
    router.push('/driver-dashboard')
  }, [router])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4 mx-auto"></div>
        <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
        <p className="text-gray-500">
          The ride management interface has been integrated into the main driver dashboard.
        </p>
      </div>
    </div>
  )
} 