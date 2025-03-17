'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/auth-context'
import { DriverPortal } from '../components/driver-portal'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function DriverDashboardPage() {
  const { user, profile, logout } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated and has the driver role
    if (!user) {
      router.push('/login')
      return
    }

    if (profile && profile.user_role !== 'driver') {
      // Redirect to appropriate dashboard based on role
      if (profile.user_role === 'admin') {
        router.push('/admin-dashboard')
      } else if (profile.user_role === 'super_admin') {
        router.push('/providers-dashboard')
      } else {
        router.push('/dashboard')
      }
      return
    }

    setIsLoading(false)
  }, [user, profile, router])

  const handleSignOut = async () => {
    await logout()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
      
      {profile && profile.provider_id && (
        <DriverPortal providerId={profile.provider_id} />
      )}
      
      {(!profile || !profile.provider_id) && (
        <div className="text-center p-12 border rounded-lg bg-muted/50">
          <h2 className="text-2xl font-bold">Missing Provider Assignment</h2>
          <p className="mt-2 text-muted-foreground">
            Your account is not currently assigned to a transportation provider.
            Please contact your administrator for assistance.
          </p>
        </div>
      )}
    </div>
  )
}

