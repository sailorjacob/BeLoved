import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Only these paths don't require authentication
const publicPaths = ['/', '/auth/callback', '/signup', '/forgot-password']

// Protected paths by role
const protectedPaths = {
  super_admin: ['/super-admin-dashboard'],
  admin: ['/admin-dashboard'],
  driver: ['/driver-dashboard'],
  member: ['/dashboard']
}

// CSP Headers for production
const getSecurityHeaders = () => ({
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    connect-src 'self' https: wss:;
    frame-ancestors 'none';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim(),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
})

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const pathname = request.nextUrl.pathname

  console.log('[Middleware] Processing request:', pathname)

  try {
    // Apply security headers in production only
    if (process.env.NODE_ENV === 'production') {
      const securityHeaders = getSecurityHeaders()
      Object.entries(securityHeaders).forEach(([key, value]) => {
        res.headers.set(key, value)
      })
    }

    // Skip auth check for public routes
    if (publicPaths.includes(pathname)) {
      console.log('[Middleware] Public path, skipping auth check:', pathname)
      return res
    }

    // Check session and profile
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('[Middleware] No session, redirecting to home')
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single()

    console.log('[Middleware] Profile:', profile)

    // If no profile or user type, redirect to home
    if (!profile?.user_type) {
      console.log('[Middleware] No profile or user type, redirecting to home')
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Allow access to the user's dashboard
    const userDashboard = getDashboardPath(profile.user_type)
    if (pathname === userDashboard) {
      console.log('[Middleware] Allowing access to dashboard:', pathname)
      return res
    }

    // If trying to access another path, redirect to their dashboard
    console.log('[Middleware] Redirecting to user dashboard:', userDashboard)
    return NextResponse.redirect(new URL(userDashboard, request.url))

  } catch (error) {
    console.error('[Middleware] Error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}

function getDashboardPath(role: string | null): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin-dashboard'
    case 'admin':
      return '/admin-dashboard'
    case 'driver':
      return '/driver-dashboard'
    case 'member':
      return '/dashboard'
    default:
      return '/'
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
} 