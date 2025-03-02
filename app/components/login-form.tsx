"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { useAuth } from '@/app/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useEffect, useRef, FormEvent } from 'react'
import { authService } from '@/lib/auth-service'
import type { UserRole } from '@/lib/auth-service'

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

const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required'
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    return 'Invalid email address'
  }
  return null
}

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required'
  return null
}

const validateName = (name: string): string | null => {
  if (!name) return 'Full name is required'
  return null
}

const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required'
  return null
}

console.log('Login form component loaded')

export function LoginForm() {
  const auth = useAuth()
  const router = useRouter()
  const mountedRef = useRef(true)
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginEmailError, setLoginEmailError] = useState<string | null>(null)
  const [loginPasswordError, setLoginPasswordError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupFullName, setSignupFullName] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupEmailError, setSignupEmailError] = useState<string | null>(null)
  const [signupPasswordError, setSignupPasswordError] = useState<string | null>(null)
  const [signupConfirmPasswordError, setSignupConfirmPasswordError] = useState<string | null>(null)
  const [signupFullNameError, setSignupFullNameError] = useState<string | null>(null)
  const [signupPhoneError, setSignupPhoneError] = useState<string | null>(null)
  const [isSigningUp, setIsSigningUp] = useState(false)
  
  // Common state
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null)
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[LoginForm] Cleaning up component')
      mountedRef.current = false
    }
  }, [])
  
  // Handle redirection after successful login
  useEffect(() => {
    // Don't try to redirect if not mounted
    if (!mountedRef.current) return

    // Function to handle redirection
    const handleRedirect = () => {
      if (pendingRedirect && auth.isLoggedIn && auth.role) {
        console.log('[LoginForm] Redirecting to:', pendingRedirect)
        try {
          // Use window.location for more reliable navigation
          window.location.href = pendingRedirect
        } catch (error) {
          console.error('[LoginForm] Redirect error:', error)
        }
      }
    }

    // Call the redirect function
    handleRedirect()
  }, [pendingRedirect, auth.isLoggedIn, auth.role])
  
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

  // Validate login form
  const validateLoginForm = (): boolean => {
    const emailError = validateEmail(loginEmail)
    const passwordError = validatePassword(loginPassword)
    
    setLoginEmailError(emailError)
    setLoginPasswordError(passwordError)
    
    return !emailError && !passwordError
  }
  
  // Validate signup form
  const validateSignupForm = (): boolean => {
    const emailError = validateEmail(signupEmail)
    const passwordError = validatePassword(signupPassword)
    const nameError = validateName(signupFullName)
    const phoneError = validatePhone(signupPhone)
    let confirmPasswordError: string | null = null
    
    if (!signupConfirmPassword) {
      confirmPasswordError = 'Please confirm your password'
    } else if (signupPassword !== signupConfirmPassword) {
      confirmPasswordError = 'Passwords do not match'
    }
    
    setSignupEmailError(emailError)
    setSignupPasswordError(passwordError)
    setSignupConfirmPasswordError(confirmPasswordError)
    setSignupFullNameError(nameError)
    setSignupPhoneError(phoneError)
    
    return !emailError && !passwordError && !confirmPasswordError && !nameError && !phoneError
  }
  
  // Handle login form submission
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setSubmitError(null)
    setSubmitSuccess(null)
    
    // Validate form
    if (!validateLoginForm()) {
      return
    }
    
    try {
      // Set loading state
      setIsLoggingIn(true)
      
      console.log('Attempting login with email:', loginEmail)
      const { error, data } = await auth.login(loginEmail, loginPassword)
      
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      if (error) throw error
      if (!data?.user) {
        throw new Error('Login failed: No user data returned')
      }
      
      // Get user profile to determine role
      const profile = await authService.getProfile(data.user.id)
      
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      if (!profile?.user_type) {
        throw new Error('Login failed: Invalid user profile')
      }
      
      // Determine redirect URL based on role
      const userRole = profile.user_type as UserRole
      let dashboardUrl = '/'
      
      switch (userRole) {
        case 'super_admin':
          dashboardUrl = '/super-admin-dashboard'
          break
        case 'admin':
          dashboardUrl = '/admin-dashboard'
          break
        case 'driver':
          dashboardUrl = '/driver-dashboard'
          break
        case 'member':
          dashboardUrl = '/dashboard'
          break
        default:
          throw new Error(`Invalid user type: ${userRole}`)
      }
      
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      // Set success message and pending redirect
      setSubmitSuccess('Login successful! Redirecting...')
      setPendingRedirect(dashboardUrl)
      
    } catch (error) {
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      console.error('[LoginForm] Login error:', error)
      setSubmitError(error instanceof Error ? error.message : 'An error occurred during login')
      
      // Try to logout (cleanup)
      try {
        await auth.logout()
      } catch (logoutError) {
        console.error('[LoginForm] Logout error:', logoutError)
      }
    } finally {
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      // Reset loading state
      setIsLoggingIn(false)
    }
  }
  
  // Handle signup form submission
  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setSubmitError(null)
    setSubmitSuccess(null)
    
    // Validate form
    if (!validateSignupForm()) {
      return
    }
    
    try {
      // Set loading state
      setIsSigningUp(true)
      
      const { error } = await auth.signUp(
        signupEmail,
        signupPassword,
        {
          full_name: signupFullName,
          phone: signupPhone
        }
      )
      
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      if (error) throw error
      
      // Set success message
      setSubmitSuccess('Account created! Please check your email to confirm your account before signing in.')
      
    } catch (error) {
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      console.error('[LoginForm] Signup error:', error)
      setSubmitError(error instanceof Error ? error.message : 'An error occurred during signup')
    } finally {
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      // Reset loading state
      setIsSigningUp(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow-sm">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-900">
        BeLoved
      </h2>

      {submitError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">{submitSuccess}</p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="login">
        <TabsList className="w-full mb-6">
          <TabsTrigger className="w-1/2" value="login">Login</TabsTrigger>
          <TabsTrigger className="w-1/2" value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <FormContainer onSubmit={handleLoginSubmit}>
            <FormInput
              id="login-email"
              label="Email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              error={loginEmailError}
              required
            />
            <FormInput
              id="login-password"
              label="Password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              error={loginPasswordError}
              required
            />
            <div className="mt-6">
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Logging in...' : 'Log in'}
              </button>
            </div>
          </FormContainer>
        </TabsContent>
        
        <TabsContent value="signup">
          <FormContainer onSubmit={handleSignupSubmit}>
            <FormInput
              id="signup-email"
              label="Email"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              error={signupEmailError}
              required
            />
            <FormInput
              id="signup-full-name"
              label="Full Name"
              type="text"
              value={signupFullName}
              onChange={(e) => setSignupFullName(e.target.value)}
              error={signupFullNameError}
              required
            />
            <FormInput
              id="signup-phone"
              label="Phone"
              type="tel"
              value={signupPhone}
              onChange={(e) => setSignupPhone(e.target.value)}
              error={signupPhoneError}
              required
            />
            <FormInput
              id="signup-password"
              label="Password"
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              error={signupPasswordError}
              required
            />
            <FormInput
              id="signup-confirm-password"
              label="Confirm Password"
              type="password"
              value={signupConfirmPassword}
              onChange={(e) => setSignupConfirmPassword(e.target.value)}
              error={signupConfirmPasswordError}
              required
            />
            <div className="mt-6">
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSigningUp}
              >
                {isSigningUp ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </FormContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
}

