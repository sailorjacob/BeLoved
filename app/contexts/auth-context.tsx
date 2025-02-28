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
  console.log('[AuthProvider] Rendering')
  
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<AuthState>(defaultAuthState)
  const mountedRef = useRef(true)
  const redirectInProgressRef = useRef(false)
  const lastRedirectPathRef = useRef<string | null>(null)
  const initializationInProgressRef = useRef(false)
  const initializationTimeoutRef = useRef<NodeJS.Timeout>()

  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    if (!mountedRef.current) return
    console.log('[AuthProvider] Updating state:', updates)
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Add initialization timeout
  useEffect(() => {
    if (!state.isLoading) return; // Don't set timeout if not loading

    initializationTimeoutRef.current = setTimeout(() => {
      if (state.isLoading && mountedRef.current) {
        console.log('[AuthProvider] Initialization timeout - resetting state')
        updateAuthState({ ...defaultAuthState, isLoading: false })
      }
    }, 10000) // Increased to 10 seconds

    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
      }
    }
  }, [state.isLoading]) // Add state.isLoading as dependency

  const handleRedirect = useCallback(async (profile: Profile | null, isLoggedIn: boolean) => {
    if (!mountedRef.current || redirectInProgressRef.current) return

    const currentPath = pathname || '/'
    console.log('[AuthProvider] Checking redirect:', { currentPath, isLoggedIn, userType: profile?.user_type })
    
    // Only handle redirects from login page to dashboard
    if (isLoggedIn && profile && (currentPath === '/login' || currentPath === '/')) {
      const targetPath = getRedirectPath(profile.user_type)
      if (targetPath !== currentPath && targetPath !== lastRedirectPathRef.current) {
        console.log('[AuthProvider] Redirecting to:', targetPath)
        redirectInProgressRef.current = true
        lastRedirectPathRef.current = targetPath
        try {
          await router.replace(targetPath)
        } catch (error) {
          console.error('[AuthProvider] Redirect error:', error)
        } finally {
          redirectInProgressRef.current = false
        }
      }
    } else {
      console.log('[AuthProvider] No redirect needed')
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

    console.log('[AuthProvider] Processing auth state change:', { event, hasSession: !!session })

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
        console.log('[AuthProvider] Processing sign in event for user:', session.user.id)
        updateAuthState({ isLoading: true })
        
        try {
          const profile = await fetchProfile(session.user.id)
          console.log('[AuthProvider] Fetched profile:', profile)
          
          if (!mountedRef.current) return

          if (!profile) {
            console.error('[AuthProvider] No profile found for user')
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
          
          console.log('[AuthProvider] Updating state with profile:', newState)
          updateAuthState(newState)
          
          // Force redirect on SIGNED_IN event
          if (event === 'SIGNED_IN') {
            const targetPath = getRedirectPath(profile.user_type)
            console.log('[AuthProvider] Forcing redirect after sign in:', targetPath)
            router.replace(targetPath)
          } else {
            handleRedirect(profile, true)
          }
        } catch (error) {
          console.error('[AuthProvider] Error in auth state change flow:', error)
          if (mountedRef.current) {
            updateAuthState({ ...defaultAuthState, isLoading: false })
            handleRedirect(null, false)
          }
        }
      }
    } catch (error) {
      console.error('[AuthProvider] Critical auth state change error:', error)
      if (mountedRef.current) {
        await supabase.auth.signOut()
        updateAuthState({ ...defaultAuthState, isLoading: false })
        handleRedirect(null, false)
      }
    }
  }, [updateAuthState, handleRedirect, fetchProfile, router])

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth effect')
    mountedRef.current = true

    const initializeAuth = async () => {
      console.log('[AuthProvider] Starting auth initialization')
      if (initializationInProgressRef.current) {
        console.log('[AuthProvider] Initialization already in progress')
        return
      }
      initializationInProgressRef.current = true

      try {
        console.log('[AuthProvider] Getting session')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[AuthProvider] Session result:', { hasSession: !!session, hasError: !!error })
        
        if (error) {
          console.error('[AuthProvider] Session initialization error:', error)
          updateAuthState({ ...defaultAuthState, isLoading: false })
          return
        }

        if (!mountedRef.current) {
          console.log('[AuthProvider] Component unmounted during initialization')
          return
        }

        await handleAuthStateChange('INITIAL_SESSION', session)
      } catch (error) {
        console.error('[AuthProvider] Auth initialization error:', error)
        if (mountedRef.current) {
          updateAuthState({ ...defaultAuthState, isLoading: false })
        }
      } finally {
        console.log('[AuthProvider] Initialization complete')
        initializationInProgressRef.current = false
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthProvider] Auth state change:', event)
      handleAuthStateChange(event, session)
    })

    return () => {
      console.log('[AuthProvider] Cleaning up')
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [handleAuthStateChange])

  // Log state changes
  useEffect(() => {
    console.log('[AuthProvider] Current state:', state)
  }, [state])

  const contextValue = useMemo(() => ({
    ...state,
    login: async (email: string, password: string) => {
      console.log('[AuthProvider] Login attempt')
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        console.log('[AuthProvider] Login result:', { success: !error, hasUser: !!data.user })
        
        if (!error && data.user) {
          // Let the auth state change handler handle the redirect
          console.log('[AuthProvider] Login successful, waiting for auth state change')
        }
        
        return { error, data }
      } catch (error) {
        console.error('[AuthProvider] Login error:', error)
        return { error: error as Error }
      }
    },
    signIn: async (email: string, password: string) => {
      console.log('[AuthProvider] SignIn attempt')
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        console.log('[AuthProvider] SignIn result:', { success: !error })
        return { error, data }
      } catch (error) {
        console.error('[AuthProvider] SignIn error:', error)
        return { error: error as Error }
      }
    },
    signUp: async (email: string, password: string, userData?: { full_name?: string, phone?: string }) => {
      console.log('[AuthProvider] SignUp attempt')
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

        if (error) throw error
        if (!data.user) throw new Error('No user returned from sign up')

        // Create profile for the new user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: userData?.full_name || '',
            email: email,
            phone: userData?.phone || '',
            user_type: 'member'  // Default to member for regular signup
          })

        if (profileError) {
          console.error('[AuthProvider] Profile creation error:', profileError)
          // Sign out the user if profile creation fails
          await supabase.auth.signOut()
          throw new Error('Failed to create user profile')
        }

        console.log('[AuthProvider] SignUp result:', { success: true })
        return { error: null, data }
      } catch (error) {
        console.error('[AuthProvider] SignUp error:', error)
        return { error: error as Error }
      }
    },
    logout: async () => {
      console.log('[AuthProvider] Logout attempt')
      await supabase.auth.signOut()
    },
    updateProfile: async (data: Partial<Profile>) => {
      console.log('[AuthProvider] Profile update attempt')
      try {
        const { error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', state.user?.id)
        console.log('[AuthProvider] Profile update result:', { success: !error })
        return { error }
      } catch (error) {
        console.error('[AuthProvider] Profile update error:', error)
        return { error: error as Error }
      }
    }
  }), [state, fetchProfile, router])

  if (state.isLoading) {
    console.log('[AuthProvider] Showing loading state')
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

