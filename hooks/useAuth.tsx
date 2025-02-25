'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getRedirectUrl, handleSupabaseError } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  })

  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
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
        } else {
          setState({
            user: null,
            profile: null,
            isLoading: false,
          })
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setState({
          user: null,
          profile: null,
          isLoading: false,
        })
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
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
      } else {
        setState({
          user: null,
          profile: null,
          isLoading: false,
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

      // Update local state
      setState(prev => ({
        ...prev,
        profile: { ...prev.profile!, ...data }
      }))

      return { error: null }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    }
  }

  const value = {
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 