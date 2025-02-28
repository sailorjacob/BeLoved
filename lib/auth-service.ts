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
  private sessionPromise: Promise<AuthUser> | null = null
  
  private constructor() {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthService] Auth state change event:', event)
      // Clear session promise on any auth state change
      this.sessionPromise = null
    })
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      console.log('[AuthService] Session check:', session ? 'Found' : 'Not found')
      return session
    } catch (error) {
      console.error('[AuthService] Error getting session:', error)
      return null
    }
  }

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      console.log('[AuthService] Got profile:', profile)
      return profile
    } catch (error) {
      console.error('[AuthService] Error getting profile:', error)
      return null
    }
  }

  async getCurrentUser(): Promise<AuthUser> {
    // If there's a promise in flight, wait for it
    if (this.sessionPromise) {
      return this.sessionPromise
    }

    this.sessionPromise = (async () => {
      try {
        const session = await this.getSession()
        
        if (!session?.user) {
          return {
            user: null,
            session: null,
            profile: null,
            isLoggedIn: false,
            role: null
          }
        }

        const profile = await this.getProfile(session.user.id)
        
        return {
          user: session.user,
          session,
          profile,
          isLoggedIn: true,
          role: (profile?.user_type as UserRole) || null
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
    })()

    return this.sessionPromise
  }

  getRedirectPath(role: UserRole | null): string {
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

  async login(email: string, password: string) {
    try {
      console.log('[AuthService] Attempting login for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      
      console.log('[AuthService] Login successful:', data)
      return data
    } catch (error) {
      console.error('[AuthService] Login error:', error)
      throw error
    }
  }

  async signup(email: string, password: string, userData?: { 
    full_name?: string
    phone?: string
    user_type?: UserRole 
  }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: userData,
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
          user_type: userData?.user_type || 'member'
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
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('[AuthService] Logout error:', error)
      throw error
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