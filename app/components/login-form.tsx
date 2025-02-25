"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { useAuth } from '@/hooks/useAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LoginFormData {
  email: string
  password: string
}

interface SignUpFormData extends LoginFormData {
  full_name: string
  phone: string
  confirm_password: string
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
  const { signIn, signUp } = useAuth()

  const {
    values: loginValues,
    errors: loginErrors,
    isSubmitting: isLoggingIn,
    submitError: loginError,
    handleChange: handleLoginChange,
    handleSubmit: handleLoginSubmit
  } = useFormHandling({
    initialValues: loginInitialValues,
    validationRules: loginValidationRules,
    onSubmit: async (values) => {
      const { error } = await signIn(values.email, values.password)
      if (error) throw error
      router.push('/dashboard')
    }
  })

  const {
    values: signUpValues,
    errors: signUpErrors,
    isSubmitting: isSigningUp,
    submitError: signUpError,
    handleChange: handleSignUpChange,
    handleSubmit: handleSignUpSubmit
  } = useFormHandling({
    initialValues: signUpInitialValues,
    validationRules: signUpValidationRules,
    onSubmit: async (values) => {
      const { error } = await signUp(values.email, values.password, {
        full_name: values.full_name,
        phone: values.phone,
        user_type: 'member'
      })
      if (error) throw error
      // Don't redirect - they need to confirm email first
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
              error={loginErrors.email}
              required
            />

            <FormInput
              id="login-password"
              label="Password"
              type="password"
              value={loginValues.password}
              onChange={(e) => handleLoginChange('password', e.target.value)}
              error={loginErrors.password}
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
              error={signUpErrors.full_name}
              required
            />

            <FormInput
              id="signup-email"
              label="Email"
              type="email"
              value={signUpValues.email}
              onChange={(e) => handleSignUpChange('email', e.target.value)}
              error={signUpErrors.email}
              required
            />

            <FormInput
              id="signup-phone"
              label="Phone"
              type="tel"
              value={signUpValues.phone}
              onChange={(e) => handleSignUpChange('phone', e.target.value)}
              error={signUpErrors.phone}
              required
            />

            <FormInput
              id="signup-password"
              label="Password"
              type="password"
              value={signUpValues.password}
              onChange={(e) => handleSignUpChange('password', e.target.value)}
              error={signUpErrors.password}
              required
            />

            <FormInput
              id="signup-confirm-password"
              label="Confirm Password"
              type="password"
              value={signUpValues.confirm_password}
              onChange={(e) => handleSignUpChange('confirm_password', e.target.value)}
              error={signUpErrors.confirm_password}
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

