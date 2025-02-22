"use client"

import { DriverLoginForm } from '../components/driver-login-form'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function DriverLoginPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
        <div className="flex items-center gap-2 mb-8">
          <div className="relative w-12 h-12">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"
              alt="BeLoved Transportation Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold">BeLoved Transportation</h1>
        </div>
        <DriverLoginForm />
      </div>
    </main>
  )
}

