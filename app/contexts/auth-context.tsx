"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { useRouter, usePathname } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface AuthState {
  user: User | null
  profile: Profile | null
  isLoggedIn: boolean
  isDriver: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isLoading: boolean
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
  isLoading: true
}

const AuthContext = createContext<AuthContextType | null>(null)

const publicPaths = ['/login', '/auth/callback', '/']

function getRedirectPath(userType: string): string {
  switch (userType) {
    case 'super_admin':
      return '/super-admin-dashboard'
    case 'admin':
      return '/admin-dashboard'
    case 'driver':
      return '/driver-dashboard'
    case 'member':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

console.log('Auth context file loaded')

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider rendering')
  
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<AuthState>(defaultAuthState)
  const mountedRef = useRef(true)
  const redirectInProgressRef = useRef(false)
  const lastRedirectPathRef = useRef<string | null>(null)

  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    if (!mountedRef.current) return
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const handleRedirect = useCallback(async (profile: Profile | null, isLoggedIn: boolean) => {
    if (!mountedRef.current || redirectInProgressRef.current) return

    const currentPath = pathname || '/'
    let targetPath: string | null = null

    // Determine target path
    if (publicPaths.includes(currentPath)) {
      if (isLoggedIn && profile) {
        targetPath = getRedirectPath(profile.user_type)
      }
    } else if (!isLoggedIn) {
      targetPath = '/login'
    } else if (profile) {
      const correctPath = getRedirectPath(profile.user_type)
      if (currentPath !== correctPath) {
        targetPath = correctPath
      }
    }

    // Only redirect if necessary
    if (targetPath && targetPath !== currentPath && targetPath !== lastRedirectPathRef.current) {
      redirectInProgressRef.current = true
      lastRedirectPathRef.current = targetPath
      try {
        await router.push(targetPath)
      } catch (error) {
        console.error('Redirect error:', error)
      }
      redirectInProgressRef.current = false
    }
  }, [pathname, router])

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return profile
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }, [])

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    if (!mountedRef.current) return

    try {
      if (event === 'SIGNED_OUT' || !session?.user) {
        updateAuthState({
          user: null,
          profile: null,
          isLoggedIn: false,
          isDriver: false,
          isAdmin: false,
          isSuperAdmin: false,
          isLoading: false
        })
        handleRedirect(null, false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        updateAuthState({ isLoading: true })
        
        const profile = await fetchProfile(session.user.id)
        if (!profile || !mountedRef.current) {
          await supabase.auth.signOut()
          updateAuthState({ ...defaultAuthState, isLoading: false })
          handleRedirect(null, false)
          return
        }

        const newState = {
          user: session.user,
          profile,
          isLoggedIn: true,
          isDriver: profile.user_type === 'driver',
          isAdmin: profile.user_type === 'admin',
          isSuperAdmin: profile.user_type === 'super_admin',
          isLoading: false
        }
        
        updateAuthState(newState)
        handleRedirect(profile, true)
      }
    } catch (error) {
      console.error('Auth state change error:', error)
      if (mountedRef.current) {
        await supabase.auth.signOut()
        updateAuthState({ ...defaultAuthState, isLoading: false })
        handleRedirect(null, false)
      }
    }
  }, [updateAuthState, handleRedirect, fetchProfile])

  useEffect(() => {
    mountedRef.current = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await handleAuthStateChange('INITIAL_SESSION', session)
      } catch (error) {
        console.error('Auth initialization error:', error)
        updateAuthState({ isLoading: false })
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    initializeAuth()

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [handleAuthStateChange, updateAuthState])

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { error: null, data }
    } catch (error) {
      return { error: error as Error }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, userData?: { full_name?: string, phone?: string }): Promise<AuthResponse> => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.full_name || '',
            user_type: 'member'
          }
        }
      })

      if (signUpError) throw signUpError
      if (!data.user) throw new Error('No user returned from sign up')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: userData?.full_name || '',
          email: email,
          phone: userData?.phone || '',
          user_type: 'member'
        })

      if (profileError) throw profileError
      return { error: null, data }
    } catch (error) {
      return { error: error as Error }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [])

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    try {
      if (!state.user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', state.user.id)

      if (error) throw error

      updateAuthState({
        profile: { ...state.profile!, ...data }
      })

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [state.user, state.profile, updateAuthState])

  const contextValue = useMemo(() => ({
    ...state,
    login,
    signIn: login,
    signUp,
    logout,
    updateProfile
  }), [state, login, signUp, logout, updateProfile])

  if (state.isLoading) {
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

