'use client'

import { ProviderManagement } from '@/app/components/provider-management'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function ProvidersPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.push('/super-admin')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
      <ProviderManagement />
    </div>
  )
} 