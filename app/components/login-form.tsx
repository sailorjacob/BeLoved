"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { useAuth } from '@/app/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { authService } from '@/lib/auth-service'

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
  const auth = useAuth()
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false)
  const [hasAttemptedSignup, setHasAttemptedSignup] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const router = useRouter()
  
  // If we're already logged in or still loading, don't show the form
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (auth.isLoggedIn) {
    return null
  }

  console.log('Auth state:', {
    isLoggedIn: auth.isLoggedIn,
    hasUser: !!auth.user,
    isLoading: auth.isLoading,
    profile: auth.profile
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
      
      try {
        console.log('Attempting login with email:', values.email)
        const { error, data } = await auth.login(values.email, values.password)
        if (error) throw error

        if (!data?.user) {
          throw new Error('Login failed: No user data returned')
        }

        // Wait for auth state to update and fetch profile
        const maxAttempts = 5
        let attempts = 0
        let profile = null

        while (attempts < maxAttempts) {
          attempts++
          console.log(`[LoginForm] Attempt ${attempts} to fetch profile...`)
          
          // Get fresh profile data
          const response = await authService.getProfile(data.user.id)
          if (response?.user_type) {
            profile = response
            break
          }
          
          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        if (!profile?.user_type) {
          throw new Error('Unable to fetch user profile after multiple attempts')
        }

        console.log('[LoginForm] Profile fetched successfully:', {
          id: profile.id,
          email: data.user.email,
          user_type: profile.user_type
        })

        // Handle redirection based on role
        switch (profile.user_type) {
          case 'super_admin':
            router.replace('/super-admin-dashboard')
            break
          case 'admin':
            router.replace('/admin-dashboard')
            break
          case 'driver':
            router.replace('/driver-dashboard')
            break
          case 'member':
            router.replace('/dashboard')
            break
          default:
            throw new Error(`Invalid user type: ${profile.user_type}`)
        }

        setSubmitSuccess('Login successful!')
      } catch (error) {
        console.error('Login flow error:', error)
        setSubmitError(error instanceof Error ? error.message : 'An error occurred during login')
        await auth.logout()
        throw error
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

