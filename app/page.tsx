"use client"

import Image from "next/image"
import { useAuth } from "./contexts/auth-context"
import { LoginForm } from "./components/login-form"
import { Scheduler } from "./components/scheduler"
import { UserNav } from "./components/user-nav"
import { useEffect, useState } from 'react'
import { Icons } from '@/components/icons'
import { SuperAdminDashboard } from './components/super-admin-dashboard'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, profile, isLoading, isLoggedIn, isInitialized, role } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    console.log("[HomePage] Auth state:", { isInitialized, isLoggedIn, role, path: window.location.pathname })
    
    if (isInitialized) {
      if (!isLoggedIn) {
        setShowLogin(true)
      } else {
        console.log("[HomePage] User is logged in with role:", role)
        // Redirect based on role
        switch(role) {
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
            router.push('/dashboard')
            break
          default:
            console.error("[HomePage] Unknown user role:", role)
            setShowLogin(true)
        }
      }
    }
  }, [isInitialized, isLoggedIn, role, router])

  if (isLoading) {
    return (
      <main className="container mx-auto p-4 min-h-screen flex flex-col">
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
            <h1 className="text-4xl font-bold">BeLoved Transportation</h1>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col">
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
          <h1 className="text-4xl font-bold">BeLoved Transportation</h1>
        </div>
        {isLoggedIn && <UserNav />}
      </div>
      <div className="flex-grow flex flex-col items-center justify-center">
        {showLogin ? (
          <LoginForm />
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center my-8">
              <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

