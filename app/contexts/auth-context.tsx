"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { authService, type UserRole } from '@/lib/auth-service'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']

// Simple logging with timestamps
const logWithTime = (area: string, message: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
  console.log(`[${timestamp}][${area}] ${message}`, data || '')
}

// Auth state interface for the context
interface AuthState {
  isLoading: boolean
  isInitialized: boolean
  isLoggedIn: boolean
  user: User | null
  session: Session | null
  profile: Profile | null
  role: UserRole | null
}

// Response format for auth operations
interface AuthResponse {
  error: Error | null
  data?: {
    user: User | null
    session: Session | null
  }
}

// Context provides auth state and methods
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, userData?: { 
    full_name?: string
    phone?: string
  }) => Promise<AuthResponse>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>
  isAdmin: boolean
  isSuperAdmin: boolean
  isDriver: boolean
  isMember: boolean
}

// Default state for the context
const defaultState: AuthState = {
  isLoading: true,
  isInitialized: false,
  isLoggedIn: false,
  user: null,
  session: null,
  profile: null,
  role: null
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null)

// Export NavigationManager for use in other components
export class NavigationManager {
  private static DEBUG: boolean = true;
  
  // Set the router instance
  static setRouter(router: any): void {
    if (this.DEBUG) logWithTime('Navigation', 'Router instance set (no-op)');
  }
  
  // Clear navigation flags on session expiration or logout
  static reset(): void {
    if (this.DEBUG) logWithTime('Navigation', 'Navigation state reset (no-op)');
  }

  // Direct navigation method that bypasses all checks
  static directNavigate(path: string): void {
    logWithTime('Navigation', `EMERGENCY DIRECT NAVIGATION to: ${path}`);
    
    // EMERGENCY DIRECT NAVIGATION: Completely bypass Next.js routing
    const fullPath = path.startsWith('http') ? path : window.location.origin + path;
    logWithTime('Navigation', `Full URL: ${fullPath}`);
    
    // Force a complete page reload to the target URL
    window.location.href = fullPath;
  }

  // Perform navigation with safeguards
  static navigate(path: string, reason: string, forceNavigation: boolean = false): void {
    logWithTime('Navigation', `EMERGENCY DIRECT NAVIGATION to ${path} (Reason: ${reason})`);
    
    // EMERGENCY DIRECT NAVIGATION: Completely bypass Next.js routing
    const fullPath = path.startsWith('http') ? path : window.location.origin + path;
    logWithTime('Navigation', `Full URL: ${fullPath}`);
    
    // Force a complete page reload to the target URL
    window.location.href = fullPath;
  }
}

// Main auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const instanceId = useRef(`auth-${Date.now()}`);
  
  // Auth state
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  
  // Refs for state management
  const mountedRef = useRef(true);
  const checkingRef = useRef(false);
  const initializationAttempted = useRef(false);
  
  // Log instance creation
  useEffect(() => {
    logWithTime('AuthProvider', `Instance created: ${instanceId.current}`);
    return () => {
      mountedRef.current = false;
      logWithTime('AuthProvider', `Instance cleanup: ${instanceId.current}`);
    };
  }, []);

  // Handle role-based redirection
  const handleRoleBasedRedirect = useCallback(async (userRole: UserRole) => {
    // DISABLED: All automatic redirects
    logWithTime('AuthProvider', 'Automatic redirects have been disabled');
    return;
    
    // The code below is disabled
    // Only redirect from home or login page
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/login') {
      logWithTime('AuthProvider', `Not on login/home (${currentPath}), skipping redirect`);
      return;
    }
    
    // Simple flag to prevent infinite redirects
    const redirectFlag = sessionStorage.getItem('redirect_attempted');
    if (redirectFlag === 'true') {
      logWithTime('AuthProvider', 'Redirect already attempted, skipping to prevent loops');
      return;
    }
    
    // Set the flag to prevent future redirects in this session
    sessionStorage.setItem('redirect_attempted', 'true');
    
    // Get dashboard path based on role
    let dashboardPath = '/';
    switch (userRole) {
      case 'super_admin': dashboardPath = '/super-admin-dashboard'; break;
      case 'admin': dashboardPath = '/admin-dashboard'; break;
      case 'driver': dashboardPath = '/driver-dashboard'; break;
      case 'member': dashboardPath = '/dashboard'; break;
    }
    
    logWithTime('AuthProvider', `Redirecting to: ${dashboardPath}`);
    
    // Just use the browser's default navigation
    window.location.href = window.location.origin + dashboardPath;
  }, []);

  // Check if user is authenticated and get profile
  const checkAuth = useCallback(async (skipRedirect = false) => {
    // Prevent concurrent checks
    if (checkingRef.current) {
      logWithTime('AuthProvider', 'Auth check already in progress, skipping');
      return;
    }
    
    try {
      checkingRef.current = true;
      logWithTime('AuthProvider', 'Starting auth check');
      setIsLoading(true);
      
      // Get current session first
      const currentSession = await authService.getSession();
      
      // If no session, clear auth state
      if (!currentSession) {
        logWithTime('AuthProvider', 'No session found, clearing auth state');
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole(null);
        setIsLoggedIn(false);
        return;
      }
      
      // Set session state
      setSession(currentSession);
      setUser(currentSession.user);
      
      // Get user profile
      const authUser = await authService.getCurrentUser();
      
      // Skip if component unmounted
      if (!mountedRef.current) return;
      
      logWithTime('AuthProvider', 'Auth check result:', {
        isLoggedIn: authUser.isLoggedIn,
        userId: authUser.user?.id,
        role: authUser.role
      });
      
      // Update state with auth check results
      setProfile(authUser.profile);
      setRole(authUser.role);
      setIsLoggedIn(authUser.isLoggedIn);
      
    } catch (error) {
      logWithTime('AuthProvider', 'Error checking auth:', error);
      
      // Skip if component unmounted
      if (!mountedRef.current) return;
      
      // Reset auth state on error
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setIsLoggedIn(false);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsInitialized(true);
      }
      checkingRef.current = false;
      initializationAttempted.current = true;
    }
  }, []);
  
  // Initialize auth on mount
  useEffect(() => {
    logWithTime('AuthProvider', 'Initializing auth');
    
    // Initial auth check
    if (!initializationAttempted.current) {
      checkAuth();
    }
    
    // Subscribe to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;
      logWithTime('AuthProvider', `Auth state changed: ${event}`);
      
      if (event === 'SIGNED_IN') {
        logWithTime('AuthProvider', 'User signed in, updating state');
        await checkAuth(false); // Check auth with redirection
      } else if (event === 'SIGNED_OUT') {
        logWithTime('AuthProvider', 'User signed out, resetting state');
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole(null);
        setIsLoggedIn(false);
        NavigationManager.reset();
      } else if (event === 'USER_UPDATED') {
        logWithTime('AuthProvider', 'User updated, refreshing state');
        await checkAuth(true); // Check auth without redirection
      } else if (event === 'INITIAL_SESSION') {
        logWithTime('AuthProvider', 'Initial session received');
        if (session) {
          await checkAuth(true);
        } else {
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    });
    
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [checkAuth]);
  
  // Login method
  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      logWithTime('AuthProvider', 'Login attempt:', email);
      
      // Call login method from auth service
      const result = await authService.login(email, password);
      
      if (result.error) {
        logWithTime('AuthProvider', 'Login failed:', result.error);
        return { error: result.error };
      }
      
      logWithTime('AuthProvider', 'Login successful');
      
      // Perform auth check to update state after login
      await checkAuth(false);
      
      return { error: null, data: result.data };
    } catch (error) {
      logWithTime('AuthProvider', 'Login exception:', error);
      return { error: error as Error };
    }
  }, [checkAuth]);
  
  // Signup method
  const signUp = async (
    email: string, 
    password: string, 
    userData?: { full_name?: string; phone?: string }
  ): Promise<AuthResponse> => {
    try {
      logWithTime('AuthProvider', `Signup attempt: ${email}`);
      setIsLoading(true);
      
      // Map userData to the format expected by the auth service
      const signupData = {
        full_name: userData?.full_name || '',
        phone: userData?.phone || '',
        user_role: 'member' as const // Use user_role instead of user_type
      };
      
      const result = await authService.signup(email, password, signupData);
      
      if (result.error) {
        return { error: result.error };
      }
      
      logWithTime('AuthProvider', 'Signup successful');
      
      // Auth state change will trigger checkAuth
      return { 
        error: null, 
        data: { user: result.user, session: result.session } 
      };
    } catch (error) {
      logWithTime('AuthProvider', 'Signup error:', error);
      return { 
        error: error instanceof Error 
          ? error 
          : new Error('Unknown signup error')
      };
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  // Logout method
  const logout = async (): Promise<void> => {
    logWithTime('AuthProvider', 'Logout attempt');
    
    try {
      await authService.logout();
      logWithTime('AuthProvider', 'Logout successful');
      
      // Clear navigation flags
      NavigationManager.reset();
      
      // Auth state will be updated via the event listener
    } catch (error) {
      logWithTime('AuthProvider', 'Logout error:', error);
    }
  };
  
  // Profile update method
  const updateProfile = async (data: Partial<Profile>) => {
    logWithTime('AuthProvider', 'Profile update attempt');
    
    try {
      if (!user) {
        return { error: new Error('User not authenticated') };
      }
      
      await authService.updateProfile(user.id, data);
      logWithTime('AuthProvider', 'Profile update successful');
      
      // Refresh auth state without redirection
      if (mountedRef.current) {
        await checkAuth(true);
      }
      
      return { error: null };
    } catch (error) {
      logWithTime('AuthProvider', 'Profile update error:', error);
      return { 
        error: error instanceof Error 
          ? error 
          : new Error('Unknown profile update error')
      };
    }
  };
  
  // Role helpers
  const isAdmin = !!role && (role === 'admin' || role === 'super_admin');
  const isSuperAdmin = role === 'super_admin';
  const isDriver = role === 'driver';
  const isMember = role === 'member';
  
  // Provide context value
  const value = {
    isLoading,
    isInitialized,
    isLoggedIn,
    user,
    session,
    profile,
    role,
    login,
    signUp,
    logout,
    updateProfile,
    isAdmin,
    isSuperAdmin,
    isDriver,
    isMember
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

