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

// Navigation management to prevent loops
export class NavigationManager {
  private static lastNavigationTime: number = 0;
  private static isNavigating: boolean = false;
  private static MIN_INTERVAL_MS: number = 500; // Reduced from 3000ms to 500ms for more responsive navigation
  private static DEBUG: boolean = true; // Enable debug mode

  // Clear navigation flags on session expiration or logout
  static reset(): void {
    localStorage.removeItem('last_navigation');
    localStorage.removeItem('last_navigation_path');
    this.isNavigating = false;
    if (this.DEBUG) logWithTime('Navigation', 'Navigation state reset');
  }

  // Check if we can navigate now
  static canNavigate(path: string, forceNavigation: boolean = false): boolean {
    // If force navigation is true, bypass all checks
    if (forceNavigation) {
      if (this.DEBUG) logWithTime('Navigation', `Force navigating to ${path}`);
      return true;
    }
    
    // Don't navigate if already navigating
    if (this.isNavigating) {
      logWithTime('Navigation', `Already navigating, won't navigate to ${path}`);
      return false;
    }

    // Get current time and last navigation time
    const now = Date.now();
    const lastNavTime = parseInt(localStorage.getItem('last_navigation') || '0', 10);
    const lastNavPath = localStorage.getItem('last_navigation_path') || '';
    
    // If navigating to the same path and it's too soon, prevent it
    if (lastNavPath === path && now - lastNavTime < this.MIN_INTERVAL_MS) {
      logWithTime('Navigation', `Prevented navigation loop to ${path} (last navigated ${now - lastNavTime}ms ago)`);
      return false;
    }

    return true;
  }

  // Perform navigation with safeguards
  static navigate(path: string, reason: string, forceNavigation: boolean = false): void {
    if (!this.canNavigate(path, forceNavigation)) return;

    // Check if we're already on this path
    const currentPath = window.location.pathname;
    if (currentPath === path) {
      logWithTime('Navigation', `Already on ${path}, no navigation needed`);
      return;
    }

    this.isNavigating = true;
    const now = Date.now();
    
    // Store navigation info
    localStorage.setItem('last_navigation', now.toString());
    localStorage.setItem('last_navigation_path', path);
    
    logWithTime('Navigation', `Navigating to ${path} (Reason: ${reason})`);
    
    // Force a full page navigation by setting window.location.href
    // This ensures the URL actually changes in the browser
    const fullUrl = window.location.origin + path;
    logWithTime('Navigation', `Full URL: ${fullUrl}`);
    
    // Use direct navigation for more reliable behavior
    window.location.href = fullUrl;
    
    // Reset flag after a delay
    setTimeout(() => {
      this.isNavigating = false;
    }, 1000); // Reduced from 5000ms to 1000ms
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
  
  // Log instance creation
  useEffect(() => {
    logWithTime('AuthProvider', `Instance created: ${instanceId.current}`);
    return () => {
      mountedRef.current = false;
      logWithTime('AuthProvider', `Instance cleanup: ${instanceId.current}`);
    };
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
      
      const authUser = await authService.getCurrentUser();
      
      // Skip if component unmounted
      if (!mountedRef.current) return;
      
      logWithTime('AuthProvider', 'Auth check result:', {
        isLoggedIn: authUser.isLoggedIn,
        userId: authUser.user?.id,
        role: authUser.role
      });
      
      // Update state with auth check results
      setUser(authUser.user);
      setSession(authUser.session);
      setProfile(authUser.profile);
      setRole(authUser.role);
      setIsLoggedIn(authUser.isLoggedIn);
      
      // Only redirect if desired role path is available and user is logged in
      if (!skipRedirect && authUser.isLoggedIn && authUser.role) {
        await handleRoleBasedRedirect(authUser.role);
      }
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
    }
  }, []);
  
  // Handle role-based redirection
  const handleRoleBasedRedirect = useCallback(async (userRole: UserRole) => {
    // Only redirect from home or login page
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/login') {
      logWithTime('AuthProvider', `Not on login/home (${currentPath}), skipping redirect`);
      return;
    }
    
    // Get dashboard path based on role
    let dashboardPath = '/';
    switch (userRole) {
      case 'super_admin': dashboardPath = '/super-admin-dashboard'; break;
      case 'admin': dashboardPath = '/admin-dashboard'; break;
      case 'driver': dashboardPath = '/driver-dashboard'; break;
      case 'member': dashboardPath = '/dashboard'; break;
    }
    
    // Check if we're already on the dashboard path or being redirected to it
    const isAlreadyRedirecting = localStorage.getItem('last_navigation_path') === dashboardPath;
    const timeSinceLastNav = Date.now() - parseInt(localStorage.getItem('last_navigation') || '0', 10);
    
    if (isAlreadyRedirecting && timeSinceLastNav < 5000) {
      logWithTime('AuthProvider', `Already redirecting to ${dashboardPath}, preventing loop`);
      return;
    }
    
    // Use navigation manager to safely redirect
    NavigationManager.navigate(dashboardPath, `User role: ${userRole}`);
  }, []);
  
  // Initialize auth on mount
  useEffect(() => {
    logWithTime('AuthProvider', 'Initializing auth');
    
    // Initial auth check
    checkAuth();
    
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
      }
    });
    
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [checkAuth]);
  
  // Login method
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    logWithTime('AuthProvider', `Login attempt: ${email}`);
    setIsLoading(true);
    
    try {
      const result = await authService.login(email, password);
      
      if ('error' in result && result.error) {
        return { 
          error: result.error instanceof Error 
            ? result.error 
            : new Error(String(result.error))
        };
      }
      
      if (!mountedRef.current) {
        return { 
          error: null, 
          data: { user: result.user, session: result.session } 
        };
      }
      
      logWithTime('AuthProvider', 'Login successful');
      // Auth state change will trigger checkAuth
      return { 
        error: null, 
        data: { user: result.user, session: result.session } 
      };
    } catch (error) {
      logWithTime('AuthProvider', 'Login error:', error);
      return { 
        error: error instanceof Error 
          ? error 
          : new Error('Unknown login error')
      };
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  // Signup method
  const signUp = async (
    email: string, 
    password: string, 
    userData?: { full_name?: string; phone?: string }
  ): Promise<AuthResponse> => {
    logWithTime('AuthProvider', `Signup attempt: ${email}`);
    setIsLoading(true);
    
    try {
      const result = await authService.signup(email, password, {
        full_name: userData?.full_name,
        phone: userData?.phone,
        user_type: 'member' as UserRole
      });
      
      if ('error' in result && result.error) {
        return { 
          error: result.error instanceof Error 
            ? result.error 
            : new Error(String(result.error))
        };
      }
      
      if (!mountedRef.current) {
        return { 
          error: null, 
          data: { user: result.user, session: result.session } 
        };
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

