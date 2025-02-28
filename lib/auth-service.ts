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
  private lastSessionCheck: number = 0
  private sessionCacheTimeout: number = 1000 // 1 second cache
  
  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async getSession() {
    try {
      const now = Date.now()
      if (this.sessionPromise && (now - this.lastSessionCheck) < this.sessionCacheTimeout) {
        console.log('[AuthService] Using cached session promise')
        return (await this.sessionPromise).session
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      console.log('[AuthService] Fresh session check:', session ? 'Found' : 'Not found')
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
    const now = Date.now()
    
    // Return cached promise if it exists and is recent
    if (this.sessionPromise && (now - this.lastSessionCheck) < this.sessionCacheTimeout) {
      console.log('[AuthService] Using cached auth user')
      return this.sessionPromise
    }

    this.lastSessionCheck = now
    this.sessionPromise = (async () => {
      try {
        const session = await this.getSession()
        console.log('[AuthService] Session:', session)
        
        if (!session?.user) {
          console.log('[AuthService] No session user')
          return {
            user: null,
            session: null,
            profile: null,
            isLoggedIn: false,
            role: null
          }
        }

        const profile = await this.getProfile(session.user.id)
        console.log('[AuthService] Profile:', profile)
        
        const authUser = {
          user: session.user,
          session,
          profile,
          isLoggedIn: true,
          role: (profile?.user_type as UserRole) || null
        }
        
        console.log('[AuthService] Returning auth user:', authUser)
        return authUser
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