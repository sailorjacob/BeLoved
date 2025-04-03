import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase, getSupabaseClient } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import { ensureUserProfile } from './supabase-admin'
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
  private currentSession: Session | null = null
  private currentUser: User | null = null
  private supabase: any
  private initialized = false
  
  private constructor() {
    // Use the shared supabase instance
    this.supabase = getSupabaseClient()
    this.initializeAuth()
  }

  private async initializeAuth() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      // Get initial session
      const { data: { session }, error } = await this.supabase.auth.getSession()
      if (error) {
        console.error('[AuthService] Error getting initial session:', error)
        return
      }
      
      this.currentSession = session
      this.currentUser = session?.user ?? null
      
      if (this.currentUser) {
        try {
          await ensureUserProfile(this.currentUser.id)
        } catch (profileError) {
          console.error('[AuthService] Error ensuring user profile:', profileError)
          // Continue without the profile - it will be created when needed
        }
      }

      // Set up auth state change listener
      this.supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[AuthService] Auth state changed:', event)
        this.currentSession = session
        this.currentUser = session?.user ?? null
        
        if (event === 'SIGNED_IN' && this.currentUser) {
          try {
            await ensureUserProfile(this.currentUser.id)
          } catch (profileError) {
            console.error('[AuthService] Error ensuring user profile after sign in:', profileError)
            // Continue without the profile - it will be created when needed
          }
        }
      })
    } catch (error) {
      console.error('[AuthService] Error initializing auth:', error)
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  public async getSession(): Promise<Session | null> {
    try {
      if (!this.currentSession) {
        const { data: { session }, error } = await this.supabase.auth.getSession()
        if (error) {
          console.error('[AuthService] Error getting session:', error)
          return null
        }
        this.currentSession = session
      }
      return this.currentSession
    } catch (error) {
      console.error('[AuthService] Error in getSession:', error)
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

      // Try to ensure the profile exists
      try {
        await ensureUserProfile(userId)
      } catch (profileError) {
        console.error('[AuthService] Error ensuring user profile:', profileError)
        // Continue with manual profile creation
      }
      
      // Get the created profile
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('[AuthService] Error fetching profile:', fetchError)
        return null
      }

      return profile
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

  public async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser
    }

    const session = await this.getSession()
    return session?.user ?? null
  }

  public async login(email: string, password: string) {
    try {
      console.log('[AuthService] Attempting login for:', email)
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('[AuthService] Login error:', error)
        
        // Check for specific error types
        if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error(
            'Unable to connect to the authentication service. This might be because:\n' +
            '1. The service is temporarily unavailable\n' +
            '2. The project is paused due to inactivity\n' +
            '3. There are network connectivity issues\n\n' +
            'Please try again later or contact support if the issue persists.'
          )
        }
        
        throw error
      }

      if (!data?.user) {
        throw new Error('No user data returned from login attempt')
      }

      console.log('[AuthService] Login successful for:', email)
      return data
    } catch (error: any) {
      console.error('[AuthService] Login failed:', error)
      throw error
    }
  }

  public async signOut(): Promise<void> {
    try {
      await this.supabase.auth.signOut()
      this.currentSession = null
      this.currentUser = null
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  async signup(email: string, password: string, userData?: { 
    full_name?: string
    phone?: string
    user_role?: UserRole 
  }) {
    try {
      console.log('[AuthService] Signing up with email:', email)
      
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('[AuthService] Signup error:', error)
        return { error }
      }
      
      if (!data.user) {
        console.error('[AuthService] No user returned from signup')
        return { error: new Error('No user returned from signup') }
      }
      
      console.log('[AuthService] User signed up:', data.user.id)
      
      // Create profile if needed
      if (data.user.id) {
        try {
          const profile = await this.createProfile(
            data.user.id, 
            email
          )
          
          // If profile creation was successful and we have userData, update it
          if (profile && userData) {
            const { error: updateError } = await this.updateProfile(data.user.id, userData)
            if (updateError) {
              console.error('[AuthService] Error updating profile after signup:', updateError)
            }
          }
        } catch (error) {
          console.error('[AuthService] Error creating profile after signup:', error)
        }
      }
      
      return { 
        user: data.user, 
        session: data.session,
        error: null 
      }
    } catch (error) {
      console.error('[AuthService] Unexpected signup error:', error)
      return { error: error as Error, user: null, session: null }
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('[AuthService] Attempting logout')
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        console.log('[AuthService] No active session found, clearing local state')
        return
      }

      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
      
      console.log('[AuthService] Logout successful')
      localStorage.removeItem('debug_session')
      window.location.href = '/'
    } catch (error) {
      console.error('[AuthService] Logout error:', error)
      // Don't throw the error, just log it
    }
  }

  async updateProfile(userId: string, data: Partial<Profile>) {
    try {
      console.log('[AuthService] Updating profile for user:', userId)
      
      const { error } = await this.supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (error) {
        console.error('[AuthService] Error updating profile:', error)
        return { error }
      }
      
      console.log('[AuthService] Profile updated successfully')
      return { error: null }
    } catch (error) {
      console.error('[AuthService] Exception updating profile:', error)
      return { error: error as Error }
    }
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = AuthService.getInstance() 