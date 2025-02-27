"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoggedIn: boolean
  isDriver: boolean
  isAdmin: boolean
  isLoading: boolean
}

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: Error | null }>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoggedIn: false,
    isDriver: false,
    isAdmin: false,
    isLoading: true
  })

  useEffect(() => {
    console.log('AuthProvider mounted')
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

  const login = async (email: string, password: string) => {
    console.log('Login attempt for email:', email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login response:', { hasData: !!data, error })

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Login error:', error)
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('Signup attempt for email:', email)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profile.full_name,
            user_type: profile.user_type
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
          ...profile
        })

      if (profileError) throw profileError

      return { error: null }
    } catch (error) {
      console.error('Signup error:', error)
      return { error: error as Error }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider 
      value={{ 
        ...authState,
        login,
        signUp,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

