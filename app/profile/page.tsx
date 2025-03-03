'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ProfileForm } from '../components/profile-form'
import { UserNav } from '../components/user-nav'
import { useAuth } from '@/app/contexts/auth-context'

export default function ProfilePage() {
  const { isLoggedIn, isLoading, user, profile } = useAuth()
  const router = useRouter()

  // Add a debug log when the component mounts
  useEffect(() => {
    console.log('[ProfilePage] Component mounted')
    return () => {
      console.log('[ProfilePage] Component unmounted')
    }
  }, [])

  useEffect(() => {
    console.log('[ProfilePage] Auth state:', { isLoggedIn, isLoading, userId: user?.id, profileId: profile?.id })
    
    if (!isLoading) {
      if (!isLoggedIn) {
        console.log('[ProfilePage] Not logged in, redirecting to home')
        
        // EMERGENCY DIRECT NAVIGATION: Completely bypass Next.js routing
        console.log('[ProfilePage] EMERGENCY DIRECT NAVIGATION to home');
        window.location.href = window.location.origin + '/';
        return;
      }
      console.log('[ProfilePage] Auth check passed, user is logged in')
    }
  }, [isLoading, isLoggedIn, router, user, profile])

  if (isLoading) {
    console.log('[ProfilePage] Loading auth state...')
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!isLoggedIn) {
    console.log('[ProfilePage] Not authenticated, returning null')
    return null
  }

  console.log('[ProfilePage] Rendering profile page')

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
          <h1 className="text-4xl font-bold">Profile</h1>
        </div>
        <UserNav />
      </div>
      <ProfileForm />
    </main>
  )
}

