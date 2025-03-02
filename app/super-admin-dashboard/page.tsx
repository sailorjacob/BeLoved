'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'
import { UserNav } from '@/app/components/user-nav'
import Image from 'next/image'

export default function SuperAdminDashboardPage() {
  const { isLoggedIn, role, isLoading } = useAuth()
  const router = useRouter()
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    console.log('[SuperAdminDashboardPage] Component mounted')
    console.log('[SuperAdminDashboardPage] Auth state:', { isLoggedIn, role, isLoading })
    
    if (!isLoading) {
      if (!isLoggedIn) {
        console.log('[SuperAdminDashboardPage] Not logged in, redirecting to home')
        router.push('/')
        return
      }
      
      if (role !== 'super_admin') {
        console.log('[SuperAdminDashboardPage] Not super admin, redirecting to home')
        router.push('/')
        return
      }

      console.log('[SuperAdminDashboardPage] Auth check passed, user is super admin')
    }
  }, [isLoggedIn, role, isLoading, router])

  // Show loading state while checking auth
  if (isLoading) {
    console.log('[SuperAdminDashboardPage] Loading auth state...')
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!isLoggedIn || role !== 'super_admin') {
    console.log('[SuperAdminDashboardPage] Not authenticated or not super admin, returning null')
    return null
  }

  // Wrap the dashboard component in an error boundary
  const renderDashboard = () => {
    try {
      console.log('[SuperAdminDashboardPage] Attempting to render dashboard')
      return <SuperAdminDashboard />
    } catch (error) {
      console.error('[SuperAdminDashboardPage] Error rendering dashboard:', error)
      setHasError(true)
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error rendering dashboard')
      return (
        <div className="bg-red-50 border border-red-200 rounded p-4 mt-4">
          <h3 className="text-lg font-medium text-red-800">Error rendering dashboard</h3>
          <p className="text-red-700 mt-2">There was an error rendering the dashboard content.</p>
          {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded" 
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      )
    }
  }

  console.log('[SuperAdminDashboardPage] Rendering dashboard for super admin')
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
          <h1 className="text-4xl font-bold">Super Admin Dashboard</h1>
        </div>
        <UserNav />
      </div>
      
      {hasError ? (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="text-lg font-medium text-red-800">Dashboard Error</h3>
          <p className="text-red-700 mt-2">There was an error loading the dashboard content.</p>
          {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded" 
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      ) : (
        <div>
          {/* Fallback content in case dashboard doesn't render */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-700">Total Providers</h3>
              <p className="text-2xl font-bold mt-2">12</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-700">Total Drivers</h3>
              <p className="text-2xl font-bold mt-2">45</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-700">Total Revenue</h3>
              <p className="text-2xl font-bold mt-2">$15,780.50</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-700">Completed Rides</h3>
              <p className="text-2xl font-bold mt-2">320</p>
            </div>
          </div>
          
          {/* Now try to render the actual dashboard component */}
          {renderDashboard()}
        </div>
      )}
    </main>
  )
} 