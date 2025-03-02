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

const validateEmail = (email: string): string | undefined => {
  if (!email) return 'Email is required'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Invalid email format'
  return undefined
}

const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  return undefined
}

const validateName = (name: string): string | undefined => {
  if (!name) return 'Name is required'
  return undefined
}

const validatePhone = (phone: string): string | undefined => {
  if (!phone) return 'Phone number is required'
  return undefined
}

console.log('Login form component loaded')

export function LoginForm() {
  const auth = useAuth()
  const router = useRouter()
  const mountedRef = useRef(true)
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginEmailError, setLoginEmailError] = useState<string | undefined>(undefined)
  const [loginPasswordError, setLoginPasswordError] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupFullName, setSignupFullName] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupEmailError, setSignupEmailError] = useState<string | undefined>(undefined)
  const [signupPasswordError, setSignupPasswordError] = useState<string | undefined>(undefined)
  const [signupConfirmPasswordError, setSignupConfirmPasswordError] = useState<string | undefined>(undefined)
  const [signupFullNameError, setSignupFullNameError] = useState<string | undefined>(undefined)
  const [signupPhoneError, setSignupPhoneError] = useState<string | undefined>(undefined)
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
  
  // Enhanced redirection logic
  useEffect(() => {
    if (!mountedRef.current) return
    
    const handleRedirect = () => {
      // Only attempt redirection if we have a pending redirect and the user is logged in
      if (pendingRedirect && auth.isLoggedIn && auth.role) {
        console.log('[LoginForm] Redirect triggered with:', { 
          pendingRedirect, 
          isLoggedIn: auth.isLoggedIn, 
          role: auth.role 
        })
        
        try {
          console.log('[LoginForm] Attempting router.push redirection')
          router.push(pendingRedirect)
          
          // Also use direct navigation as a backup
          setTimeout(() => {
            if (mountedRef.current) {
              console.log('[LoginForm] Router push may have failed, using window.location.href')
              window.location.href = pendingRedirect!
            }
          }, 500)
          
          // Final fallback - force navigation after a short delay
          setTimeout(() => {
            if (mountedRef.current) {
              console.log('[LoginForm] Forcing redirect via window.location.replace')
              window.location.replace(pendingRedirect!)
            }
          }, 1000)
        } catch (error) {
          console.error('[LoginForm] Redirection error:', error)
          
          // Last resort 
          if (mountedRef.current) {
            window.location.replace(pendingRedirect)
          }
        }
      }
    }
    
    handleRedirect()
  }, [pendingRedirect, auth.isLoggedIn, auth.role, router])
  
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
    const confirmPasswordError = signupPassword !== signupConfirmPassword 
      ? 'Passwords do not match' 
      : undefined
    const nameError = validateName(signupFullName)
    const phoneError = validatePhone(signupPhone)
    
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
      setIsLoading(true)
      
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
      console.log('[LoginForm] Login successful, setting redirection to:', dashboardUrl)
      setSubmitSuccess('Login successful! Redirecting...')
      
      // Force the redirection
      setPendingRedirect(dashboardUrl)
      
      // Immediate direct attempt as a fallback
      try {
        window.location.href = dashboardUrl
      } catch (redirectError) {
        console.error('[LoginForm] Immediate redirect failed:', redirectError)
      }
      
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
      
      setIsLoading(false)
    }
  }
  
  // Signup submit handler
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
      setIsLoading(true)
      
      const { error, data } = await auth.signUp(signupEmail, signupPassword, {
        full_name: signupFullName,
        phone: signupPhone
      })
      
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      if (error) throw error
      
      // Success! Show message and redirect
      setSubmitSuccess('Account created successfully! Please login.')
      
      // Reset form
      setSignupEmail('')
      setSignupPassword('')
      setSignupConfirmPassword('')
      setSignupFullName('')
      setSignupPhone('')
      
    } catch (error) {
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      console.error('[LoginForm] Signup error:', error)
      setSubmitError(error instanceof Error ? error.message : 'An error occurred during signup')
    } finally {
      // Stop if component unmounted
      if (!mountedRef.current) return
      
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <FormContainer 
            title="Login to your account"
            onSubmit={handleLoginSubmit}
            isSubmitting={isLoading}
            submitError={submitError}
            submitSuccess={submitSuccess}
            submitButtonText={isLoading ? "Logging in..." : "Log in"}
          >
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
          </FormContainer>
        </TabsContent>
        
        <TabsContent value="signup">
          <FormContainer 
            title="Create an account"
            onSubmit={handleSignupSubmit}
            isSubmitting={isLoading}
            submitError={submitError}
            submitSuccess={submitSuccess}
            submitButtonText={isLoading ? "Creating Account..." : "Sign Up"}
          >
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
              label="Phone Number"
              type="tel"
              value={signupPhone}
              onChange={(e) => setSignupPhone(e.target.value)}
              error={signupPhoneError}
              required
            />
          </FormContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
}

