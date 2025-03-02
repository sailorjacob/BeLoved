import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@/lib/auth-service'

// Define public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/about',
  '/services',
  '/contact',
  '/terms',
  '/privacy',
  '/debug-dashboard', // Debug route for development
]

// Role-specific common paths
const roleCommonPaths = {
  super_admin: ['/profile'],
  admin: ['/profile'],
  driver: ['/profile', '/trips'],
  member: ['/profile', '/my-rides']
}

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
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
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
  console.log('[Middleware] Processing request for path:', request.nextUrl.pathname)
  
  try {
    const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })
    
    // Try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('[Middleware] Session error:', sessionError)
      return NextResponse.redirect(new URL('/', request.url))
    }

    // If no session and trying to access protected path, redirect to login
    if (!session && !publicPaths.includes(request.nextUrl.pathname)) {
      console.log('[Middleware] No session found, redirecting to login')
      return NextResponse.redirect(new URL('/', request.url))
    }

    // If we have a session, try to get the profile
    if (session?.user?.id) {
      console.log('[Middleware] Session found, fetching profile')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('[Middleware] Profile error:', profileError)
        return NextResponse.redirect(new URL('/', request.url))
      }

      if (!profile) {
        console.error('[Middleware] No profile found for user:', session.user.id)
        return NextResponse.redirect(new URL('/', request.url))
      }

      const userRole = profile.user_type as UserRole
      if (!userRole || !roleCommonPaths[userRole]) {
        console.error('[Middleware] Invalid user role:', userRole)
        return NextResponse.redirect(new URL('/', request.url))
      }

      console.log('[Middleware] User role:', userRole)

      // Check if user is trying to access their allowed paths
      const allowedPaths = [
        ...publicPaths,
        ...roleCommonPaths[userRole],
        `/${userRole}-dashboard`,
        `/${userRole}-dashboard/*`
      ]

      console.log('[Middleware] Allowed paths:', allowedPaths)
      console.log('[Middleware] Requested path:', request.nextUrl.pathname)

      const isAllowed = allowedPaths.some(path => {
        if (path.endsWith('/*')) {
          const basePath = path.slice(0, -2)
          return request.nextUrl.pathname.startsWith(basePath)
        }
        return path === request.nextUrl.pathname
      })

      if (!isAllowed) {
        console.log('[Middleware] Access denied, redirecting to dashboard')
        return NextResponse.redirect(new URL(`/${userRole}-dashboard`, request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error)
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