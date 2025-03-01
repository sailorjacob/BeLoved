"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { authService, type UserRole } from '@/lib/auth-service'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthState = {
  isLoading: boolean
  isLoggedIn: boolean
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
  signUp: (email: string, password: string, userData?: { full_name?: string, phone?: string }) => Promise<AuthResponse>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
}

const defaultAuthState: AuthState = {
  user: null,
  profile: null,
  isLoggedIn: false,
  isLoading: true,
  role: null
}

const AuthContext = createContext<AuthContextType | null>(null)

const publicPaths = ['/', '/login', '/signup', '/forgot-password']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const authUser = await authService.getCurrentUser()
        
        if (!mounted) return

        const newState = {
          isLoading: false,
          isLoggedIn: !!authUser.isLoggedIn,
          user: authUser.user,
          profile: authUser.profile,
          role: authUser.role
        }

        setAuthState(newState)
      } catch (error) {
        console.error('[Auth] Error:', error)
        if (mounted) {
          setAuthState({ ...defaultAuthState, isLoading: false })
        }
      }
    }

    const { data: { subscription } } = authService.onAuthStateChange((event) => {
      if (!mounted) return
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth()
      } else if (event === 'SIGNED_OUT') {
        setAuthState({ ...defaultAuthState, isLoading: false })
      }
    })

    checkAuth()

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  // Handle navigation based on auth state
  useEffect(() => {
    if (authState.isLoading) return

    const isPublicPath = publicPaths.includes(pathname || '')

    if (!authState.isLoggedIn && !isPublicPath) {
      router.replace('/login')
    } else if (authState.isLoggedIn && isPublicPath) {
      const dashboardPath = getDashboardPath(authState.role)
      router.replace(dashboardPath)
    }
  }, [authState.isLoggedIn, authState.role, pathname, router, authState.isLoading])

  const contextValue: AuthContextType = {
    ...authState,
    login: async (email, password) => {
      try {
        const data = await authService.login(email, password)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    signUp: async (email, password, userData) => {
      try {
        const data = await authService.signup(email, password, userData)
        return { error: null, data }
      } catch (error) {
        return { error: error as Error }
      }
    },
    logout: async () => {
      await authService.logout()
      router.replace('/login')
    },
    updateProfile: async (data) => {
      try {
        if (!authState.user?.id) throw new Error('No user ID available')
        await authService.updateProfile(authState.user.id, data)
        const authUser = await authService.getCurrentUser()
        setAuthState(prev => ({
          ...prev,
          profile: authUser.profile
        }))
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    }
  }

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

function getDashboardPath(role: UserRole | null): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin-dashboard'
    case 'admin':
      return '/admin-dashboard'
    case 'driver':
      return '/driver-dashboard'
    case 'member':
      return '/dashboard'
    default:
      return '/login'
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

