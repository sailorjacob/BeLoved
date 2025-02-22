import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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