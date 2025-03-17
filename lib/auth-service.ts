import { supabase } from './supabase'
import { supabaseAdmin, ensureUserProfile } from './supabase-admin'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export type UserRole = 'member' | 'driver' | 'admin' | 'super_admin'

export interface AuthUser {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoggedIn: boolean
  role: UserRole | null
}

class AuthService {
  private static instance: AuthService
  
  private constructor() {
    console.log('[AuthService] Service initialized')
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async getSession(): Promise<Session | null> {
    try {
      console.log('[AuthService] Getting session')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('[AuthService] Error getting session:', error)
        return null
      }
      
      if (!session) {
        console.log('[AuthService] No session found')
        return null
      }
      
      console.log('[AuthService] Session found:', {
        id: session.user?.id,
        email: session.user?.email,
        expires_at: session.expires_at
      })
      
      return session
    } catch (error) {
      console.error('[AuthService] Exception getting session:', error)
      return null
    }
  }

  // Separate method for testing database connection
  async testDatabaseConnection(): Promise<boolean> {
    try {
      console.log('[AuthService] Testing database connection')
      // Use a simpler query without functions that might cause parsing issues
      const { data, error } = await supabase.from('profiles').select('id').limit(1)
      
      if (error) {
        console.error('[AuthService] Database connection test failed:', error)
        return false
      }
      
      console.log('[AuthService] Database connection test successful:', data)
      return true
    } catch (error) {
      console.error('[AuthService] Exception testing database connection:', error)
      return false
    }
  }

  private async createProfile(userId: string, email: string): Promise<Profile | null> {
    try {
      console.log('[AuthService] Creating new profile for:', { userId, email })

      // Check if this is the super admin account
      const isSuperAdmin = userId === 'c8ef80bc-c7de-4ba8-a473-bb859b2efd9b'
      const userRole = isSuperAdmin ? 'super_admin' : 'member'
      
      console.log('[AuthService] Creating profile with role:', userRole)

      // Use the admin client to bypass RLS
      const { profile, error } = await ensureUserProfile(userId, email, userRole as any)
      
      if (error) {
        console.error('[AuthService] Error ensuring profile:', error)
        return null
      }

      if (profile) {
        console.log('[AuthService] Profile created/updated successfully:', profile)
        return profile as Profile
      }

      return null
    } catch (error) {
      console.error('[AuthService] Exception in createProfile:', error)
      return null
    }
  }

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('[AuthService] Fetching profile for user:', userId)

      // Test the database connection first
      const isConnected = await this.testDatabaseConnection()
      if (!isConnected) {
        console.error('[AuthService] Database connection test failed')
        return null
      }

      // Try using the admin client first
      try {
        console.log('[AuthService] Attempting to get profile with admin client')
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!error && profile) {
          console.log('[AuthService] Profile found with admin client:', {
            id: profile.id,
            email: profile.email,
            role: profile.user_role
          })
          return profile as Profile
        }
      } catch (adminError) {
        console.error('[AuthService] Error using admin client:', adminError)
      }

      // Fall back to regular client if admin fails
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[AuthService] Error fetching profile:', error)
        console.error('[AuthService] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('[AuthService] Profile not found, attempting to create')
          const session = await this.getSession()
          if (!session?.user?.email) {
            console.error('[AuthService] No email found in session')
            return null
          }

          return this.createProfile(userId, session.user.email)
        }
        
        return null
      }

      if (!profile) {
        console.error('[AuthService] No profile found')
        return null
      }

      console.log('[AuthService] Profile found:', {
        id: profile.id,
        email: profile.email,
        role: profile.user_role,
        created_at: profile.created_at
      })
      
      return profile as Profile
    } catch (error) {
      console.error('[AuthService] Exception getting profile:', error)
      return null
    }
  }

  async getCurrentUser(): Promise<AuthUser> {
    try {
      console.log('[AuthService] Getting current user')
      const session = await this.getSession()
      
      if (!session?.user) {
        console.log('[AuthService] No session found')
        return {
          user: null,
          session: null,
          profile: null,
          isLoggedIn: false,
          role: null
        }
      }

      console.log('[AuthService] Session found for user:', {
        id: session.user.id,
        email: session.user.email
      })

      const profile = await this.getProfile(session.user.id)
      
      if (!profile) {
        console.error('[AuthService] No profile found for user:', session.user.id)
        // Last resort - try to create a profile directly if we're the super admin
        if (session.user.id === 'c8ef80bc-c7de-4ba8-a473-bb859b2efd9b') {
          console.log('[AuthService] Attempting to create super admin profile as last resort')
          const superAdminProfile = await this.createProfile(session.user.id, session.user.email || '')
          if (superAdminProfile) {
            console.log('[AuthService] Created super admin profile:', superAdminProfile)
            return {
              user: session.user,
              session,
              profile: superAdminProfile,
              isLoggedIn: true,
              role: 'super_admin'
            }
          }
        }
        
        return {
          user: session.user,
          session,
          profile: null,
          isLoggedIn: true,
          role: null
        }
      }

      // Validate user_role
      const validRoles: UserRole[] = ['member', 'driver', 'admin', 'super_admin']
      const userRole = profile.user_role as UserRole
      
      if (!userRole || !validRoles.includes(userRole)) {
        console.error('[AuthService] Invalid user_role found:', userRole)
        return {
          user: session.user,
          session,
          profile,
          isLoggedIn: true,
          role: null
        }
      }
      
      // Check user status - don't allow login if inactive
      if (profile.status === 'inactive') {
        console.log('[AuthService] User account is inactive:', profile.id)
        return {
          user: session.user,
          session,
          profile,
          isLoggedIn: false,
          role: userRole
        }
      }
      
      // For admin users, also check if their provider is active
      if (userRole === 'admin' && profile.provider_id) {
        try {
          console.log('[AuthService] Checking provider status for admin:', profile.id)
          const { data: provider, error: providerError } = await supabase
            .from('transportation_providers')
            .select('status')
            .eq('id', profile.provider_id)
            .single()
          
          if (providerError) {
            console.error('[AuthService] Error checking provider status:', providerError)
          } else if (provider && provider.status === 'inactive') {
            console.log('[AuthService] Provider is inactive for admin:', profile.id)
            return {
              user: session.user,
              session,
              profile,
              isLoggedIn: false,
              role: userRole
            }
          }
        } catch (error) {
          console.error('[AuthService] Exception checking provider status:', error)
        }
      }
      
      console.log('[AuthService] Valid role found:', userRole)
      return {
        user: session.user,
        session,
        profile,
        isLoggedIn: true,
        role: userRole
      }
    } catch (error) {
      console.error('[AuthService] Exception getting current user:', error)
      return {
        user: null,
        session: null,
        profile: null,
        isLoggedIn: false,
        role: null
      }
    }
  }

  async login(email: string, password: string) {
    try {
      console.log('[AuthService] Attempting login for:', email);
      
      // Clear any existing session first to avoid token conflicts
      await supabase.auth.signOut();
      
      // Perform login with PKCE flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthService] Login error:', error);
        return { error };
      }

      console.log('[AuthService] Login successful, session established');

      // Force the Supabase client to set the auth token in storage and headers
      if (data.session) {
        // Set auth header manually for subsequent requests
        supabase.realtime.setAuth(data.session.access_token);
        
        // Store session data for debugging
        if (typeof window !== 'undefined') {
          // Only run in browser context
          try {
            localStorage.setItem('supabase_debug_session', JSON.stringify({
              timestamp: new Date().toISOString(),
              hasSession: !!data.session,
              hasToken: !!data.session?.access_token,
              expiresAt: data.session?.expires_at
            }));
          } catch (e) {
            console.error('[AuthService] Could not save debug session info', e);
          }
        }
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('[AuthService] Unexpected login error:', error);
      return { error: error as Error };
    }
  }

  async signup(email: string, password: string, userData?: { 
    full_name?: string
    phone?: string
    user_role?: UserRole 
  }) {
    try {
      console.log('[AuthService] Signing up with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('[AuthService] Signup error:', error);
        return { error };
      }
      
      if (!data.user) {
        console.error('[AuthService] No user returned from signup');
        return { error: new Error('No user returned from signup') };
      }
      
      console.log('[AuthService] User signed up:', data.user.id);
      
      // Create profile if needed
      if (data.user.id) {
        try {
          const profile = await this.createProfile(
            data.user.id, 
            email
          );
          
          // If profile creation was successful and we have userData, update it
          if (profile && userData) {
            const { error: updateError } = await this.updateProfile(data.user.id, userData);
            if (updateError) {
              console.error('[AuthService] Error updating profile after signup:', updateError);
            }
          }
        } catch (error) {
          console.error('[AuthService] Error creating profile after signup:', error);
        }
      }
      
      return { 
        user: data.user, 
        session: data.session,
        error: null 
      };
    } catch (error) {
      console.error('[AuthService] Unexpected signup error:', error);
      return { error: error as Error, user: null, session: null };
    }
  }

  async logout() {
    try {
      console.log('[AuthService] Attempting logout')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('[AuthService] No active session found, clearing local state')
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      console.log('[AuthService] Logout successful')
      window.location.href = '/'
    } catch (error) {
      console.error('[AuthService] Logout error:', error)
      // Don't throw the error, just log it
    }
  }

  async updateProfile(userId: string, data: Partial<Profile>) {
    try {
      console.log('[AuthService] Updating profile for user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('[AuthService] Error updating profile:', error);
        return { error };
      }
      
      console.log('[AuthService] Profile updated successfully');
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Exception updating profile:', error);
      return { error: error as Error };
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = AuthService.getInstance() 