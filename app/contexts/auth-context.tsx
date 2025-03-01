"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { authService, type UserRole } from '@/lib/auth-service'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthState = {
  isLoading: boolean
  isLoggedIn: boolean
  user: User | null
  profile: Profile | null
  role: UserRole | null
}

export interface AuthResponse {
  error: Error | null
  data?: any
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, userData?: { full_name?: string, phone?: string }) => Promise<AuthResponse>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
}

const defaultAuthState: AuthState = {
  user: null,
  profile: null,
  isLoggedIn: false,
  isLoading: true,
  role: null
}

const AuthContext = createContext<AuthContextType | null>(null)

// Paths that don't require authentication
const publicPaths = ['/', '/signup', '/forgot-password']

// Role-specific paths
const pathsByRole = {
  super_admin: ['/super-admin-dashboard'],
  admin: ['/admin-dashboard'],
  driver: ['/driver-dashboard'],
  member: ['/dashboard']
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)
  const router = useRouter()
  const pathname = usePathname()

  const canAccessCurrentPath = (role: UserRole | null): boolean => {
    if (!pathname) return false
    if (publicPaths.includes(pathname)) return true
    if (!role) return false

    // Check if the current path is allowed for the user's role
    const allowedPaths = pathsByRole[role] || []
    return allowedPaths.some(path => pathname.startsWith(path))
  }

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const authUser = await authService.getCurrentUser()
        
        if (!mounted) return

        const newState = {
          isLoading: false,
          isLoggedIn: !!authUser.isLoggedIn,
          user: authUser.user,
          profile: authUser.profile,
          role: authUser.role
        }

        console.log('[Auth] Setting state:', newState)
        setAuthState(newState)

        // Handle navigation
        if (newState.isLoggedIn && newState.role) {
          if (pathname === '/') {
            // If on root path while logged in, redirect to appropriate dashboard
            const dashboardPath = getDashboardPath(newState.role)
            console.log('[Auth] Redirecting to dashboard:', dashboardPath)
            router.replace(dashboardPath)
          } else if (!canAccessCurrentPath(newState.role)) {
            // If on a path the user can't access, redirect to their dashboard
            console.log('[Auth] Access denied, redirecting to appropriate dashboard')
            router.replace(getDashboardPath(newState.role))
          }
        } else if (!publicPaths.includes(pathname || '')) {
          // If not logged in and trying to access a protected path
          console.log('[Auth] Not authenticated, redirecting to home')
          router.replace('/')
        }
      } catch (error) {
        console.error('[Auth] Error:', error)
        if (mounted) {
          setAuthState({ ...defaultAuthState, isLoading: false })
          if (!publicPaths.includes(pathname || '')) {
            router.replace('/')
          }
        }
      }
    }

    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state change:', event, session)
      if (!mounted) return
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth()
      } else if (event === 'SIGNED_OUT') {
        setAuthState({ ...defaultAuthState, isLoading: false })
        if (!publicPaths.includes(pathname || '')) {
          router.replace('/')
        }
      }
    })

    checkAuth()

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [pathname, router])

  const contextValue: AuthContextType = {
    ...authState,
    login: async (email, password) => {
      try {
        const data = await authService.login(email, password)
        console.log('[Auth] Login success:', data)
        // After successful login, checkAuth will be called by the auth state change event
        return { error: null, data }
      } catch (error) {
        console.error('[Auth] Login error:', error)
        return { error: error as Error }
      }
    },
    signUp: async (email, password, userData) => {
      try {
        const data = await authService.signup(email, password, userData)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    logout: async () => {
      await authService.logout()
      setAuthState({ ...defaultAuthState, isLoading: false })
      router.replace('/')
    },
    updateProfile: async (data) => {
      try {
        if (!authState.user?.id) throw new Error('No user ID available')
        await authService.updateProfile(authState.user.id, data)
        const authUser = await authService.getCurrentUser()
        setAuthState(prev => ({
          ...prev,
          profile: authUser.profile
        }))
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    }
  }

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

function getDashboardPath(role: UserRole | null): string {
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

