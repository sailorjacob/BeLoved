import { supabase } from '@/lib/supabase'

async function createSuperAdmin() {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: 'c8ef80bc-c7de-4ba8-a473-bb859b2efd9b',
      email: 'x2sides@gmail.com',
      user_type: 'super_admin',
      full_name: 'Super Admin',
      phone: ''
    })
    .select()

  if (error) {
    console.error('Error creating super admin:', error)
    return
  }

  console.log('Super admin created successfully:', data)
}

createSuperAdmin() 