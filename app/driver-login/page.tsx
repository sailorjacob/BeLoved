'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DriverLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main login page since we don't need a separate driver login
    console.log('[DriverLoginRedirect] Redirecting to main page')
    router.push('/')
  }, [router])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Redirecting...</div>
        <div className="text-sm text-gray-500">Please wait while we redirect you to the login page</div>
      </div>
    </div>
  )
}

