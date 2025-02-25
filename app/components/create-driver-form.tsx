"use client"

import { useRouter } from 'next/navigation'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { supabase } from '@/lib/supabase'

interface DriverFormData {
  full_name: string
  email: string
  phone: string
}

const initialValues: DriverFormData = {
  full_name: '',
  email: '',
  phone: ''
}

const validationRules = {
  full_name: (value: string) => {
    if (!value) return 'Name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    return undefined
  },
  email: (value: string) => {
    if (!value) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
    return undefined
  },
  phone: (value: string) => {
    if (!value) return 'Phone number is required'
    if (!/^\+?[\d\s-]{10,}$/.test(value)) return 'Invalid phone number format'
    return undefined
  }
}

export function CreateDriverForm() {
  const router = useRouter()

  const handleCreateDriver = async (values: DriverFormData) => {
    // Generate a random initial password for the driver
    const tempPassword = Math.random().toString(36).slice(-8)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: tempPassword,
      options: {
        data: {
          full_name: values.full_name,
          user_type: 'driver'
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create driver account')

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        user_type: 'driver'
      })

    if (profileError) throw profileError

    // Create driver profile with initial stats
    const { error: driverProfileError } = await supabase
      .from('driver_profiles')
      .insert({
        id: authData.user.id,
        status: 'inactive',
        completed_rides: 0,
        total_miles: 0
      })

    if (driverProfileError) throw driverProfileError

    // Redirect to driver list
    router.push('/driver-list')
  }

  const {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleSubmit
  } = useFormHandling({
    initialValues,
    validationRules,
    onSubmit: handleCreateDriver
  })

  return (
    <FormContainer
      title="Create New Driver"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
      submitButtonText="Create Driver"
    >
      <FormInput
        id="full_name"
        label="Full Name"
        value={values.full_name}
        onChange={(e) => handleChange('full_name', e.target.value)}
        error={errors.full_name}
        required
      />
      
      <FormInput
        id="email"
        label="Email"
        type="email"
        value={values.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        required
      />
      
      <FormInput
        id="phone"
        label="Phone"
        type="tel"
        value={values.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        error={errors.phone}
        required
      />
    </FormContainer>
  )
}

