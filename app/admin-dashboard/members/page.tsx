'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/app/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminMembersDirectory } from '@/app/components/admin-members-directory'
import { UserNav } from '@/app/components/user-nav'
import { supabase } from '@/lib/supabase'

export default function AdminMembersDirectoryPage() {
  const { isLoggedIn, isLoading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [providerId, setProviderId] = useState<string | null>(null)

  useEffect(() => {
    // Only run the check once auth is no longer loading
    if (!authLoading) {
      setHasCheckedAuth(true)
      
      if (!isLoggedIn) {
        router.push('/')
        return
      }
      
      if (!isAdmin) {
        router.push('/')
        return
      }
      
      // Get the provider ID for the current admin
      const getProviderId = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user) {
            throw new Error('No session found')
          }
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('provider_id')
            .eq('id', session.user.id)
            .single()
            
          if (error) throw error
          
          if (!profile?.provider_id) {
            throw new Error('No provider ID found for user')
          }
          
          setProviderId(profile.provider_id)
          setIsReady(true)
        } catch (error) {
          console.error('Error fetching provider ID:', error)
          router.push('/admin-dashboard')
        }
      }
      
      getProviderId()
    }
  }, [isLoggedIn, isAdmin, router, authLoading])

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
  if (!isReady || !providerId) {
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
            <Link href="/admin-dashboard">
              Back to Dashboard
            </Link>
          </Button>
          <UserNav />
        </div>
      </div>
      
      <div>
        <AdminMembersDirectory 
          providerId={providerId}
          onViewProfile={(memberId) => router.push(`/admin-dashboard/member/${memberId}`)}
        />
      </div>
    </main>
  )
} 