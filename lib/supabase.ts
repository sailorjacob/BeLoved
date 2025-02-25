import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-environment': process.env.NEXT_PUBLIC_ENV || 'development'
    }
  }
})

// Helper to get environment-specific redirect URLs
export const getRedirectUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}${path}`
}

// Helper to handle Supabase errors consistently
export const handleSupabaseError = (error: any): never => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Supabase Error:', error)
  }
  
  // Convert Supabase errors to user-friendly messages
  const message = error?.message || 'An unexpected error occurred'
  throw new Error(message)
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          status?: 'active' | 'inactive' | 'on_break'
          completed_rides?: number
          total_miles?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          status?: 'active' | 'inactive' | 'on_break'
          completed_rides?: number
          total_miles?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 