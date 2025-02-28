"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
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
  const mountedRef = useRef(true)
  const redirectInProgressRef = useRef(false)
  const authCheckCompletedRef = useRef(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const updateAuthState = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      const authUser = await authService.getCurrentUser()
      
      setState(prev => ({
        user: authUser.user,
        profile: authUser.profile,
        isLoggedIn: authUser.isLoggedIn,
        isDriver: authUser.role === 'driver',
        isAdmin: authUser.role === 'admin',
        isSuperAdmin: authUser.role === 'super_admin',
        isLoading: prev.isLoading && !authCheckCompletedRef.current,
        role: authUser.role
      }))

      return authUser
    } catch (error) {
      console.error('[AuthProvider] Error updating state:', error)
      setState(prev => ({
        ...defaultAuthState,
        isLoading: prev.isLoading && !authCheckCompletedRef.current
      }))
      return null
    }
  }, [])

  const handleRedirect = useCallback(async (authUser: { role: UserRole | null }) => {
    if (redirectInProgressRef.current || !authCheckCompletedRef.current) return
    if (!authUser?.role) {
      if (!publicPaths.includes(pathname || '')) {
        redirectInProgressRef.current = true
        try {
          await router.push('/login')
        } finally {
          redirectInProgressRef.current = false
        }
      }
      return
    }
    
    const targetPath = authService.getRedirectPath(authUser.role)
    if (pathname === targetPath) return
    if (publicPaths.includes(pathname || '') && targetPath === '/login') return

    console.log('[AuthProvider] Redirecting to:', targetPath, 'from:', pathname)
    redirectInProgressRef.current = true
    
    try {
      await router.push(targetPath)
    } finally {
      redirectInProgressRef.current = false
    }
  }, [router, pathname])

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    console.log('[AuthProvider] Auth state change:', event)

    if (event === 'SIGNED_OUT') {
      setState(prev => ({ ...defaultAuthState, isLoading: false }))
      if (!publicPaths.includes(pathname || '')) {
        router.push('/login')
      }
      return
    }

    if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
      const authUser = await updateAuthState()
      
      if (event === 'INITIAL_SESSION') {
        authCheckCompletedRef.current = true
        setState(prev => ({ ...prev, isLoading: false }))
      }

      if (authUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        handleRedirect(authUser)
      }
    }
  }, [updateAuthState, handleRedirect, pathname, router])

  useEffect(() => {
    mountedRef.current = true
    authCheckCompletedRef.current = false
    setIsInitializing(true)

    const initializeAuth = async () => {
      try {
        await handleAuthStateChange('INITIAL_SESSION', null)
      } catch (error) {
        console.error('[AuthProvider] Initialization error:', error)
        setState(prev => ({
          ...defaultAuthState,
          isLoading: false
        }))
      } finally {
        setIsInitializing(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = authService.onAuthStateChange(handleAuthStateChange)

    return () => {
      mountedRef.current = false
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

  if (isInitializing || state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
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

