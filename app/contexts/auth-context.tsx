"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { useRouter } from 'next/navigation'

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

console.log('Auth context file loaded')

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider rendering')
  
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (!session?.user) {
          console.log('No session found')
          setAuthState({
            ...defaultAuthState,
            isLoading: false
          })
          setIsInitialized(true)
          return
        }

        console.log('Session found, fetching profile...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!mounted) return

        if (profileError || !profile) {
          console.error('Profile fetch error or no profile found:', profileError)
          await supabase.auth.signOut()
          setAuthState({
            ...defaultAuthState,
            isLoading: false
          })
          setIsInitialized(true)
          return
        }

        console.log('Profile found:', profile.user_type)
        setAuthState({
          user: session.user,
          profile,
          isLoggedIn: true,
          isDriver: profile.user_type === 'driver',
          isAdmin: profile.user_type === 'admin',
          isSuperAdmin: profile.user_type === 'super_admin',
          isLoading: false
        })
        setIsInitialized(true)
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setAuthState({
            ...defaultAuthState,
            isLoading: false
          })
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state change:', event, session?.user?.id)
      
      try {
        if (!session?.user) {
          setAuthState({
            ...defaultAuthState,
            isLoading: false
          })
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!mounted) return

        if (profileError || !profile) {
          console.error('Profile fetch error on auth change:', profileError)
          await supabase.auth.signOut()
          setAuthState({
            ...defaultAuthState,
            isLoading: false
          })
          return
        }

        setAuthState({
          user: session.user,
          profile,
          isLoggedIn: true,
          isDriver: profile.user_type === 'driver',
          isAdmin: profile.user_type === 'admin',
          isSuperAdmin: profile.user_type === 'super_admin',
          isLoading: false
        })
      } catch (error) {
        console.error('Error handling auth state change:', error)
        setAuthState({
          ...defaultAuthState,
          isLoading: false
        })
      }
    })

    return () => {
      console.log('Cleaning up auth provider')
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // Don't render children until auth is initialized
  if (!isInitialized) {
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
    } else {
      router.push('/login')
    }
  }

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!authState.user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', authState.user.id)

      if (error) throw error

      // Update local state
      setAuthState(state => ({
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
    ...authState,
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

