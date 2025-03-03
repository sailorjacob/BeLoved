import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
    // This is the ONLY restriction - users must be logged in to access non-public paths
    if (!session && !publicPaths.includes(request.nextUrl.pathname)) {
      console.log('[Middleware] No session found, redirecting to login')
      return NextResponse.redirect(new URL('/', request.url))
    }

    // For all authenticated users, allow access to ANY page regardless of role
    console.log('[Middleware] User is authenticated, allowing access to all pages')
    return NextResponse.next()
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error)
    return NextResponse.redirect(new URL('/', request.url))
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