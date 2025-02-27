'use client'

import { ProviderDetails } from '@/app/components/provider-details'

interface ProviderDetailsPageProps {
  params: {
    id: string
  }
}

export default function ProviderDetailsPage({ params }: ProviderDetailsPageProps) {
  return (
    <div className="container mx-auto py-8">
      <ProviderDetails providerId={params.id} />
    </div>
  )
} 