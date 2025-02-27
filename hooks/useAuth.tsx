'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getRedirectUrl, handleSupabaseError } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
}

const defaultState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
}

const AuthContext = createContext<AuthContextType>({
  ...defaultState,
  signIn: async () => ({ error: new Error('Not implemented') }),
  signUp: async () => ({ error: new Error('Not implemented') }),
  signOut: async () => {},
  updateProfile: async () => ({ error: new Error('Not implemented') }),
})

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(defaultState)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) throw profileError

          setState({
            user: session.user,
            profile,
            isLoading: false,
          })
        } else if (mounted) {
          setState({
            user: null,
            profile: null,
            isLoading: false,
          })
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setState({
            user: null,
            profile: null,
            isLoading: false,
          })
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && mounted) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) throw profileError

          setState({
            user: session.user,
            profile,
            isLoading: false,
          })
        } catch (error) {
          console.error('Error fetching profile:', error)
          setState({
            user: session.user,
            profile: null,
            isLoading: false,
          })
        }
      } else if (mounted) {
        setState({
          user: null,
          profile: null,
          isLoading: false,
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: getRedirectUrl('/auth/callback')
        }
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!state.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', state.user.id)

      if (error) throw error

      setState(prev => ({
        ...prev,
        profile: { ...prev.profile!, ...data }
      }))

      return { error: null }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 