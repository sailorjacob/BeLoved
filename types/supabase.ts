export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          user_type: 'member' | 'driver' | 'admin'
          home_address?: {
            address: string
            city: string
            state: string
            zip: string
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone: string
          user_type: 'member' | 'driver' | 'admin'
          home_address?: {
            address: string
            city: string
            state: string
            zip: string
          }
        }
        Update: Partial<{
          full_name: string
          email: string
          phone: string
          home_address: {
            address: string
            city: string
            state: string
            zip: string
          }
        }>
      }
      driver_profiles: {
        Row: {
          id: string
          license_number: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year: string
          vehicle_color: string
          vehicle_plate: string
          status: 'active' | 'inactive' | 'on_break'
          completed_rides: number
          total_miles: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          license_number: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year: string
          vehicle_color: string
          vehicle_plate: string
          status?: 'active' | 'inactive' | 'on_break'
          completed_rides?: number
          total_miles?: number
        }
        Update: Partial<{
          license_number: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year: string
          vehicle_color: string
          vehicle_plate: string
          status: 'active' | 'inactive' | 'on_break'
          completed_rides: number
          total_miles: number
        }>
      }
      rides: {
        Row: {
          id: string
          member_id: string
          driver_id?: string
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
          notes?: string
          payment_method: 'cash' | 'credit' | 'insurance'
          payment_status: 'pending' | 'completed' | 'failed'
          status: 'pending' | 'assigned' | 'started' | 'picked_up' | 'completed' | 'return_pending' | 'return_started' | 'return_picked_up' | 'return_completed'
          recurring: 'none' | 'daily' | 'weekly' | 'monthly'
          created_at: string
          updated_at: string
          provider_fee: number | null
          driver_earnings: number | null
          insurance_claim_amount: number | null
        }
        Insert: {
          member_id: string
          driver_id?: string
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
          notes?: string
          payment_method: 'cash' | 'credit' | 'insurance'
          payment_status?: 'pending' | 'completed' | 'failed'
          status?: 'pending' | 'assigned' | 'started' | 'picked_up' | 'completed' | 'return_pending' | 'return_started' | 'return_picked_up' | 'return_completed'
          recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
          provider_fee?: number | null
          driver_earnings?: number | null
          insurance_claim_amount?: number | null
        }
        Update: Partial<{
          driver_id: string
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
          notes: string
          payment_method: 'cash' | 'credit' | 'insurance'
          payment_status: 'pending' | 'completed' | 'failed'
          status: 'pending' | 'assigned' | 'started' | 'picked_up' | 'completed' | 'return_pending' | 'return_started' | 'return_picked_up' | 'return_completed'
          recurring: 'none' | 'daily' | 'weekly' | 'monthly'
          provider_fee: number | null
          driver_earnings: number | null
          insurance_claim_amount: number | null
        }>
      }
    }
  }
} 