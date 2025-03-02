"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { authService, type UserRole } from '@/lib/auth-service'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  isLoading: boolean
  isLoggedIn: boolean
  user: User | null
  session: Session | null
  profile: Profile | null
  role: UserRole | null
}

interface AuthResponse {
  error: Error | null
  data?: {
    user: User | null
    session: Session | null
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, userData?: { 
    full_name?: string
    phone?: string
  }) => Promise<AuthResponse>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
}

const initialState: AuthState = {
  isLoading: true,
  isLoggedIn: false,
  user: null,
  session: null,
  profile: null,
  role: null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const mountedRef = useRef(true)
  const checkingRef = useRef(false)
  
  // Define checkAuth first to avoid reference before declaration
  const checkAuth = useCallback(async () => {
    // Skip if already checking to prevent race conditions
    if (checkingRef.current) {
      console.log('[AuthContext] Already checking auth, skipping')
      return
    }
    
    // Skip if component is unmounted
    if (!mountedRef.current) {
      console.log('[AuthContext] Component unmounted, skipping auth check')
      return
    }
    
    console.log('[AuthContext] Checking auth state')
    checkingRef.current = true
    setIsLoading(true)
    
    try {
      const authUser = await authService.getCurrentUser()
      
      // Check if component is still mounted after async call
      if (!mountedRef.current) return
      
      const userId = authUser.user?.id
      
      console.log('[AuthContext] Current user state:', {
        isLoggedIn: authUser.isLoggedIn,
        userId: userId,
        role: authUser.role
      })
      
      setUser(authUser.user)
      setSession(authUser.session)
      setProfile(authUser.profile)
      setRole(authUser.role)
      setIsLoggedIn(authUser.isLoggedIn)
    } catch (error) {
      console.error('[AuthContext] Error checking auth:', error)
      
      // Check if component is still mounted
      if (!mountedRef.current) return
      
      setUser(null)
      setSession(null)
      setProfile(null)
      setRole(null)
      setIsLoggedIn(false)
    } finally {
      // Check if component is still mounted
      if (mountedRef.current) {
        setIsLoading(false)
      }
      checkingRef.current = false
    }
  }, [])
  
  // Simplified redirection with safeguards
  const attemptRedirectOnLogin = useCallback((userRole: UserRole) => {
    if (!userRole || !mountedRef.current) return;
    
    try {
      // Use session storage to track redirect attempts
      // This ensures redirect attempts persist even on component remounts
      const redirectKey = `redirect_${Date.now()}`;
      
      // Get current path
      const currentPath = window.location.pathname;
      
      // Only redirect from login/home
      if (currentPath !== '/' && currentPath !== '/login') {
        console.log('[AuthContext] Not on login/home page, skipping redirect');
        return;
      }
      
      // Check if we've already attempted to redirect
      if (sessionStorage.getItem('auth_redirect_attempted') === 'true') {
        console.log('[AuthContext] Already attempted redirect, not trying again');
        return;
      }
      
      // Determine target dashboard
      let dashboardUrl = '/';
      switch (userRole) {
        case 'super_admin': dashboardUrl = '/super-admin-dashboard'; break;
        case 'admin': dashboardUrl = '/admin-dashboard'; break;
        case 'driver': dashboardUrl = '/driver-dashboard'; break;
        case 'member': dashboardUrl = '/dashboard'; break;
      }
      
      // Set redirect flag
      sessionStorage.setItem('auth_redirect_attempted', 'true');
      console.log('[AuthContext] Setting redirect attempt flag in session storage');
      
      // Use direct window navigation
      console.log('[AuthContext] Redirecting to:', dashboardUrl);
      window.location.href = dashboardUrl;
      
      // Clear the flag after a minute to allow future redirects
      setTimeout(() => {
        if (sessionStorage.getItem('auth_redirect_attempted') === 'true') {
          console.log('[AuthContext] Clearing redirect flag after timeout');
          sessionStorage.removeItem('auth_redirect_attempted');
        }
      }, 60000);
    } catch (error) {
      console.error('[AuthContext] Error during redirect attempt:', error);
    }
  }, []);
  
  // Create effect to trigger redirect when role changes
  useEffect(() => {
    if (role && isLoggedIn && !isLoading) {
      console.log('[AuthContext] User authenticated, role:', role);
      attemptRedirectOnLogin(role);
    }
  }, [role, isLoggedIn, isLoading, attemptRedirectOnLogin]);
  
  // Effect to initialize auth
  useEffect(() => {
    console.log('[AuthContext] Auth provider mounted');
    mountedRef.current = true;
    
    // Clear redirect flag on component mount if needed
    const lastRedirectTime = parseInt(sessionStorage.getItem('auth_redirect_timestamp') || '0', 10);
    const currentTime = Date.now();
    if (currentTime - lastRedirectTime > 60000) {
      // Reset if last redirect was more than a minute ago
      sessionStorage.removeItem('auth_redirect_attempted');
    }
    
    // Initial auth check
    checkAuth();
    
    // Set up auth state change subscription
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return
      console.log('[AuthContext] Auth state changed:', event)
      
      if (event === 'SIGNED_IN') {
        console.log('[AuthContext] User signed in, updating state')
        await checkAuth()
        
        // After checkAuth completes, the role will be set, triggering our redirection
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out, resetting state')
        setUser(null)
        setSession(null)
        setProfile(null)
        setRole(null)
        setIsLoggedIn(false)
      } else if (event === 'USER_UPDATED') {
        console.log('[AuthContext] User updated, refreshing state')
        await checkAuth()
      }
    })

    // Cleanup function
    return () => {
      console.log('[AuthContext] Cleaning up subscription')
      mountedRef.current = false
      if (subscription?.unsubscribe) {
        subscription.unsubscribe()
      }
    }
  }, [checkAuth])
  
  const value = {
    isLoading,
    isLoggedIn,
    user,
    session,
    profile,
    role,
    login: async (email: string, password: string): Promise<AuthResponse> => {
      console.log('[AuthContext] Attempting login')
      try {
        const data = await authService.login(email, password)
        if (mountedRef.current) {
          await checkAuth()
        }
        return { error: null, data }
      } catch (error) {
        console.error('[AuthContext] Login error:', error)
        return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
      }
    },
    signUp: async (email: string, password: string, userData?: {
      full_name?: string
      phone?: string
      user_type?: UserRole
    }): Promise<AuthResponse> => {
      console.log('[AuthContext] Attempting signup')
      try {
        const data = await authService.signup(email, password, userData)
        if (mountedRef.current) {
          await checkAuth()
        }
        return { error: null, data }
      } catch (error) {
        console.error('[AuthContext] Signup error:', error)
        return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
      }
    },
    logout: async () => {
      console.log('[AuthContext] Attempting logout')
      await authService.logout()
      if (mountedRef.current) {
        setUser(null)
        setSession(null)
        setProfile(null)
        setRole(null)
        setIsLoggedIn(false)
      }
    },
    updateProfile: async (data: Partial<Profile>): Promise<{ error: Error | null }> => {
      console.log('[AuthContext] Updating profile')
      try {
        if (!user?.id) throw new Error('No user ID available')
        await authService.updateProfile(user.id, data)
        if (mountedRef.current) {
          await checkAuth()
        }
        return { error: null }
      } catch (error) {
        console.error('[AuthContext] Update profile error:', error)
        return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
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

