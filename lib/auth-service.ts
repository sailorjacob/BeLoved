import { supabase } from './supabase'
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
      const { data, error } = await supabase.from('profiles').select('count(*)').limit(1)
      
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

      // First check if the profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (checkError) {
        console.error('[AuthService] Error checking for existing profile:', checkError)
      } else if (existingProfile) {
        console.log('[AuthService] Profile already exists:', existingProfile)
        return existingProfile as Profile
      }

      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: email.split('@')[0], // Use email prefix as initial name
          phone: '',
          user_role: userRole,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (createError) {
        console.error('[AuthService] Error creating profile:', createError)
        console.error('[AuthService] Error details:', {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint
        })
        
        // Try direct insert with service role
        console.log('[AuthService] Attempting direct insert with service role client')
        return null
      }

      console.log('[AuthService] Created new profile:', newProfile)
      return newProfile as Profile
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

      // First try to get the profile
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return data
    } catch (error) {
      console.error('[AuthService] Login error:', error)
      throw error
    }
  }

  async signup(email: string, password: string, userData?: { 
    full_name?: string
    phone?: string
    user_role?: UserRole 
  }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: {
            ...userData,
            user_role: userData?.user_role || 'member'
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
      if (!data.user) throw new Error('No user returned from sign up')

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: userData?.full_name || '',
          email: email,
          phone: userData?.phone || '',
          user_role: userData?.user_role || 'member'
        })

      if (profileError) {
        await supabase.auth.signOut()
        throw profileError
      }

      return data
    } catch (error) {
      console.error('[AuthService] Signup error:', error)
      throw error
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
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
      
      if (error) throw error
    } catch (error) {
      console.error('[AuthService] Update profile error:', error)
      throw error
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = AuthService.getInstance() 