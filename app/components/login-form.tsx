"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { useAuth } from '@/app/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface LoginFormData {
  email: string
  password: string
}

interface SignUpFormData {
  email: string
  password: string
  confirm_password: string
  full_name: string
  phone: string
}

const loginInitialValues: LoginFormData = {
  email: '',
  password: ''
}

const signUpInitialValues: SignUpFormData = {
  email: '',
  password: '',
  confirm_password: '',
  full_name: '',
  phone: ''
}

const loginValidationRules = {
  email: (value: string) => {
    if (!value) return 'Email is required'
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return 'Invalid email address'
    }
  },
  password: (value: string) => {
    if (!value) return 'Password is required'
  }
}

const signUpValidationRules = {
  ...loginValidationRules,
  full_name: (value: string) => {
    if (!value) return 'Full name is required'
  },
  phone: (value: string) => {
    if (!value) return 'Phone number is required'
  },
  confirm_password: (value: string, values: SignUpFormData) => {
    if (!value) return 'Please confirm your password'
    if (value !== values.password) return 'Passwords do not match'
  }
}

console.log('Login form component loaded')

export function LoginForm() {
  const router = useRouter()
  const auth = useAuth()
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false)
  const [hasAttemptedSignup, setHasAttemptedSignup] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  
  console.log('Auth state:', {
    isLoggedIn: auth.isLoggedIn,
    hasUser: !!auth.user,
    isLoading: auth.isLoading
  })

  const { 
    values: loginValues,
    errors: loginErrors,
    isSubmitting: isLoggingIn,
    handleChange: handleLoginChange,
    handleSubmit: handleLogin
  } = useFormHandling<LoginFormData>({
    initialValues: loginInitialValues,
    validationRules: loginValidationRules,
    onSubmit: async (values) => {
      setHasAttemptedLogin(true)
      setSubmitError(null)
      setSubmitSuccess(null)
      
      const { error } = await auth.login(values.email, values.password)
      if (error) {
        throw error
      }

      // Get the user's profile to determine redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', auth.user?.id)
        .single()

      // Redirect based on user type
      switch (profile?.user_type) {
        case 'super_admin':
          router.push('/super-admin-dashboard')
          break
        case 'admin':
          router.push('/admin-dashboard')
          break
        case 'driver':
          router.push('/driver-dashboard')
          break
        default:
          router.push('/dashboard')
      }
    }
  })

  const { 
    values: signUpValues,
    errors: signUpErrors,
    isSubmitting: isSigningUp,
    handleChange: handleSignUpChange,
    handleSubmit: handleSignUp
  } = useFormHandling<SignUpFormData>({
    initialValues: signUpInitialValues,
    validationRules: signUpValidationRules,
    onSubmit: async (values) => {
      setHasAttemptedSignup(true)
      setSubmitError(null)
      setSubmitSuccess(null)

      if (values.password !== values.confirm_password) {
        throw new Error('Passwords do not match')
      }

      const { error } = await auth.signUp(
        values.email, 
        values.password,
        {
          full_name: values.full_name,
          phone: values.phone
        }
      )

      if (error) {
        throw error
      }

      setSubmitSuccess('Account created! Please check your email to confirm your account before signing in.')
    }
  })

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <div className="mx-auto max-w-sm space-y-4">
            <FormContainer
              title="Welcome Back"
              onSubmit={handleLogin}
              isSubmitting={isLoggingIn}
              submitError={submitError}
              submitSuccess={submitSuccess}
              submitButtonText="Login"
            >
              <FormInput
                id="login-email"
                label="Email"
                type="email"
                value={loginValues.email}
                onChange={(e) => handleLoginChange('email', e.target.value)}
                error={hasAttemptedLogin ? loginErrors.email : undefined}
              />
              <FormInput
                id="login-password"
                label="Password"
                type="password"
                value={loginValues.password}
                onChange={(e) => handleLoginChange('password', e.target.value)}
                error={hasAttemptedLogin ? loginErrors.password : undefined}
              />
            </FormContainer>
          </div>
        </TabsContent>

        <TabsContent value="signup">
          <div className="mx-auto max-w-sm space-y-4">
            <FormContainer
              title="Create Account"
              onSubmit={handleSignUp}
              isSubmitting={isSigningUp}
              submitError={submitError}
              submitSuccess={submitSuccess}
              submitButtonText="Sign Up"
            >
              <FormInput
                id="signup-name"
                label="Full Name"
                value={signUpValues.full_name}
                onChange={(e) => handleSignUpChange('full_name', e.target.value)}
                error={hasAttemptedSignup ? signUpErrors.full_name : undefined}
              />
              <FormInput
                id="signup-email"
                label="Email"
                type="email"
                value={signUpValues.email}
                onChange={(e) => handleSignUpChange('email', e.target.value)}
                error={hasAttemptedSignup ? signUpErrors.email : undefined}
              />
              <FormInput
                id="signup-phone"
                label="Phone"
                type="tel"
                value={signUpValues.phone}
                onChange={(e) => handleSignUpChange('phone', e.target.value)}
                error={hasAttemptedSignup ? signUpErrors.phone : undefined}
              />
              <FormInput
                id="signup-password"
                label="Password"
                type="password"
                value={signUpValues.password}
                onChange={(e) => handleSignUpChange('password', e.target.value)}
                error={hasAttemptedSignup ? signUpErrors.password : undefined}
              />
              <FormInput
                id="signup-confirm-password"
                label="Confirm Password"
                type="password"
                value={signUpValues.confirm_password}
                onChange={(e) => handleSignUpChange('confirm_password', e.target.value)}
                error={hasAttemptedSignup ? signUpErrors.confirm_password : undefined}
              />
            </FormContainer>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 text-center">
        <Link href="/driver-login" className="text-sm text-blue-600 hover:underline">
          Driver Login
        </Link>
      </div>
    </div>
  )
}

