'use client'

import { useEffect, useState } from 'react'
import NotFound from '../not-found'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/auth-context'

// Define routes that we know exist
const KNOWN_ROUTES = [
  '/',
  '/login',
  '/admin-dashboard',
  '/driver-dashboard',
  '/member-dashboard',
  '/super-admin-dashboard',
  '/profile',
  '/admin-dashboard/members',
  '/admin-dashboard/vehicles',
  '/admin-dashboard/ride-assignments',
  '/schedule-ride',
  '/dashboard',
  '/auth/callback',
  '/debug-dashboard'
]

// Dynamic route patterns
const DYNAMIC_ROUTE_PATTERNS = [
  '/admin-dashboard/driver/',
  '/admin-dashboard/member/',
  '/admin-dashboard/vehicles/',
  '/driver-dashboard/rides/',
  '/member-dashboard/rides/',
  '/super-admin-dashboard/'
]

export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [is404Error, setIs404Error] = useState(false)
  const [hasCheckedContent, setHasCheckedContent] = useState(false)
  const pathname = usePathname()
  const { isInitialized, isLoading: authLoading } = useAuth()

  useEffect(() => {
    // Reset error state on navigation
    setHasError(false)
    setIs404Error(false)
    setHasCheckedContent(false)

    // Don't do any checks until auth has initialized
    if (!isInitialized) {
      return
    }

    // Check if the current route is one we know exists or matches a dynamic pattern
    const isKnownRoute = KNOWN_ROUTES.some(route => {
      // Check exact match or parent route match
      return pathname === route || 
        (pathname.startsWith(route + '/') && pathname.split('/').length <= route.split('/').length + 2)
    })

    // Check against dynamic route patterns
    const matchesDynamicPattern = DYNAMIC_ROUTE_PATTERNS.some(pattern => 
      pathname.includes(pattern)
    )
    
    // If route is known or matches dynamic pattern, we should not show 404
    if (isKnownRoute || matchesDynamicPattern) {
      return
    }

    // If we're still loading auth or waiting for content, don't show 404 yet
    if (authLoading) {
      return
    }

    // Check for 404 indicators, but with much higher threshold for errors 
    const check404Indicators = () => {
      // Skip check if we have detected loading states on the page
      const hasLoadingIndicator = document.body.textContent?.includes('Loading') ||
        !!document.querySelector('.animate-spin') ||
        !!document.querySelector('[role="progressbar"]')

      if (hasLoadingIndicator) {
        // If we see loading indicators, don't trigger 404
        return
      }

      // Only set hasCheckedContent to true after we've waited long enough
      setHasCheckedContent(true)

      // For mobile - detect if we're in Capacitor
      const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor

      // Look for explicit 404 phrases only
      const bodyText = document.body.textContent || ''
      const is404Page = 
        bodyText.includes('Page not found') && 
        bodyText.includes('404') && 
        bodyText.includes('not found') 

      // Only check for empty content if we've already waited long enough
      const mainContent = document.querySelector('main')
      const isEmptyPage = mainContent && 
                         mainContent.children.length === 0 && 
                         !hasLoadingIndicator && 
                         hasCheckedContent

      // Check if the URL contains patterns that definitely lead to 404s
      const path = window.location.pathname
      const has404Pattern = 
        path.includes('/undefined/') || 
        path.match(/\/undefined$/) ||
        path.includes('/null/') ||
        path.includes('/NaN/')

      // Require multiple conditions to confirm a 404
      const definite404 = (is404Page && isEmptyPage) || has404Pattern

      if (definite404) {
        setIs404Error(true)
      }
    }

    // Run checks after a significant delay to allow for loading
    const timerInitial = setTimeout(() => {
      // First check for early indicators but don't set hasCheckedContent yet
      check404Indicators()
    }, 1000)

    // Run a more thorough check after content has had time to load
    const timerFinal = setTimeout(() => {
      check404Indicators()
    }, 3000)

    // Listen for only very specific navigation errors
    const handleError = (event: ErrorEvent) => {
      // Only react to true 404 errors, not other types
      if (event.error?.message?.includes('404 Not Found')) {
        setHasError(true)
        setIs404Error(true)
      }
    }

    // Add specific listener for fetch errors which explicitly indicate 404s
    const handleFetchError = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('404 Not Found')) {
        setIs404Error(true)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleFetchError)
    
    return () => {
      clearTimeout(timerInitial)
      clearTimeout(timerFinal)
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleFetchError)
    }
  }, [pathname, isInitialized, authLoading])

  if (is404Error) {
    return <NotFound />
  }

  return <>{children}</>
} 