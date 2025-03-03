"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { useAuth } from '@/app/contexts/auth-context'
import { supabase } from '@/lib/supabase'

interface DriverLoginFormData {
  email: string
  password: string
}

const initialValues: DriverLoginFormData = {
  email: '',
  password: ''
}

const validationRules = {
  email: (value: string) => {
    if (!value) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
    return undefined
  },
  password: (value: string) => {
    if (!value) return 'Password is required'
    return undefined
  }
}

export function DriverLoginForm() {
  const router = useRouter()
  const { login } = useAuth()

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
    onSubmit: async (values) => {
      const { error } = await login(values.email, values.password)
      if (error) throw error

      // After successful login, verify the user is actually a driver
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (profileError) throw profileError

      if (profile.user_type !== 'driver') {
        throw new Error('This login is for drivers only. Please use the regular login page.')
      }

      router.push('/driver-dashboard')
    }
  })

  return (
    <div className="w-full max-w-md mx-auto">
      <FormContainer
        title="Driver Login"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitButtonText="Login"
      >
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
          id="password"
          label="Password"
          type="password"
          value={values.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          required
        />
      </FormContainer>

      <div className="mt-4 text-center">
        <button 
          onClick={() => router.push('/login')}
          className="text-sm text-blue-600 hover:underline"
        >
          Member Login
        </button>
      </div>
    </div>
  )
}

