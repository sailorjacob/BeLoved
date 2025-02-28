"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { User, Subscription } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { authService, type UserRole } from '@/lib/auth-service'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthState = {
  isLoading: boolean
  isLoggedIn: boolean
  isSuperAdmin: boolean
  isDriver: boolean
  isAdmin: boolean
  user: User | null
  profile: Profile | null
  role: UserRole | null
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
  isLoading: true,
  role: null
}

const AuthContext = createContext<AuthContextType | null>(null)

const publicPaths = ['/login', '/auth/callback', '/']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)
  const isInitialMount = useRef(true)
  const isMounted = useRef(true)
  const router = useRouter()
  const pathname = usePathname()
  const authServiceRef = useRef(authService)
  const isUpdatingRef = useRef(false)

  const updateAuthState = useCallback(async () => {
    if (isUpdatingRef.current || !isMounted.current) return
    isUpdatingRef.current = true

    try {
      const authUser = await authServiceRef.current.getCurrentUser()
      console.log('[AuthProvider] Got auth user:', authUser)

      if (!isMounted.current) return

      if (!authUser) {
        setAuthState({
          ...defaultAuthState,
          isLoading: false
        })
        return
      }

      setAuthState({
        isLoading: false,
        isLoggedIn: !!authUser.isLoggedIn,
        isSuperAdmin: authUser.role === 'super_admin',
        isDriver: authUser.role === 'driver',
        isAdmin: authUser.role === 'admin',
        user: authUser.user,
        profile: authUser.profile,
        role: authUser.role
      })
    } catch (error) {
      console.error('[AuthProvider] Error getting user:', error)
      if (isMounted.current) {
        setAuthState({
          ...defaultAuthState,
          isLoading: false
        })
      }
    } finally {
      isUpdatingRef.current = false
    }
  }, [])

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth...')
    isMounted.current = true

    let subscription: { unsubscribe: () => void } | undefined

    const setupAuth = async () => {
      try {
        const { data } = authServiceRef.current.onAuthStateChange(async (event: string, session: any) => {
          console.log('[AuthProvider] Auth state change:', event, session)

          if (!isMounted.current) return

          if (event === 'SIGNED_OUT') {
            setAuthState({
              ...defaultAuthState,
              isLoading: false
            })
            return
          }

          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await updateAuthState()
          }
        })

        subscription = data.subscription
      } catch (error) {
        console.error('[AuthProvider] Error setting up auth:', error)
      }
    }

    // Initial setup
    setupAuth()
    updateAuthState()

    return () => {
      console.log('[AuthProvider] Cleaning up auth...')
      isMounted.current = false
      subscription?.unsubscribe()
    }
  }, [updateAuthState])

  useEffect(() => {
    // Skip redirect on initial mount or during loading
    if (isInitialMount.current || authState.isLoading || !isMounted.current) {
      isInitialMount.current = false
      return
    }

    console.log('[AuthProvider] Checking redirect:', authState)

    const publicPaths = ['/login', '/signup', '/forgot-password']
    const isPublicPath = publicPaths.includes(pathname)

    if (!authState.isLoggedIn && !isPublicPath) {
      console.log('[AuthProvider] Redirecting to:', '/login')
      router.replace('/login')
      return
    }

    if (authState.isLoggedIn && isPublicPath) {
      const targetPath = authState.isSuperAdmin ? '/super-admin-dashboard' : '/dashboard'
      console.log('[AuthProvider] Redirecting to:', targetPath)
      router.replace(targetPath)
      return
    }

    // Ensure super admin pages are only accessible by super admins
    if (authState.isLoggedIn && pathname.startsWith('/super-admin') && !authState.isSuperAdmin) {
      console.log('[AuthProvider] Redirecting non-super admin to dashboard')
      router.replace('/dashboard')
      return
    }
  }, [authState, pathname, router])

  const contextValue: AuthContextType = {
    ...authState,
    login: async (email, password) => {
      try {
        const data = await authServiceRef.current.login(email, password)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    signIn: async (email, password) => {
      try {
        const data = await authServiceRef.current.login(email, password)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    signUp: async (email, password, userData) => {
      try {
        const data = await authServiceRef.current.signup(email, password, userData)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    logout: async () => {
      await authServiceRef.current.logout()
    },
    updateProfile: async (data) => {
      try {
        if (!authState.user?.id) throw new Error('No user ID available')
        await authServiceRef.current.updateProfile(authState.user.id, data)
        await updateAuthState()
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    }
  }

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
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

