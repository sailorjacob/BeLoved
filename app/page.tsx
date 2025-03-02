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

  // Only show login form after we've checked auth status
  useEffect(() => {
    if (isInitialized) {
      if (!isLoggedIn) {
        setShowLogin(true)
      } else if (role) {
        // Redirect to appropriate dashboard based on role
        console.log("[HomePage] User is logged in with role:", role)
        
        // Instead of redirect, we'll show dashboards inline for now
        // This prevents navigation loop issues
      }
    }
  }, [isInitialized, isLoggedIn, role, router])

  // Helper to render the appropriate content based on user role
  const renderDashboardContent = () => {
    console.log("[HomePage] Rendering dashboard for role:", role)
    
    switch(role) {
      case 'super_admin':
        return <SuperAdminDashboard />
      case 'admin':
        return <div className="text-2xl font-semibold">Admin Dashboard</div>
      case 'driver':
        return <div className="text-2xl font-semibold">Driver Dashboard</div>
      case 'member':
        return <Scheduler />
      default:
        return <div className="text-xl">Welcome! Your dashboard is loading...</div>
    }
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
        <UserNav />
      </div>
      <div className="flex-grow flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : user ? (
          // If user is logged in, render appropriate dashboard
          renderDashboardContent()
        ) : (
          showLogin ? (
            <LoginForm />
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center my-8">
                <Icons.spinner className="h-8 w-8 animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">
                Checking authentication status...
              </p>
            </div>
          )
        )}
      </div>
    </main>
  )
}

