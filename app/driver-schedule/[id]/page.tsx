'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { DriverProfilePage } from '../../components/driver-profile-page'

// Mock data for the driver
const mockDriver = {
  id: 0,
  name: 'John Doe',
  avatar: '/avatars/john-doe.jpg',
  status: 'Active',
  completedRides: 150,
  ridesToday: 5,
  ridesThisWeek: 20
}

export default function DriverSchedulePage({ params }: { params: { id: string } }) {
  const [driver, setDriver] = useState(mockDriver)
  const router = useRouter()

  useEffect(() => {
    // In a real application, you would fetch the driver data here based on the ID
    console.log('Fetching driver data for ID:', params.id)
    // For now, we'll just use the mock data
    setDriver({ ...mockDriver, id: parseInt(params.id) })
  }, [params.id])

  return (
    <div className="container mx-auto p-4">
      <Button onClick={() => router.back()} className="mb-4">
        Back to Admin Dashboard
      </Button>
      <DriverProfilePage driver={driver} />
    </div>
  )
}

