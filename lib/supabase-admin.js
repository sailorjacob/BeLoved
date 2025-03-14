import { createClient } from '@supabase/supabase-js'

// Get environment variables or use defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://twejikjgxkzmphocbvpt.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZWppa2pneGt6bXBob2NidnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzY3MDQ0NiwiZXhwIjoyMDIzMjQ2NDQ2fQ.TygzKc2PqrN-0VmHt12kSVgkjQdLfWYhm7A4j8MNzF8'

// Create admin client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Force anonymous auth on every request
supabaseAdmin.auth.onAuthStateChange(() => {
  const { data: { session } } = supabaseAdmin.auth.getSession()
  if (session) {
    console.log('[SupabaseAdmin] Forcing anonymous auth to ensure service role is used')
    supabaseAdmin.auth.signOut()
  }
}) 