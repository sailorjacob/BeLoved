import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create the admin client with proper configuration
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'be-loved-scheduler-admin'
    }
  }
})

// Force anonymous auth on every request to ensure we're using the service role
supabaseAdmin.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    void supabaseAdmin.auth.signOut()
  }
})

// Helper function to ensure user profile exists
export const ensureUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: createError } = await supabaseAdmin
          .from('profiles')
          .insert([{ id: userId }])
        
        if (createError) throw createError
        return { id: userId }
      }
      throw error
    }

    return profile
  } catch (error) {
    console.error('Error ensuring user profile:', error)
    throw error
  }
} 