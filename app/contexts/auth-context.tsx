"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
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
  refreshAuth: () => Promise<void>
}

const defaultAuthState: AuthState = {
  user: null,
  profile: null,
  isLoggedIn: false,
  isLoading: true,
  role: null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)

  const checkAuth = async () => {
    try {
      console.log('[Auth] Checking auth state...')
      const authUser = await authService.getCurrentUser()
      
      const newState = {
        isLoading: false,
        isLoggedIn: !!authUser.isLoggedIn,
        user: authUser.user,
        profile: authUser.profile,
        role: authUser.role
      }

      console.log('[Auth] Setting new state:', {
        isLoggedIn: newState.isLoggedIn,
        role: newState.role,
        hasUser: !!newState.user,
        hasProfile: !!newState.profile
      })
      
      setAuthState(newState)
    } catch (error) {
      console.error('[Auth] Error checking auth:', error)
      setAuthState({ ...defaultAuthState, isLoading: false })
    }
  }

  useEffect(() => {
    console.log('[Auth] Initial auth check')
    checkAuth()

    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state change:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out')
        setAuthState({ ...defaultAuthState, isLoading: false })
      }
    })

    return () => {
      console.log('[Auth] Cleaning up auth subscription')
      subscription?.unsubscribe()
    }
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    login: async (email, password) => {
      try {
        console.log('[Auth] Attempting login:', email)
        const data = await authService.login(email, password)
        console.log('[Auth] Login successful')
        await checkAuth() // Immediately refresh auth state after login
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
      console.log('[Auth] Logging out')
      await authService.logout()
      setAuthState({ ...defaultAuthState, isLoading: false })
    },
    updateProfile: async (data) => {
      try {
        if (!authState.user?.id) throw new Error('No user ID available')
        await authService.updateProfile(authState.user.id, data)
        await checkAuth() // Refresh auth state after profile update
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    },
    refreshAuth: checkAuth // Expose checkAuth as a method to manually refresh
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

