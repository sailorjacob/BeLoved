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
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<AuthState>(defaultAuthState)
  const mountedRef = useRef(true)
  const redirectInProgressRef = useRef(false)
  const lastRedirectPathRef = useRef<string | null>(null)
  const initializationInProgressRef = useRef(false)

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

    // Only redirect if necessary and not to the same path
    if (targetPath && targetPath !== currentPath && targetPath !== lastRedirectPathRef.current) {
      redirectInProgressRef.current = true
      lastRedirectPathRef.current = targetPath
      try {
        await router.replace(targetPath)
      } catch (error) {
        console.error('Redirect error:', error)
      } finally {
        redirectInProgressRef.current = false
      }
    }
  }, [pathname, router])

  const fetchProfile = useCallback(async (userId: string) => {
    let retries = 3
    while (retries > 0) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }
          throw error
        }
        return profile
      } catch (error) {
        console.error('Error in profile fetch attempt:', error)
        retries--
        if (retries === 0) throw error
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    return null
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
        if (mountedRef.current) {
          handleRedirect(null, false)
        }
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        updateAuthState({ isLoading: true })
        
        try {
          const profile = await fetchProfile(session.user.id)
          
          if (!mountedRef.current) return

          if (!profile) {
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
        } catch (error) {
          console.error('Error in auth state change flow:', error)
          if (mountedRef.current) {
            updateAuthState({ ...defaultAuthState, isLoading: false })
            handleRedirect(null, false)
          }
        }
      }
    } catch (error) {
      console.error('Critical auth state change error:', error)
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
      if (initializationInProgressRef.current) return
      initializationInProgressRef.current = true

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session initialization error:', error)
          updateAuthState({ ...defaultAuthState, isLoading: false })
          return
        }

        if (!mountedRef.current) return

        await handleAuthStateChange('INITIAL_SESSION', session)
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mountedRef.current) {
          updateAuthState({ ...defaultAuthState, isLoading: false })
        }
      } finally {
        initializationInProgressRef.current = false
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [handleAuthStateChange])

  const contextValue = useMemo(() => ({
    ...state,
    login: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        return { error, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        return { error, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    signUp: async (email: string, password: string, userData?: { full_name?: string, phone?: string }) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: userData?.full_name,
              phone: userData?.phone
            }
          }
        })
        return { error, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    logout: async () => {
      await supabase.auth.signOut()
    },
    updateProfile: async (data: Partial<Profile>) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', state.user?.id)
        return { error }
      } catch (error) {
        return { error: error as Error }
      }
    }
  }), [state])

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

