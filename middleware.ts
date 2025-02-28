import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/', '/login', '/auth/callback']

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
  // Create response and supabase client
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

    // Get session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('[Middleware] Session check:', session ? 'Found' : 'Not found')

    // For non-public routes, check session
    if (!session) {
      console.log('[Middleware] No session, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single()

    console.log('[Middleware] User profile:', profile)

    if (!profile?.user_type) {
      console.log('[Middleware] No user type found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Super admin can access all dashboard routes
    if (profile.user_type === 'super_admin') {
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/super-admin-dashboard', request.url))
      }
      if (pathname.includes('dashboard')) {
        return res
      }
    }

    // Role-based redirects
    const roleRedirects = {
      member: '/dashboard',
      driver: '/driver-dashboard',
      admin: '/admin-dashboard',
      super_admin: '/super-admin-dashboard'
    }

    // If trying to access a dashboard that doesn't match their role
    if (pathname.includes('dashboard')) {
      const correctPath = roleRedirects[profile.user_type as keyof typeof roleRedirects]
      if (pathname !== correctPath) {
        console.log('[Middleware] Wrong dashboard, redirecting to:', correctPath)
        return NextResponse.redirect(new URL(correctPath, request.url))
      }
    }

    return res
  } catch (error) {
    console.error('[Middleware] Error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 