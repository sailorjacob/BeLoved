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
      transportation_providers: {
        Row: {
          id: string
          name: string
          organization_code: string
          address: string
          city: string
          state: string
          zip: string
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          organization_code: string
          address: string
          city: string
          state: string
          zip: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<{
          name: string
          organization_code: string
          address: string
          city: string
          state: string
          zip: string
          status: 'active' | 'inactive'
        }>
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          user_role: 'super_admin' | 'admin' | 'driver' | 'member'
          provider_id?: string
          status?: 'active' | 'inactive'
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
          user_role?: 'super_admin' | 'admin' | 'driver' | 'member'
          provider_id?: string
          status?: 'active' | 'inactive'
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
          user_role: 'super_admin' | 'admin' | 'driver' | 'member'
          provider_id: string
          status: 'active' | 'inactive'
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
          provider_id?: string
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
          provider_id?: string
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
          provider_id: string
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
      support_tickets: {
        Row: {
          id: string
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          provider_id?: string
          created_by: string
          assigned_to?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          provider_id?: string
          created_by: string
          assigned_to?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<{
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          provider_id: string
          assigned_to: string
        }>
      }
      ticket_comments: {
        Row: {
          id: string
          ticket_id: string
          content: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          content: string
          created_by: string
          created_at?: string
        }
        Update: Partial<{
          content: string
        }>
      }
      ticket_attachments: {
        Row: {
          id: string
          ticket_id: string
          file_name: string
          file_type: string
          file_size: number
          file_url: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          file_name: string
          file_type: string
          file_size: number
          file_url: string
          uploaded_by: string
          created_at?: string
        }
        Update: Partial<{
          file_name: string
          file_type: string
          file_size: number
          file_url: string
        }>
      }
      audit_logs: {
        Row: {
          id: string
          action: 'create' | 'update' | 'delete' | 'status_change' | 'login' | 'password_change' | 'assignment'
          entity_type: 'provider' | 'admin' | 'driver' | 'ride' | 'vehicle'
          entity_id: string
          changed_by?: string
          changes: Json
          ip_address?: string
          user_agent?: string
          created_at: string
        }
        Insert: {
          id?: string
          action: 'create' | 'update' | 'delete' | 'status_change' | 'login' | 'password_change' | 'assignment'
          entity_type: 'provider' | 'admin' | 'driver' | 'ride' | 'vehicle'
          entity_id: string
          changed_by?: string
          changes?: Json
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
        Update: Partial<{
          changes: Json
        }>
      }
    }
  }
} 