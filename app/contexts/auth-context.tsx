"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { authService, type UserRole } from '@/lib/auth-service'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface AuthState {
  user: User | null
  profile: Profile | null
  isLoggedIn: boolean
  isDriver: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isLoading: boolean
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
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<AuthState>(defaultAuthState)
  const lastEventRef = useRef<string | null>(null)
  const lastPathRef = useRef<string | null>(null)
  const authCheckCompletedRef = useRef(false)
  const redirectInProgressRef = useRef(false)

  const updateAuthState = useCallback(async () => {
    try {
      console.log('[AuthProvider] Updating auth state...')
      const authUser = await authService.getCurrentUser()
      console.log('[AuthProvider] Got auth user:', authUser)
      
      // Update state first
      setState({
        user: authUser.user,
        profile: authUser.profile,
        isLoggedIn: authUser.isLoggedIn,
        isDriver: authUser.role === 'driver',
        isAdmin: authUser.role === 'admin',
        isSuperAdmin: authUser.role === 'super_admin',
        isLoading: false,
        role: authUser.role
      })

      // Handle redirects based on auth state
      if (authUser.isLoggedIn && authUser.role && !redirectInProgressRef.current) {
        const targetPath = authService.getRedirectPath(authUser.role)
        
        // Only redirect if we're on a public path or if we're on the wrong dashboard
        if (publicPaths.includes(pathname || '') || 
            (pathname !== targetPath && pathname?.includes('dashboard'))) {
          console.log('[AuthProvider] Redirecting to:', targetPath, 'from:', pathname)
          redirectInProgressRef.current = true
          lastPathRef.current = targetPath
          await router.push(targetPath)
          redirectInProgressRef.current = false
        } else {
          console.log('[AuthProvider] No redirect needed - already on correct path:', pathname)
        }
      } else if (!authUser.isLoggedIn && !publicPaths.includes(pathname || '') && !redirectInProgressRef.current) {
        console.log('[AuthProvider] Not logged in, redirecting to login')
        redirectInProgressRef.current = true
        lastPathRef.current = '/login'
        await router.push('/login')
        redirectInProgressRef.current = false
      }

      authCheckCompletedRef.current = true
      return authUser
    } catch (error) {
      console.error('[AuthProvider] Error updating state:', error)
      setState({
        ...defaultAuthState,
        isLoading: false
      })
      
      if (!publicPaths.includes(pathname || '') && !redirectInProgressRef.current) {
        redirectInProgressRef.current = true
        lastPathRef.current = '/login'
        await router.push('/login')
        redirectInProgressRef.current = false
      }
      return null
    }
  }, [router, pathname])

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    console.log('[AuthProvider] Auth state change:', event, 'Previous event:', lastEventRef.current)
    
    // Skip duplicate events except for SIGNED_IN
    if (event === lastEventRef.current && event !== 'SIGNED_IN') {
      console.log('[AuthProvider] Skipping duplicate event')
      return
    }
    
    lastEventRef.current = event

    if (event === 'SIGNED_OUT') {
      console.log('[AuthProvider] User signed out')
      setState({
        ...defaultAuthState,
        isLoading: false
      })
      if (!publicPaths.includes(pathname || '') && !redirectInProgressRef.current) {
        redirectInProgressRef.current = true
        await router.push('/login')
        redirectInProgressRef.current = false
      }
      return
    }

    await updateAuthState()
  }, [updateAuthState, pathname, router])

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth...')
    
    // Initial auth check
    updateAuthState()

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(handleAuthStateChange)
    
    return () => {
      console.log('[AuthProvider] Cleaning up auth...')
      subscription?.unsubscribe()
    }
  }, [handleAuthStateChange])

  const contextValue: AuthContextType = {
    ...state,
    login: async (email, password) => {
      try {
        const data = await authService.login(email, password)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    signIn: async (email, password) => {
      try {
        const data = await authService.login(email, password)
        return { error: null, data }
      } catch (error) {
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
    },
    updateProfile: async (data) => {
      try {
        if (!state.user?.id) throw new Error('No user ID available')
        await authService.updateProfile(state.user.id, data)
        await updateAuthState()
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    }
  }

  if (state.isLoading) {
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

