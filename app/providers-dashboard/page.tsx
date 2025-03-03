'use client'

import { ProviderManagement } from '@/app/components/provider-management'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useAuth } from '@/app/contexts/auth-context'

export default function ProvidersDashboardPage() {
  const { isLoggedIn, role, isInitialized } = useAuth()

  useEffect(() => {
    console.log('[ProvidersDashboardPage] Mounted. Auth state:', { isLoggedIn, role, isInitialized })
  }, [isLoggedIn, role, isInitialized])

  if (!isInitialized) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          <span className="ml-2">Initializing authentication...</span>
        </div>
      </div>
    )
  }

  if (!isLoggedIn || role !== 'super_admin') {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">Access Denied</h3>
          <p>You must be logged in as a Super Admin to view this page.</p>
          <div className="mt-3">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center space-x-4 mb-8">
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </a>
      </div>
      <h1 className="text-3xl font-bold mb-6">Provider Management</h1>
      <ProviderManagement />
    </div>
  )
} 