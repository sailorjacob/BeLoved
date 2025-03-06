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
  
  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('[AuthService] Error getting session:', error)
      return null
    }
  }

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('[AuthService] Fetching profile for user:', userId)

      // Try to get the profile directly
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
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('[AuthService] Profile not found, attempting to create')
          
          // Get the user's email from the session
          const { data: { session } } = await supabase.auth.getSession()
          const email = session?.user?.email

          if (!email) {
            console.error('[AuthService] No email found in session')
            return null
          }

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email,
              full_name: '',
              user_role: 'member'
            })
            .select()
            .single()

          if (createError) {
            console.error('[AuthService] Error creating profile:', createError)
            return null
          }

          console.log('[AuthService] Created new profile:', newProfile)
          return newProfile as Profile
        }
        
        return null
      }

      if (!profile) {
        console.error('[AuthService] No profile found')
        return null
      }

      console.log('[AuthService] Profile found:', profile)
      return profile as Profile
    } catch (error) {
      console.error('[AuthService] Error getting profile:', error)
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

      console.log('[AuthService] Session found:', {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      })

      const profile = await this.getProfile(session.user.id)
      
      if (!profile) {
        console.error('[AuthService] No profile found for user:', session.user.id)
        return {
          user: session.user,
          session,
          profile: null,
          isLoggedIn: true,
          role: null
        }
      }

      console.log('[AuthService] Profile found:', {
        id: profile.id,
        email: profile.email,
        role: profile.user_role
      })

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
      console.error('[AuthService] Error getting current user:', error)
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