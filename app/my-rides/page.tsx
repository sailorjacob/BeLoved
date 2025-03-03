'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { MyRides } from "../components/my-rides"
import { UserNav } from "../components/user-nav"
import { useAuth } from '@/app/contexts/auth-context'

export default function MyRidesPage() {
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('[MyRides] Auth state:', { isLoggedIn, isLoading, path: window.location.pathname })
    
    if (!isLoading && !isLoggedIn) {
      console.log('[MyRides] Unauthorized access, redirecting to home')
      
      // EMERGENCY DIRECT NAVIGATION: Completely bypass Next.js routing
      console.log('[MyRides] EMERGENCY DIRECT NAVIGATION to home');
      window.location.href = window.location.origin + '/';
    }
  }, [isLoading, isLoggedIn, router])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
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
          <h1 className="text-4xl font-bold">My Rides</h1>
        </div>
        <UserNav />
      </div>
      <MyRides />
    </main>
  )
}

