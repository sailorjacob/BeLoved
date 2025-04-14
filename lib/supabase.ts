import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database as SupabaseDatabase } from '@/types/supabase'

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Ensure the URL is properly formatted
const formattedUrl = supabaseUrl.startsWith('https://') ? supabaseUrl : `https://${supabaseUrl}`

// Create a single supabase client for interacting with your database
let supabaseInstance: SupabaseClient<SupabaseDatabase, 'public'> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    console.log('[Supabase] Creating new client instance with URL:', formattedUrl)
    supabaseInstance = createClient<SupabaseDatabase, 'public'>(
      formattedUrl,
      supabaseAnonKey as string,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: isBrowser ? window.localStorage : undefined,
          flowType: 'pkce',
          debug: process.env.NEXT_PUBLIC_ENV === 'development'
        },
        global: {
          headers: {
            'X-Client-Info': 'be-loved-scheduler'
          }
        },
        db: {
          schema: 'public'
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    )
  }
  return supabaseInstance
}

// Export the singleton instance
export const supabase = getSupabaseClient()

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('[Supabase] Error:', error)
  
  // Check for specific error types
  if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
    console.error('[Supabase] Connection error detected')
    console.error('[Supabase] URL:', formattedUrl)
    
    if (error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
      console.error('[Supabase] The project URL could not be resolved. This usually means:')
      console.error('1. The Supabase project is paused due to inactivity')
      console.error('2. The project URL is incorrect')
      console.error('3. There are DNS resolution issues')
      console.error('\nTo resolve this:')
      console.error('1. Check if your Supabase project is active in the dashboard')
      console.error('2. Verify the project URL in your environment variables')
      console.error('3. If the project was paused, reactivate it in the Supabase dashboard')
    } else {
      console.error('[Supabase] Network error - please check your connection and try again')
    }
  }
  
  throw error
}

// Helper function to get the redirect URL
export function getRedirectUrl() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
  return window.location.origin
}

// Types for our database tables
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string
          user_type: 'member' | 'driver' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone: string
          user_type: 'member' | 'driver' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          user_type?: 'member' | 'driver' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      rides: {
        Row: {
          id: string
          member_id: string
          driver_id: string | null
          pickup_address: {
            address: string
            city: string
            state: string
            zip: string
          }
          dropoff_address: {
            address: string
            city: string
            state: string
            zip: string
          }
          scheduled_pickup_time: string
          status: 'pending' | 'assigned' | 'started' | 'picked_up' | 'completed' | 'return_pending' | 'return_started' | 'return_picked_up' | 'return_completed'
          start_miles: number | null
          end_miles: number | null
          start_time: string | null
          end_time: string | null
          notes: string | null
          payment_method: string
          payment_status: 'pending' | 'paid'
          recurring: 'none' | 'daily' | 'weekly' | 'monthly'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          driver_id?: string | null
          pickup_address: {
            address: string
            city: string
            state: string
            zip: string
          }
          dropoff_address: {
            address: string
            city: string
            state: string
            zip: string
          }
          scheduled_pickup_time: string
          status?: 'pending' | 'assigned' | 'started' | 'picked_up' | 'completed' | 'return_pending' | 'return_started' | 'return_picked_up' | 'return_completed'
          start_miles?: number | null
          end_miles?: number | null
          start_time?: string | null
          end_time?: string | null
          notes?: string | null
          payment_method: string
          payment_status?: 'pending' | 'paid'
          recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          driver_id?: string | null
          pickup_address?: {
            address: string
            city: string
            state: string
            zip: string
          }
          dropoff_address?: {
            address: string
            city: string
            state: string
            zip: string
          }
          scheduled_pickup_time?: string
          status?: 'pending' | 'assigned' | 'started' | 'picked_up' | 'completed' | 'return_pending' | 'return_started' | 'return_picked_up' | 'return_completed'
          start_miles?: number | null
          end_miles?: number | null
          start_time?: string | null
          end_time?: string | null
          notes?: string | null
          payment_method?: string
          payment_status?: 'pending' | 'paid'
          recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
          created_at?: string
          updated_at?: string
        }
      }
      driver_profiles: {
        Row: {
          id: string
          status: 'active' | 'inactive' | 'on_break'
          completed_rides: number
          total_miles: number
          total_stars: number
          weekly_stars_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          status?: 'active' | 'inactive' | 'on_break'
          completed_rides?: number
          total_miles?: number
          total_stars?: number
          weekly_stars_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          status?: 'active' | 'inactive' | 'on_break'
          completed_rides?: number
          total_miles?: number
          total_stars?: number
          weekly_stars_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 