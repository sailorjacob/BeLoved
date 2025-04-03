import { createClient } from '@supabase/supabase-js'
import type { Database as SupabaseDatabase } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Create admin client with service role key
// This should only be used server-side for admin operations or emergency fixes
export const supabaseAdmin = createClient<SupabaseDatabase>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'be-loved-scheduler-admin',
      },
    },
  }
)

// Force anonymous auth on every request to ensure we're using the service role
supabaseAdmin.auth.onAuthStateChange(async (event) => {
  if (event === 'SIGNED_IN') {
    await supabaseAdmin.auth.signOut()
  }
})

// Helper function to ensure a user profile exists
export async function ensureUserProfile(userId: string, email: string) {
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
          .insert([
            {
              id: userId,
              email,
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])

        if (createError) {
          console.error('Error creating profile:', createError)
          return null
        }

        // Return the newly created profile
        const { data: newProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        return newProfile
      }

      console.error('Error checking profile:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('Unexpected error ensuring profile:', error)
    return null
  }
} 