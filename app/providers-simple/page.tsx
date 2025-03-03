'use client'

import { ProviderManagement } from '@/app/components/provider-management'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * Simplified Provider Management page that renders directly
 * without complex navigation or authentication dependencies
 */
export default function ProvidersSimplePage() {
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    console.log('[ProvidersSimplePage] Component mounted')
    
    // Simple timeout to simulate authentication check
    const timer = setTimeout(() => {
      console.log('[ProvidersSimplePage] Done loading')
      setIsLoading(false)
    }, 1000)
    
    return () => {
      clearTimeout(timer)
      console.log('[ProvidersSimplePage] Component unmounted')
    }
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          <span className="ml-2">Loading provider management...</span>
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
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium mb-2">Demo Mode Notice</h3>
        <p>You are viewing the Provider Management page in demo mode. No authentication is required.</p>
      </div>
      <h1 className="text-3xl font-bold mb-6">Provider Management</h1>
      <ProviderManagement />
    </div>
  )
} 