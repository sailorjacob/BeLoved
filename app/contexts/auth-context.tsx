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
  isLoading: boolean
}

export interface AuthResponse {
  error: Error | null
  data?: any
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string) => Promise<AuthResponse>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoggedIn: false,
  isDriver: false,
  isAdmin: false,
  isLoading: true,
  login: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  logout: async () => {}
})

console.log('Auth context file loaded')

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider rendering')
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoggedIn: false,
    isDriver: false,
    isAdmin: false,
    isLoading: true
  })

  useEffect(() => {
    console.log('AuthProvider useEffect running')
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', { hasSession: !!session })
      if (session?.user) {
        updateAuthState(session.user)
      } else {
        setAuthState(state => ({ ...state, isLoading: false }))
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', { event: _event, hasSession: !!session })
      if (session?.user) {
        updateAuthState(session.user)
      } else {
        setAuthState({
          user: null,
          profile: null,
          isLoggedIn: false,
          isDriver: false,
          isAdmin: false,
          isLoading: false
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateAuthState = async (user: User) => {
    console.log('Updating auth state for user:', user.id)
    // Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    console.log('Profile data:', profile)

    setAuthState({
      user,
      profile,
      isLoggedIn: true,
      isDriver: profile?.user_type === 'driver',
      isAdmin: profile?.user_type === 'admin',
      isLoading: false
    })
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

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    console.log('Signup attempt for email:', email)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('Signup response:', { hasData: !!data, error: signUpError })

      if (signUpError) throw signUpError
      if (!data.user) throw new Error('No user returned from sign up')

      // Create the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: '',
          phone: '',
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
    await supabase.auth.signOut()
  }

  const contextValue: AuthContextType = {
    ...authState,
    login,
    signUp,
    logout
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

