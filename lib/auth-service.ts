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
  private initialized: boolean = false
  private initPromise: Promise<void> | null = null
  
  private constructor() {
    this.initAuth()
  }

  private async initAuth() {
    if (this.initialized || this.initPromise) {
      return this.initPromise
    }

    this.initPromise = (async () => {
      try {
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[AuthService] Auth state change event:', event)
          
          if (event === 'SIGNED_OUT') {
            this.clearSession()
          } else if (event === 'TOKEN_REFRESHED') {
            this.sessionPromise = null
          }
        })

        // Initial session check
        const session = await this.recoverSession()
        if (!session) {
          this.clearSession()
        }

        this.initialized = true
      } catch (error) {
        console.error('[AuthService] Error initializing auth:', error)
        this.clearSession()
      } finally {
        this.initPromise = null
      }
    })()

    return this.initPromise
  }

  private clearSession() {
    this.sessionPromise = null
    try {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.refreshToken')
    } catch (error) {
      console.error('[AuthService] Error clearing session:', error)
    }
  }

  private async recoverSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('[AuthService] Error recovering session:', error)
        this.clearSession()
        return null
      }

      if (!session) {
        console.log('[AuthService] No session found during recovery')
        this.clearSession()
        return null
      }

      // Verify the session is still valid
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('[AuthService] Session invalid:', userError)
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error('[AuthService] Error recovering session:', error)
      this.clearSession()
      return null
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async getSession() {
    try {
      const session = await this.recoverSession()
      console.log('[AuthService] Session check:', session ? 'Found' : 'Not found')
      return session
    } catch (error) {
      console.error('[AuthService] Error getting session:', error)
      this.clearSession()
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
    // Ensure auth is initialized
    await this.initAuth()

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
        this.clearSession()
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
      // Clear any existing session before login attempt
      this.clearSession()
      
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
      this.clearSession()
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
      this.clearSession()
    } catch (error) {
      console.error('[AuthService] Logout error:', error)
      this.clearSession()
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