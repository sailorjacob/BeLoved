"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { useAuth } from '@/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Database } from '@/types/supabase'
import { useState } from 'react'

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

type Profile = Database['public']['Tables']['profiles']['Row']

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
    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
    return undefined
  },
  password: (value: string) => {
    if (!value) return 'Password is required'
    return undefined
  }
}

const signUpValidationRules = {
  email: (value: string) => {
    if (!value) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
    return undefined
  },
  password: (value: string) => {
    if (!value) return 'Password is required'
    return undefined
  },
  full_name: (value: string) => {
    if (!value) return 'Full name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    return undefined
  },
  phone: (value: string) => {
    if (!value) return 'Phone number is required'
    if (!/^\+?[\d\s-]{10,}$/.test(value)) return 'Invalid phone number format'
    return undefined
  },
  confirm_password: (value: string, formValues: SignUpFormData) => {
    if (!value) return 'Please confirm your password'
    if (value !== formValues.password) return 'Passwords do not match'
    return undefined
  }
}

export function LoginForm() {
  const router = useRouter()
  const auth = useAuth()
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false)
  const [hasAttemptedSignup, setHasAttemptedSignup] = useState(false)
  
  console.log('Auth context:', {
    isLoggedIn: auth.isLoggedIn,
    isLoading: auth.isLoading,
    hasUser: !!auth.user
  })

  const {
    values: loginValues,
    errors: loginErrors,
    isSubmitting: isLoggingIn,
    submitError: loginError,
    handleChange: handleLoginChange,
    handleSubmit: handleLoginSubmit,
    setSubmitError: setLoginError
  } = useFormHandling({
    initialValues: loginInitialValues,
    validationRules: loginValidationRules,
    onSubmit: async (values) => {
      setHasAttemptedLogin(true)
      console.log('Starting login attempt...')
      try {
        if (!values.email || !values.password) {
          throw new Error('Email and password are required')
        }
        
        const result = await auth.login(values.email, values.password)
        console.log('Login result:', result)
        if (result.error) {
          console.error('Login error:', result.error)
          throw result.error
        }
        console.log('Login successful, redirecting...')
        router.push('/dashboard')
      } catch (error) {
        console.error('Login error caught:', error)
        if (error instanceof Error) {
          setLoginError(error.message)
        } else {
          setLoginError('An unexpected error occurred')
        }
        throw error
      }
    }
  })

  const {
    values: signUpValues,
    errors: signUpErrors,
    isSubmitting: isSigningUp,
    submitError: signUpError,
    handleChange: handleSignUpChange,
    handleSubmit: handleSignUpSubmit,
    setSubmitError: setSignUpError
  } = useFormHandling({
    initialValues: signUpInitialValues,
    validationRules: signUpValidationRules,
    onSubmit: async (values) => {
      setHasAttemptedSignup(true)
      console.log('Starting signup attempt...')
      try {
        if (!values.email || !values.password || !values.full_name || !values.phone) {
          throw new Error('All fields are required')
        }
        
        if (values.password !== values.confirm_password) {
          throw new Error('Passwords do not match')
        }

        const result = await auth.signUp(values.email, values.password, {
          full_name: values.full_name,
          phone: values.phone,
          user_type: 'member'
        })
        console.log('Signup result:', result)
        if (result.error) {
          console.error('Signup error:', result.error)
          throw result.error
        }
        console.log('Signup successful')
        setSignUpError('Please check your email to confirm your account')
      } catch (error) {
        console.error('Signup error caught:', error)
        if (error instanceof Error) {
          setSignUpError(error.message)
        } else {
          setSignUpError('An unexpected error occurred')
        }
        throw error
      }
    }
  })

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <FormContainer
            title="Welcome Back"
            onSubmit={handleLoginSubmit}
            isSubmitting={isLoggingIn}
            submitError={loginError}
            submitButtonText="Login"
          >
            <FormInput
              id="login-email"
              label="Email"
              type="email"
              value={loginValues.email}
              onChange={(e) => handleLoginChange('email', e.target.value)}
              error={hasAttemptedLogin ? loginErrors.email : undefined}
              required
            />

            <FormInput
              id="login-password"
              label="Password"
              type="password"
              value={loginValues.password}
              onChange={(e) => handleLoginChange('password', e.target.value)}
              error={hasAttemptedLogin ? loginErrors.password : undefined}
              required
            />
          </FormContainer>
        </TabsContent>

        <TabsContent value="signup">
          <FormContainer
            title="Create Account"
            onSubmit={handleSignUpSubmit}
            isSubmitting={isSigningUp}
            submitError={signUpError}
            submitButtonText="Sign Up"
          >
            <FormInput
              id="signup-name"
              label="Full Name"
              value={signUpValues.full_name}
              onChange={(e) => handleSignUpChange('full_name', e.target.value)}
              error={hasAttemptedSignup ? signUpErrors.full_name : undefined}
              required
            />

            <FormInput
              id="signup-email"
              label="Email"
              type="email"
              value={signUpValues.email}
              onChange={(e) => handleSignUpChange('email', e.target.value)}
              error={hasAttemptedSignup ? signUpErrors.email : undefined}
              required
            />

            <FormInput
              id="signup-phone"
              label="Phone"
              type="tel"
              value={signUpValues.phone}
              onChange={(e) => handleSignUpChange('phone', e.target.value)}
              error={hasAttemptedSignup ? signUpErrors.phone : undefined}
              required
            />

            <FormInput
              id="signup-password"
              label="Password"
              type="password"
              value={signUpValues.password}
              onChange={(e) => handleSignUpChange('password', e.target.value)}
              error={hasAttemptedSignup ? signUpErrors.password : undefined}
              required
            />

            <FormInput
              id="signup-confirm-password"
              label="Confirm Password"
              type="password"
              value={signUpValues.confirm_password}
              onChange={(e) => handleSignUpChange('confirm_password', e.target.value)}
              error={hasAttemptedSignup ? signUpErrors.confirm_password : undefined}
              required
            />
          </FormContainer>
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

