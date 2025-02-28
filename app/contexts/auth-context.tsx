"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
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

export interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoggedIn: boolean
  isDriver: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isLoading: boolean
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
  const [isRedirecting, setIsRedirecting] = useState(false)
  const mountedRef = useRef(true)
  const authChangeHandlerRef = useRef<((event: string, session: any) => void) | null>(null)

  const handleRedirect = async (profile: Profile | null, isLoggedIn: boolean) => {
    if (isRedirecting) {
      console.log('Already redirecting, skipping')
      return
    }
    
    const currentPath = pathname || '/'
    console.log('Checking redirect:', { currentPath, isLoggedIn, profile })

    try {
      // Handle public paths
      if (publicPaths.includes(currentPath)) {
        if (isLoggedIn && profile) {
          const redirectPath = getRedirectPath(profile.user_type)
          if (currentPath !== redirectPath) {
            setIsRedirecting(true)
            console.log('Redirecting to dashboard:', redirectPath)
            await router.push(redirectPath)
            console.log('Redirect complete')
            setIsRedirecting(false)
          } else {
            console.log('Already on correct path')
          }
        } else {
          console.log('On public path, no redirect needed')
        }
        return
      }

      // Handle protected paths
      if (!isLoggedIn) {
        setIsRedirecting(true)
        console.log('Redirecting to login')
        await router.push('/login')
        console.log('Redirect to login complete')
        setIsRedirecting(false)
        return
      }

      // Ensure user is on correct dashboard
      if (profile) {
        const correctPath = getRedirectPath(profile.user_type)
        if (currentPath !== correctPath) {
          setIsRedirecting(true)
          console.log('Redirecting to correct dashboard:', correctPath)
          await router.push(correctPath)
          console.log('Redirect to dashboard complete')
          setIsRedirecting(false)
        } else {
          console.log('Already on correct dashboard')
        }
      }
    } catch (error) {
      console.error('Error during redirect:', error)
      setIsRedirecting(false)
    }
  }

  useEffect(() => {
    console.log('Setting up auth effect')
    mountedRef.current = true

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mountedRef.current) return

        if (!session?.user) {
          console.log('No session found')
          const newState = {
            ...defaultAuthState,
            isLoading: false
          }
          setState(newState)
          setIsInitialized(true)
          handleRedirect(null, false)
          return
        }

        console.log('Session found, fetching profile...', session.user.id)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!mountedRef.current) return

        if (profileError || !profile) {
          console.error('Profile fetch error:', profileError)
          await supabase.auth.signOut()
          const newState = {
            ...defaultAuthState,
            isLoading: false
          }
          setState(newState)
          setIsInitialized(true)
          handleRedirect(null, false)
          return
        }

        console.log('Profile found:', { user_type: profile.user_type, id: profile.id })
        const newState = {
          user: session.user,
          profile,
          isLoggedIn: true,
          isDriver: profile.user_type === 'driver',
          isAdmin: profile.user_type === 'admin',
          isSuperAdmin: profile.user_type === 'super_admin',
          isLoading: false
        }
        setState(newState)
        setIsInitialized(true)
        handleRedirect(profile, true)
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mountedRef.current) {
          const newState = {
            ...defaultAuthState,
            isLoading: false
          }
          setState(newState)
          setIsInitialized(true)
          handleRedirect(null, false)
        }
      }
    }

    initializeAuth()

    // Handle auth state changes
    console.log('Setting up auth state listener')
    
    const setupAuth = async () => {
      try {
        // Set up auth state change listener
        authChangeHandlerRef.current = async (event: string, session: any) => {
          console.log('Auth state changed:', event, session?.user?.id)
          if (mountedRef.current) {
            await handleAuthStateChange(event, session)
          }
        }

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          authChangeHandlerRef.current
        )

        return () => {
          console.log('Cleaning up auth state listener')
          mountedRef.current = false
          subscription?.unsubscribe()
        }
      } catch (error) {
        console.error('Error in auth setup:', error)
        if (mountedRef.current) {
          setState(prev => ({ ...prev, isLoading: false }))
        }
      }
    }

    setupAuth()
  }, [router, pathname])

  const handleAuthStateChange = async (event: string, session: any) => {
    console.log('Handling auth state change:', event)
    
    if (!mountedRef.current) {
      console.log('Component unmounted, skipping auth state change')
      return
    }

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
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        if (mountedRef.current) {
          setState({
            user: session.user,
            profile,
            isLoggedIn: true,
            isDriver: profile.user_type === 'driver',
            isAdmin: profile.user_type === 'admin',
            isSuperAdmin: profile.user_type === 'super_admin',
            isLoading: false
          })
        }

        await handleRedirect(profile, true)
      }
    } catch (error) {
      console.error('Error handling auth state change:', error)
      if (mountedRef.current) {
        console.log('Signing out due to error')
        await supabase.auth.signOut()
        setState(prev => ({ ...prev, isLoading: false }))
        handleRedirect(null, false)
      }
    }
  }

  // Don't render children until auth is initialized
  if (!isInitialized || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    console.log('Login attempt for email:', email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login response:', { hasData: !!data, error })

      if (error) throw error

      return { error: null, data }
    } catch (error) {
      console.error('Login error:', error)
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, userData?: { full_name?: string, phone?: string }): Promise<AuthResponse> => {
    console.log('Signup attempt for email:', email)
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

      console.log('Signup response:', { hasData: !!data, error: signUpError })

      if (signUpError) throw signUpError
      if (!data.user) throw new Error('No user returned from sign up')

      // Create the user's profile
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
      console.error('Signup error:', error)
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

      // Update local state
      setState(state => ({
        ...state,
        profile: { ...state.profile!, ...data }
      }))

      return { error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error: error as Error }
    }
  }

  const contextValue: AuthContextType = {
    ...state,
    login,
    signIn: login,
    signUp,
    logout,
    updateProfile
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

