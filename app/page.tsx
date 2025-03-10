"use client"

import Image from "next/image"
import { useAuth } from "./contexts/auth-context"
import { LoginForm } from "./components/login-form"
import { Scheduler } from "./components/scheduler"
import { UserNav } from "./components/user-nav"
import { useEffect } from 'react'
import { Icons } from '@/components/icons'
import { SuperAdminDashboard } from './components/super-admin-dashboard'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isInitialized, isLoggedIn, role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('[HomePage] Auth state:', { isInitialized, isLoggedIn, role, path: window.location.pathname })

    if (isInitialized && isLoggedIn) {
      console.log('[HomePage] User is logged in with role:', role)

      // Handle case where user is logged in but role is null
      if (!role) {
        console.log('[HomePage] User has no role, redirecting to default super admin dashboard')
        // Default to super admin dashboard if role is null but user is logged in
        router.push('/super-admin-dashboard')
        return
      }
      
      // Redirect based on role
      switch (role) {
        case 'super_admin':
          router.push('/super-admin-dashboard')
          break
        case 'admin':
          router.push('/admin-dashboard')
          break
        case 'driver':
          router.push('/driver-dashboard')
          break
        case 'member':
          router.push('/member-dashboard')
          break
        default:
          console.error('[HomePage] Unknown user role:', role)
      }
    }
  }, [isInitialized, isLoggedIn, role, router])

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <Image 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png" 
            alt="BeLoved Logo" 
            width={128} 
            height={64} 
            className="mx-auto" 
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            BeLoved Transportation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connecting riders with reliable transportation
          </p>
        </div>

        {isInitialized && !isLoggedIn && (
          <LoginForm />
        )}

        {isInitialized && isLoggedIn && (
          <div className="text-center">
            <svg className="inline w-8 h-8 text-gray-200 animate-spin fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </main>
  )
}

