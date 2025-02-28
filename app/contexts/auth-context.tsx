"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { User, Subscription } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { authService, type UserRole } from '@/lib/auth-service'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthState = {
  isLoading: boolean
  isLoggedIn: boolean
  isSuperAdmin: boolean
  isDriver: boolean
  isAdmin: boolean
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
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, userData?: { full_name?: string, phone?: string }) => Promise<AuthResponse>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
}

const defaultAuthState: AuthState = {
  user: null,
  profile: null,
  isLoggedIn: false,
  isDriver: false,
  isAdmin: false,
  isSuperAdmin: false,
  isLoading: true,
  role: null
}

const AuthContext = createContext<AuthContextType | null>(null)

const publicPaths = ['/login', '/auth/callback', '/']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)
  const router = useRouter()
  const pathname = usePathname()
  const authServiceRef = useRef(authService)
  const isUpdatingRef = useRef(false)
  const isMounted = useRef(true)
  const navigationTimeoutRef = useRef<NodeJS.Timeout>()

  const safeSetState = useCallback((newState: Partial<AuthState>) => {
    if (!isMounted.current) return
    setAuthState(prev => ({ ...prev, ...newState }))
  }, [])

  const handleNavigation = useCallback((path: string) => {
    if (!isMounted.current) return
    
    // Clear any existing navigation timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }

    // Schedule navigation for next tick to allow state updates to complete
    navigationTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && pathname !== path) {
        router.push(path)
      }
    }, 0)
  }, [router, pathname])

  const updateAuthState = useCallback(async () => {
    if (isUpdatingRef.current || !isMounted.current) return
    isUpdatingRef.current = true

    try {
      const authUser = await authServiceRef.current.getCurrentUser()
      console.log('[AuthProvider] Got auth user:', authUser)

      if (!isMounted.current) return

      const newState = !authUser ? {
        ...defaultAuthState,
        isLoading: false
      } : {
        isLoading: false,
        isLoggedIn: !!authUser.isLoggedIn,
        isSuperAdmin: authUser.role === 'super_admin',
        isDriver: authUser.role === 'driver',
        isAdmin: authUser.role === 'admin',
        user: authUser.user,
        profile: authUser.profile,
        role: authUser.role
      }

      safeSetState(newState)

      // Handle navigation after state update
      if (isMounted.current) {
        const publicPaths = ['/login', '/signup', '/forgot-password']
        const isPublicPath = publicPaths.includes(pathname)

        if (!newState.isLoggedIn && !isPublicPath) {
          handleNavigation('/login')
        } else if (newState.isLoggedIn && isPublicPath) {
          handleNavigation(newState.isSuperAdmin ? '/super-admin-dashboard' : '/dashboard')
        } else if (newState.isLoggedIn && pathname.startsWith('/super-admin') && !newState.isSuperAdmin) {
          handleNavigation('/dashboard')
        }
      }
    } catch (error) {
      console.error('[AuthProvider] Error getting user:', error)
      if (isMounted.current) {
        safeSetState({
          ...defaultAuthState,
          isLoading: false
        })
      }
    } finally {
      isUpdatingRef.current = false
    }
  }, [safeSetState, handleNavigation, pathname])

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth...')
    isMounted.current = true

    const { data: { subscription } } = authServiceRef.current.onAuthStateChange(async (event: string, session: any) => {
      console.log('[AuthProvider] Auth state change:', event, session)

      if (!isMounted.current) return

      if (event === 'SIGNED_OUT') {
        safeSetState({
          ...defaultAuthState,
          isLoading: false
        })
        handleNavigation('/login')
        return
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        await updateAuthState()
      }
    })

    updateAuthState()

    return () => {
      console.log('[AuthProvider] Cleaning up auth...')
      isMounted.current = false
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
      subscription?.unsubscribe()
    }
  }, [updateAuthState, handleNavigation, safeSetState])

  const contextValue: AuthContextType = {
    ...authState,
    login: async (email, password) => {
      try {
        const data = await authServiceRef.current.login(email, password)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    signIn: async (email, password) => {
      try {
        const data = await authServiceRef.current.login(email, password)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    signUp: async (email, password, userData) => {
      try {
        const data = await authServiceRef.current.signup(email, password, userData)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    logout: async () => {
      await authServiceRef.current.logout()
    },
    updateProfile: async (data) => {
      try {
        if (!authState.user?.id) throw new Error('No user ID available')
        await authServiceRef.current.updateProfile(authState.user.id, data)
        await updateAuthState()
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    }
  }

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

