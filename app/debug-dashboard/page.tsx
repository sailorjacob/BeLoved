'use client'

import { useState, useEffect } from 'react'
import { SuperAdminDashboard } from '@/app/components/super-admin-dashboard'
import Image from 'next/image'

// This page is for debugging only - it bypasses authentication
export default function DebugDashboardPage() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait a moment before showing the dashboard to ensure client-side rendering
    const timer = setTimeout(() => {
      console.log('[DebugDashboard] Setting ready state to true')
      setIsReady(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const renderDashboard = () => {
    try {
      console.log('[DebugDashboard] Attempting to render dashboard component')
      return <SuperAdminDashboard isDebugMode={true} />
    } catch (renderError) {
      console.error('[DebugDashboard] Error rendering dashboard:', renderError)
      setError(renderError instanceof Error ? renderError.message : 'Unknown error rendering dashboard')
      return (
        <div className="bg-red-50 border border-red-200 rounded p-4 mt-4">
          <h3 className="text-lg font-medium text-red-800">Rendering Error</h3>
          <p className="text-red-700 mt-2">
            The dashboard component failed to render. Check the console for detailed error messages.
          </p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )
    }
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
          <h1 className="text-4xl font-bold">Debug Dashboard</h1>
        </div>
        <div className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg">
          Debug Mode
        </div>
      </div>

      {!isReady ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          <span className="ml-2">Loading debug dashboard...</span>
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