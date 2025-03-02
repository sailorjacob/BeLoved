"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
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
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const mountedRef = useRef(true)
  const checkingRef = useRef(false)

  const checkAuth = useCallback(async () => {
    // Prevent concurrent auth checks
    if (checkingRef.current) {
      console.log('[AuthContext] Auth check already in progress, skipping')
      return
    }

    try {
      checkingRef.current = true
      console.log('[AuthContext] Checking auth state')
      setIsLoading(true)
      
      const currentUser = await authService.getCurrentUser()
      console.log('[AuthContext] Current user state:', {
        isLoggedIn: currentUser.isLoggedIn,
        userId: currentUser.user?.id,
        role: currentUser.role
      })

      if (!mountedRef.current) return

      setUser(currentUser.user)
      setSession(currentUser.session)
      setProfile(currentUser.profile)
      setRole(currentUser.role)
      setIsLoggedIn(currentUser.isLoggedIn)
    } catch (error) {
      console.error('[AuthContext] Error checking auth:', error)
      if (!mountedRef.current) return
      
      // Reset state on error
      setUser(null)
      setSession(null)
      setProfile(null)
      setRole(null)
      setIsLoggedIn(false)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
      checkingRef.current = false
    }
  }, [])

  useEffect(() => {
    console.log('[AuthContext] Initial auth check')
    
    // Set up cleanup
    mountedRef.current = true
    
    // Initial auth check
    checkAuth()

    // Set up auth state change subscription
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return
      console.log('[AuthContext] Auth state changed:', event)
      
      if (event === 'SIGNED_IN') {
        console.log('[AuthContext] User signed in, updating state')
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out, resetting state')
        setUser(null)
        setSession(null)
        setProfile(null)
        setRole(null)
        setIsLoggedIn(false)
      } else if (event === 'USER_UPDATED') {
        console.log('[AuthContext] User updated, refreshing state')
        await checkAuth()
      }
    })

    // Cleanup function
    return () => {
      console.log('[AuthContext] Cleaning up subscription')
      mountedRef.current = false
      if (subscription?.unsubscribe) {
        subscription.unsubscribe()
      }
    }
  }, [checkAuth])

  const value = {
    isLoading,
    isLoggedIn,
    user,
    session,
    profile,
    role,
    login: async (email: string, password: string): Promise<AuthResponse> => {
      console.log('[AuthContext] Attempting login')
      try {
        const data = await authService.login(email, password)
        if (mountedRef.current) {
          await checkAuth()
        }
        return { error: null, data }
      } catch (error) {
        console.error('[AuthContext] Login error:', error)
        return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
      }
    },
    signUp: async (email: string, password: string, userData?: {
      full_name?: string
      phone?: string
      user_type?: UserRole
    }): Promise<AuthResponse> => {
      console.log('[AuthContext] Attempting signup')
      try {
        const data = await authService.signup(email, password, userData)
        if (mountedRef.current) {
          await checkAuth()
        }
        return { error: null, data }
      } catch (error) {
        console.error('[AuthContext] Signup error:', error)
        return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
      }
    },
    logout: async () => {
      console.log('[AuthContext] Attempting logout')
      await authService.logout()
      if (mountedRef.current) {
        setUser(null)
        setSession(null)
        setProfile(null)
        setRole(null)
        setIsLoggedIn(false)
      }
    },
    updateProfile: async (data: Partial<Profile>): Promise<{ error: Error | null }> => {
      console.log('[AuthContext] Updating profile')
      try {
        if (!user?.id) throw new Error('No user ID available')
        await authService.updateProfile(user.id, data)
        if (mountedRef.current) {
          await checkAuth()
        }
        return { error: null }
      } catch (error) {
        console.error('[AuthContext] Update profile error:', error)
        return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
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

