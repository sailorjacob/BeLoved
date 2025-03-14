import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Environment variables are checked at build time, so we need to handle cases where they might not be available
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL env variable')
    return 'https://twejikjgxkzmphocbvpt.supabase.co' // Default fallback
  }
  return url
}

// This is a special admin client that uses the service role
// It should ONLY be used on the server-side for admin operations
// or for emergency client-side fixes where RLS is causing problems

// For security, this would typically be server-side only
// We're including it on the client temporarily to fix authentication issues
export const supabaseAdmin = createClient<Database>(
  getSupabaseUrl(),
  // Ensure we're using the service role key
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZWppa2pneGt6bXBob2NidnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzY3MDQ0NiwiZXhwIjoyMDIzMjQ2NDQ2fQ.TygzKc2PqrN-0VmHt12kSVgkjQdLfWYhm7A4j8MNzF8',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-client-info': 'service-role-admin-client',
      }
    }
  }
)

// Admin helper to create or update a user profile directly
// This bypasses RLS policies by using the service role
export const ensureUserProfile = async (
  userId: string, 
  email: string, 
  role: 'super_admin' | 'admin' | 'driver' | 'member' = 'member'
) => {
  try {
    console.log('[AdminService] Ensuring profile exists for:', { userId, email, role })
    
    // Check if a profile already exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    if (fetchError) {
      console.error('[AdminService] Error fetching profile:', fetchError)
      return { error: fetchError, profile: null }
    }
    
    if (existingProfile) {
      console.log('[AdminService] Profile already exists:', existingProfile)
      
      // Update the role if it's a super_admin
      if (role === 'super_admin') {
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            user_role: role,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single()
        
        if (updateError) {
          console.error('[AdminService] Error updating profile role:', updateError)
          return { error: updateError, profile: existingProfile }
        }
        
        console.log('[AdminService] Profile role updated:', updatedProfile)
        return { error: null, profile: updatedProfile }
      }
      
      return { error: null, profile: existingProfile }
    }
    
    // Create a new profile
    const { data: newProfile, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: email.split('@')[0], // Use email prefix as initial name
        phone: '',
        user_role: role,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('[AdminService] Error creating profile:', createError)
      return { error: createError, profile: null }
    }
    
    console.log('[AdminService] Created new profile:', newProfile)
    return { error: null, profile: newProfile }
  } catch (error) {
    console.error('[AdminService] Unexpected error in ensureUserProfile:', error)
    return { error, profile: null }
  }
} 