'use client'

import { ProviderManagement } from '@/app/components/provider-management'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ProvidersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="outline"
          onClick={() => {
            console.log('[ProvidersPage] Navigating back to dashboard')
            // Use direct navigation for maximum reliability
            window.location.href = '/super-admin-dashboard'
          }}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Provider Management</h1>
      <ProviderManagement />
    </div>
  )
} 