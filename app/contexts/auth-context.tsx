"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
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

const AuthContext = createContext<AuthContextType>({
  ...defaultAuthState,
  login: async () => ({ error: new Error('Not implemented') }),
  signIn: async () => ({ error: new Error('Not implemented') }),
  signUp: async () => ({ error: new Error('Not implemented') }),
  logout: async () => {},
  updateProfile: async () => ({ error: new Error('Not implemented') })
})

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
  const [isInitialized, setIsInitialized] = useState(false)
  const mountedRef = useRef(true)
  const redirectTimeoutRef = useRef<NodeJS.Timeout>()
  const lastRedirectRef = useRef<string>('')

  const handleRedirect = useCallback(async (profile: Profile | null, isLoggedIn: boolean) => {
    const currentPath = pathname || '/'
    
    // Clear any pending redirects
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
    }

    // Prevent duplicate redirects
    if (lastRedirectRef.current === currentPath) {
      return
    }

    try {
      let targetPath: string | null = null

      // Handle public paths
      if (publicPaths.includes(currentPath)) {
        if (isLoggedIn && profile) {
          targetPath = getRedirectPath(profile.user_type)
        }
      } else {
        // Handle protected paths
        if (!isLoggedIn) {
          targetPath = '/login'
        } else if (profile) {
          const correctPath = getRedirectPath(profile.user_type)
          if (currentPath !== correctPath) {
            targetPath = correctPath
          }
        }
      }

      // Only redirect if we have a target and it's different from current path
      if (targetPath && targetPath !== currentPath) {
        lastRedirectRef.current = targetPath
        // Debounce redirect to prevent rapid consecutive redirects
        redirectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            router.push(targetPath!)
          }
        }, 100)
      }
    } catch (error) {
      console.error('Error during redirect:', error)
    }
  }, [pathname, router])

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    if (!mountedRef.current) return

    try {
      if (event === 'SIGNED_OUT') {
        setState({
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

      if (event === 'SIGNED_IN' && session?.user) {
        setState(prev => ({ ...prev, isLoading: true }))
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!mountedRef.current) return

        if (profileError) {
          throw profileError
        }

        setState({
          user: session.user,
          profile,
          isLoggedIn: true,
          isDriver: profile.user_type === 'driver',
          isAdmin: profile.user_type === 'admin',
          isSuperAdmin: profile.user_type === 'super_admin',
          isLoading: false
        })

        handleRedirect(profile, true)
      }
    } catch (error) {
      console.error('Error handling auth state change:', error)
      if (mountedRef.current) {
        await supabase.auth.signOut()
        setState(prev => ({ ...prev, isLoading: false }))
        handleRedirect(null, false)
      }
    }
  }, [handleRedirect])

  useEffect(() => {
    mountedRef.current = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mountedRef.current) return

        if (!session?.user) {
          setState(prev => ({ ...prev, isLoading: false }))
          setIsInitialized(true)
          handleRedirect(null, false)
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!mountedRef.current) return

        if (profileError || !profile) {
          await supabase.auth.signOut()
          setState(prev => ({ ...prev, isLoading: false }))
          setIsInitialized(true)
          handleRedirect(null, false)
          return
        }

        setState({
          user: session.user,
          profile,
          isLoggedIn: true,
          isDriver: profile.user_type === 'driver',
          isAdmin: profile.user_type === 'admin',
          isSuperAdmin: profile.user_type === 'super_admin',
          isLoading: false
        })
        setIsInitialized(true)
        handleRedirect(profile, true)
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mountedRef.current) {
          setState(prev => ({ ...prev, isLoading: false }))
          setIsInitialized(true)
          handleRedirect(null, false)
        }
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    initializeAuth()

    return () => {
      mountedRef.current = false
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
      subscription?.unsubscribe()
    }
  }, [handleRedirect, handleAuthStateChange])

  const login = async (email: string, password: string): Promise<AuthResponse> => {
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
  }

  const signUp = async (email: string, password: string, userData?: { full_name?: string, phone?: string }): Promise<AuthResponse> => {
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
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!state.user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', state.user.id)

      if (error) throw error

      setState(state => ({
        ...state,
        profile: { ...state.profile!, ...data }
      }))

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      signIn: login,
      signUp,
      logout,
      updateProfile
    }}>
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

