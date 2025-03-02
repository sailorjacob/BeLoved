"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { authService, type UserRole } from '@/lib/auth-service'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']

// GLOBAL AUTH STATE to ensure single source of truth
// This exists outside React's component lifecycle
const GLOBAL_AUTH_STATE: {
  hasInitialized: boolean;
  isPerformingRedirect: boolean;
  instanceCount: number;
  lastInstance: string | null;
  redirectAttempted: boolean;
} = {
  hasInitialized: false,
  isPerformingRedirect: false,
  instanceCount: 0,
  lastInstance: null,
  redirectAttempted: false
};

// Create a unique ID for this instance of the provider
const createInstanceId = () => `auth-instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Global redirection handler that works independently of component state
function safeRedirect(destPath: string, reason: string) {
  // Check if already redirecting
  if (GLOBAL_AUTH_STATE.isPerformingRedirect) {
    console.log(`[AUTH-GLOBAL] Already redirecting, skipping redirect to ${destPath}`);
    return;
  }
  
  // Check if we're already on this path
  if (window.location.pathname === destPath) {
    console.log(`[AUTH-GLOBAL] Already at ${destPath}, skipping redirect`);
    return;
  }
  
  // Check session storage for recent redirects (prevents loops)
  const now = Date.now();
  const lastRedirectTime = parseInt(sessionStorage.getItem('last_redirect_time') || '0', 10);
  const lastRedirectPath = sessionStorage.getItem('last_redirect_path') || '';
  
  // If we redirected less than 2 seconds ago to the same path, skip this redirect
  if (lastRedirectPath === destPath && now - lastRedirectTime < 2000) {
    console.log(`[AUTH-GLOBAL] Prevented redirect loop to ${destPath} (redirected ${now - lastRedirectTime}ms ago)`);
    return;
  }
  
  // Mark as redirecting
  GLOBAL_AUTH_STATE.isPerformingRedirect = true;
  GLOBAL_AUTH_STATE.redirectAttempted = true;
  
  // Store redirect info
  sessionStorage.setItem('last_redirect_time', now.toString());
  sessionStorage.setItem('last_redirect_path', destPath);
  sessionStorage.setItem('redirect_reason', reason);
  
  console.log(`[AUTH-GLOBAL] REDIRECTING TO: ${destPath} | Reason: ${reason}`);
  
  // Use window.location for reliable navigation
  window.location.href = destPath;
}

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

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const instanceId = useRef(createInstanceId());
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const mountedRef = useRef(true)
  const checkingRef = useRef(false)
  
  // Track instances to detect duplicate providers
  useEffect(() => {
    GLOBAL_AUTH_STATE.instanceCount++;
    GLOBAL_AUTH_STATE.lastInstance = instanceId.current;
    
    console.log(`[AUTH-PROVIDER] Provider mounted #${GLOBAL_AUTH_STATE.instanceCount} (${instanceId.current})`);
    
    return () => {
      GLOBAL_AUTH_STATE.instanceCount--;
      console.log(`[AUTH-PROVIDER] Provider unmounted (${instanceId.current}), ${GLOBAL_AUTH_STATE.instanceCount} remaining`);
    };
  }, []);
  
  // Auto-redirect logic based on user role
  const handleRoleBasedRedirection = useCallback((userRole: UserRole | null) => {
    // Skip if no role or already redirecting
    if (!userRole || GLOBAL_AUTH_STATE.redirectAttempted) return;
    
    // Only redirect from login or home page
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/login') {
      console.log(`[AUTH-PROVIDER] Not on login/home (${currentPath}), skipping auto-redirect`);
      return;
    }
    
    // Get target dashboard based on role
    let dashboardUrl = '/';
    switch (userRole) {
      case 'super_admin': dashboardUrl = '/super-admin-dashboard'; break;
      case 'admin': dashboardUrl = '/admin-dashboard'; break;
      case 'driver': dashboardUrl = '/driver-dashboard'; break;
      case 'member': dashboardUrl = '/dashboard'; break;
    }
    
    // Use the global redirect function for safe redirection
    safeRedirect(dashboardUrl, `User role: ${userRole}`);
  }, []);
  
  // Check auth state - getting the current authenticated user
  const checkAuth = useCallback(async () => {
    // Skip if already checking
    if (checkingRef.current) {
      console.log('[AUTH-PROVIDER] Auth check already in progress');
      return;
    }
    
    try {
      checkingRef.current = true;
      console.log('[AUTH-PROVIDER] Checking auth state');
      setIsLoading(true);
      
      const currentUser = await authService.getCurrentUser();
      
      // Skip state updates if unmounted
      if (!mountedRef.current) return;
      
      console.log('[AUTH-PROVIDER] Auth state result:', {
        isLoggedIn: currentUser.isLoggedIn,
        userId: currentUser.user?.id,
        role: currentUser.role
      });
      
      setUser(currentUser.user);
      setSession(currentUser.session);
      setProfile(currentUser.profile);
      setRole(currentUser.role);
      setIsLoggedIn(currentUser.isLoggedIn);
      
      // Handle redirection if authenticated with role
      if (currentUser.isLoggedIn && currentUser.role) {
        handleRoleBasedRedirection(currentUser.role);
      }
    } catch (error) {
      console.error('[AUTH-PROVIDER] Error checking auth:', error);
      
      // Skip state updates if unmounted
      if (!mountedRef.current) return;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setIsLoggedIn(false);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      checkingRef.current = false;
    }
  }, [handleRoleBasedRedirection]);
  
  // Initialize auth on mount
  useEffect(() => {
    if (GLOBAL_AUTH_STATE.hasInitialized) {
      console.log('[AUTH-PROVIDER] Auth already initialized by another provider');
      return; // Only let one provider initialize
    }
    
    GLOBAL_AUTH_STATE.hasInitialized = true;
    mountedRef.current = true;
    
    console.log('[AUTH-PROVIDER] Initializing auth subscription');
    
    // Clear any stale redirection state at app startup
    const lastRedirectTime = parseInt(sessionStorage.getItem('last_redirect_time') || '0', 10);
    if (Date.now() - lastRedirectTime > 60000) {
      sessionStorage.removeItem('last_redirect_time');
      sessionStorage.removeItem('last_redirect_path');
      sessionStorage.removeItem('redirect_reason');
      GLOBAL_AUTH_STATE.redirectAttempted = false;
    }
    
    // Do initial auth check
    checkAuth();
    
    // Set up auth state change subscription
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;
      console.log('[AUTH-PROVIDER] Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        // Reset redirect flag on new sign-in
        GLOBAL_AUTH_STATE.redirectAttempted = false;
        console.log('[AUTH-PROVIDER] User signed in, updating state');
        await checkAuth();
      } else if (event === 'SIGNED_OUT') {
        console.log('[AUTH-PROVIDER] User signed out, resetting state');
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole(null);
        setIsLoggedIn(false);
      } else if (event === 'USER_UPDATED') {
        console.log('[AUTH-PROVIDER] User updated, refreshing state');
        await checkAuth();
      }
    });
    
    // Clean up on unmount
    return () => {
      console.log('[AUTH-PROVIDER] Cleaning up auth subscription');
      mountedRef.current = false;
      
      // Only clean up global state if this is the instance that initialized
      if (GLOBAL_AUTH_STATE.lastInstance === instanceId.current) {
        GLOBAL_AUTH_STATE.hasInitialized = false;
        console.log('[AUTH-PROVIDER] Resetting global auth state');
      }
      
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [checkAuth]);
  
  // Auth context value with methods for login, logout, etc.
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const result = await authService.login(email, password)
      
      if ('error' in result && result.error) {
        return { error: result.error instanceof Error ? result.error : new Error(String(result.error)) }
      }
      
      if (!mountedRef.current) {
        return { error: null, data: { user: result.user, session: result.session } }
      }
      
      // After login, checkAuth will be called via the auth state change event
      console.log('[AUTH-PROVIDER] Login successful')
      return { error: null, data: { user: result.user, session: result.session } }
    } catch (error) {
      console.error('[AUTH-PROVIDER] Error during login:', error)
      return { error: error instanceof Error ? error : new Error('Unknown login error') }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }
  
  const signUp = async (
    email: string,
    password: string,
    userData?: { full_name?: string; phone?: string }
  ): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const result = await authService.signup(email, password, {
        full_name: userData?.full_name,
        phone: userData?.phone,
        user_type: 'member' as UserRole, // Default role for new sign-ups
      })
      
      if ('error' in result && result.error) {
        return { error: result.error instanceof Error ? result.error : new Error(String(result.error)) }
      }
      
      if (!mountedRef.current) {
        return { error: null, data: { user: result.user, session: result.session } }
      }
      
      console.log('[AUTH-PROVIDER] Signup successful')
      // After signup, checkAuth will be called via the auth state change event
      return { error: null, data: { user: result.user, session: result.session } }
    } catch (error) {
      console.error('[AUTH-PROVIDER] Error during signup:', error)
      return { error: error instanceof Error ? error : new Error('Unknown signup error') }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }
  
  const logout = async (): Promise<void> => {
    try {
      await authService.logout()
      // After logout, state will be reset via the auth state change event
      console.log('[AUTH-PROVIDER] Logout successful')
      
      // Reset redirection flag on logout
      GLOBAL_AUTH_STATE.redirectAttempted = false;
    } catch (error) {
      console.error('[AUTH-PROVIDER] Error during logout:', error)
    }
  }
  
  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) {
        return { error: new Error('User not authenticated') }
      }
      
      await authService.updateProfile(user.id, data)
      
      // Refresh auth state to get updated profile
      if (mountedRef.current) {
        await checkAuth()
      }
      
      return { error: null }
    } catch (error) {
      console.error('[AUTH-PROVIDER] Error updating profile:', error)
      return { error: error as Error }
    }
  }
  
  const value = {
    isLoading,
    isLoggedIn,
    user,
    session,
    profile,
    role,
    login,
    signUp,
    logout,
    updateProfile,
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

