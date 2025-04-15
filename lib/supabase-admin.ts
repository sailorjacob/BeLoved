import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Create a single supabase client for interacting with your database
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
)

// Function to ensure a user profile exists
// This function is used in auth-service.ts to create profiles for new users
export async function ensureUserProfile(userId: string) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking profile:', fetchError)
      throw fetchError
    }

    // If profile doesn't exist, create it
    if (!existingProfile) {
      const { error: createError } = await supabaseAdmin
        .from('profiles')
        .insert([{ id: userId }])

      if (createError) {
        console.error('Error creating profile:', createError)
        throw createError
      }
    }

    return true
  } catch (error) {
    console.error('Error in ensureUserProfile:', error)
    throw error
  }
} 