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
  super_admin: [
    '/profile', 
    '/super-admin-dashboard', 
    '/super-admin/providers', 
    '/super-admin/support', 
    '/super-admin/locations'
  ],
  admin: ['/profile', '/admin-dashboard'],
  driver: ['/profile', '/trips', '/driver-dashboard'],
  member: ['/profile', '/my-rides', '/dashboard']
}

// Protected paths by role - these are paths exclusive to each role 
// (for redirecting unauthorized users to appropriate dashboards)
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
  console.log('[Middleware] DISABLED - Allowing all navigation')
  console.log('[Middleware] Request path:', request.nextUrl.pathname)
  
  // MIDDLEWARE COMPLETELY DISABLED - Allow all navigation
  return NextResponse.next()
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