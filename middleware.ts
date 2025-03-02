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

    // Check if user has access to the requested path
    const userRole = profile?.user_type
    const allowedPaths = protectedPaths[userRole as keyof typeof protectedPaths] || []
    
    if (pathname !== '/' && !allowedPaths.includes(pathname)) {
      console.log('[Middleware] User does not have access to this path:', pathname)
      // Redirect to their appropriate dashboard
      const dashboardPath = getDashboardPath(userRole)
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    }

    return res
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