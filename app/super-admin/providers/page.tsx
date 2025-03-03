'use client'

import { ProviderManagement } from '@/app/components/provider-management'
import { ArrowLeft } from 'lucide-react'

export default function ProvidersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center space-x-4 mb-8">
        <a
          href="/super-admin-dashboard"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          onClick={() => {
            console.log('[ProvidersPage] Navigating back to dashboard via direct link')
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </a>
      </div>
      <h1 className="text-3xl font-bold mb-6">Provider Management</h1>
      <ProviderManagement />
    </div>
  )
} 