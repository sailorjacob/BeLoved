"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/auth-context'
import { UserNav } from '../components/user-nav'
import { DriverDashboard } from '../components/driver-dashboard'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function DriverDashboardPage() {
  const { user, isDriver } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user || !isDriver) {
      router.push('/driver-login')
    }
  }, [user, isDriver, router])

  if (!mounted) {
    return null
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
          <h1 className="text-4xl font-bold">Driver Dashboard</h1>
        </div>
        <UserNav />
      </div>
      <DriverDashboard />
    </main>
  )
}

