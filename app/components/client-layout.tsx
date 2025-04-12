'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ErrorBoundaryWrapper } from './error-boundary'
import { Footer } from '@/components/ui/footer'
import { AuthProvider } from '@/app/contexts/auth-context'

interface ClientLayoutProps {
  children: ReactNode
}

function LayoutContent({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
        <Footer />
      </div>
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