'use client'

import * as React from 'react'
import { AuthProvider } from '@/app/contexts/auth-context'

interface ClientLayoutProps {
  children: React.ReactNode
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {process.env.NEXT_PUBLIC_ENV !== 'production' && (
        <div className="bg-yellow-400 text-black p-2 text-center text-sm font-medium">
          {process.env.NEXT_PUBLIC_ENV === 'development' ? 'Development' : 'Staging'} Environment
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  )
} 