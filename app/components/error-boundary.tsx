'use client'

import { useEffect, useState } from 'react'
import NotFound from '../not-found'
import { usePathname } from 'next/navigation'

// Define routes that we know exist
const KNOWN_ROUTES = [
  '/',
  '/login',
  '/admin-dashboard',
  '/driver-dashboard',
  '/member-dashboard',
  '/profile',
  '/admin-dashboard/members',
  '/admin-dashboard/vehicles',
  '/admin-dashboard/ride-assignments',
  '/schedule-ride',
  '/dashboard',
  '/auth/callback'
]

export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [is404Error, setIs404Error] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Reset error state on navigation
    setHasError(false)
    setIs404Error(false)

    // Check if the current route is one we know doesn't exist
    const isKnownRoute = KNOWN_ROUTES.some(route => {
      // Check exact match or parent route match
      return pathname === route || 
        (pathname.startsWith(route + '/') && pathname.split('/').length <= route.split('/').length + 2)
    })
    
    // If not a known route and doesn't match certain patterns, it's likely a 404
    if (!isKnownRoute && 
        !pathname.includes('/admin-dashboard/driver/') && 
        !pathname.includes('/admin-dashboard/member/') && 
        !pathname.includes('/admin-dashboard/vehicles/') &&
        !pathname.includes('/driver-dashboard/rides/') &&
        !pathname.includes('/member-dashboard/rides/')) {
      // Delay setting to allow for any async route loading
      setTimeout(() => setIs404Error(true), 100)
      return
    }

    // Additional checks for 404 indicators in the DOM
    const check404Indicators = () => {
      // For mobile - detect if we're in Capacitor
      const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor

      // Look for common phrases that might indicate a 404
      const bodyText = document.body.textContent || ''
      const is404Page = 
        bodyText.includes('Page not found') || 
        bodyText.includes('404') || 
        bodyText.includes('not found') ||
        bodyText.includes('doesn\'t exist')

      // Check for empty content sections which might indicate a missing page
      const mainContent = document.querySelector('main')
      const isEmptyPage = mainContent && mainContent.children.length === 0

      // Check if the URL contains patterns that often lead to 404s
      const path = window.location.pathname
      const has404Pattern = 
        path.includes('/undefined') || 
        path.match(/\/[^/]+\/undefined/) ||
        path.includes('/null') ||
        path.includes('/NaN')

      // Special handling for Capacitor - additional checks
      if (isCapacitor) {
        // Check if the page has no meaningful content
        const hasContent = !!document.querySelector('h1') || 
                         !!document.querySelector('h2') || 
                         !!document.querySelector('main > div')
        
        if (!hasContent && !isKnownRoute) {
          setIs404Error(true)
          return
        }
      }

      if (is404Page || isEmptyPage || has404Pattern) {
        setIs404Error(true)
      }
    }

    // Run checks after DOM has loaded and again after any dynamic content loads
    const timerQuick = setTimeout(check404Indicators, 100)
    const timerSlow = setTimeout(check404Indicators, 500)

    // Listen for potential navigation errors
    const handleError = (event: ErrorEvent) => {
      console.log('Caught error:', event.error)
      if (
        event.error?.message?.includes('Failed to load') || 
        event.error?.message?.includes('404') ||
        event.error?.message?.includes('not found')
      ) {
        setHasError(true)
        setIs404Error(true)
      }
    }

    // Add specific listener for fetch errors which often indicate 404s
    const handleFetchError = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('404') ||
          event.reason?.message?.includes('not found')) {
        setIs404Error(true)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleFetchError)
    
    return () => {
      clearTimeout(timerQuick)
      clearTimeout(timerSlow)
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleFetchError)
    }
  }, [pathname])

  if (is404Error) {
    return <NotFound />
  }

  return <>{children}</>
} 