import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/', '/login', '/auth/callback']

export async function middleware(request: NextRequest) {
  // Skip middleware completely in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Skip auth check for public routes
  if (publicPaths.includes(pathname)) {
    return res
  }

  // For non-public routes, check session
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', session.user.id)
    .single()

  // Role-based access control
  if (profile?.user_type === 'member' && pathname.includes('/admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (profile?.user_type === 'driver' && !pathname.includes('/driver')) {
    return NextResponse.redirect(new URL('/driver-dashboard', request.url))
  }

  if (profile?.user_type === 'admin' && pathname.includes('/super-admin')) {
    return NextResponse.redirect(new URL('/admin-dashboard', request.url))
  }

  if (profile?.user_type === 'super_admin' && pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/super-admin-dashboard', request.url))
  }

  return res
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