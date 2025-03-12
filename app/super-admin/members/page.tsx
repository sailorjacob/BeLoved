'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/app/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MembersDirectory } from '@/app/components/members-directory'
import { UserNav } from '@/app/components/user-nav'

export default function MembersDirectoryPage() {
  const { isLoggedIn, isLoading: authLoading, role } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    // Only run the check once auth is no longer loading
    if (!authLoading) {
      setHasCheckedAuth(true)
      
      if (!isLoggedIn) {
        router.push('/')
        return
      }
      
      if (role !== 'super_admin') {
        const dashboardPath = role === 'admin' 
          ? '/admin-dashboard'
          : role === 'driver'
            ? '/driver-dashboard'
            : '/member-dashboard'
        router.push(dashboardPath)
        return
      }
      
      // If we got here, user is logged in as super_admin
      setTimeout(() => {
        setIsReady(true)
      }, 300)
    }
  }, [isLoggedIn, role, router, authLoading])

  // If still loading auth, show loading spinner
  if (authLoading || (!hasCheckedAuth)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show a different loading state if auth is checked but dash not ready
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Preparing directory...</p>
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
          <h1 className="text-4xl font-bold">Members Directory</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/super-admin-dashboard">
              Back to Dashboard
            </Link>
          </Button>
          <UserNav />
        </div>
      </div>
      
      <div>
        <MembersDirectory />
      </div>
    </main>
  )
} 