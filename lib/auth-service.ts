import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export type UserRole = 'member' | 'driver' | 'admin' | 'super_admin'

export interface AuthUser {
  user: User | null
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

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return profile
  }

  async getCurrentUser(): Promise<AuthUser> {
    const session = await this.getSession()
    
    if (!session?.user) {
      return {
        user: null,
        profile: null,
        isLoggedIn: false,
        role: null
      }
    }

    const profile = await this.getProfile(session.user.id)
    
    return {
      user: session.user,
      profile,
      isLoggedIn: true,
      role: (profile?.user_type as UserRole) || null
    }
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  async signup(email: string, password: string, userData?: { 
    full_name?: string
    phone?: string
    user_type?: UserRole 
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData }
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
  }

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async updateProfile(userId: string, data: Partial<Profile>) {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
    
    if (error) throw error
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = AuthService.getInstance() 