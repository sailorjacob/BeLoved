"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { authService, type UserRole } from '@/lib/auth-service'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  isLoading: boolean
  isLoggedIn: boolean
  user: User | null
  session: Session | null
  profile: Profile | null
  role: UserRole | null
}

interface AuthResponse {
  error: Error | null
  data?: {
    user: User | null
    session: Session | null
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, userData?: { 
    full_name?: string
    phone?: string
  }) => Promise<AuthResponse>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
}

const initialState: AuthState = {
  isLoading: true,
  isLoggedIn: false,
  user: null,
  session: null,
  profile: null,
  role: null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialState)

  const checkAuth = async () => {
    try {
      console.log('[Auth] Checking auth state...')
      const authUser = await authService.getCurrentUser()
      
      const newState = {
        isLoading: false,
        isLoggedIn: !!authUser.isLoggedIn,
        user: authUser.user,
        profile: authUser.profile,
        role: authUser.role,
        session: authUser.session
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
      setAuthState({ ...initialState, isLoading: false })
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
        setAuthState({ ...initialState, isLoading: false })
      }
    })

    return () => {
      console.log('[Auth] Cleaning up auth subscription')
      subscription?.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('[Auth] Attempting login...')
      const { session, user } = await authService.login(email, password)
      
      if (!session || !user) {
        throw new Error('Login failed: No session or user returned')
      }
      
      console.log('[Auth] Login successful, fetching profile...')
      const profile = await authService.getProfile(user.id)
      
      if (!profile) {
        throw new Error('Login failed: No profile found')
      }
      
      if (!profile.user_type) {
        throw new Error('Login failed: No user type found in profile')
      }

      const role = profile.user_type as UserRole
      console.log('[Auth] Profile fetched successfully:', {
        id: profile.id,
        email: user.email,
        user_type: profile.user_type,
        role
      })
      
      // Set auth state with complete profile data
      const newState = {
        isLoading: false,
        user,
        session,
        profile,
        isLoggedIn: true,
        role
      }
      
      console.log('[Auth] Setting complete auth state')
      setAuthState(newState)
      
      return { error: null, data: { user, session } }
    } catch (error) {
      console.error('[Auth] Login error:', error)
      setAuthState({
        ...initialState,
        isLoading: false
      })
      return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
    }
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    login,
    signUp: async (email, password, userData) => {
      try {
        const data = await authService.signup(email, password, {
          ...userData,
          user_type: 'member' // Default to member role
        })
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    logout: async () => {
      try {
        console.log('[Auth] Logging out')
        await authService.logout()
        setAuthState({ ...initialState, isLoading: false })
      } catch (error) {
        console.error('[Auth] Error during logout:', error)
        setAuthState({ ...initialState, isLoading: false })
      }
    },
    updateProfile: async (data) => {
      try {
        if (!authState.user?.id) throw new Error('No user ID available')
        await authService.updateProfile(authState.user.id, data)
        await checkAuth()
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

