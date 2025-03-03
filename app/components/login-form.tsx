"use client"

import { useState, useEffect, useCallback } from 'react'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/app/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

export function LoginForm() {
  // Auth context
  const { login, signUp, isLoggedIn, isLoading } = useAuth()
  const { toast } = useToast()

  // Form state
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Handle form submission for login
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoggingIn(true)
      console.log(`[LoginForm] Attempting login for ${email}`)
      
      const result = await login(email, password)
      
      if (result.error) {
        console.error('[LoginForm] Login error:', result.error)
        toast({
          title: "Login Failed",
          description: result.error.message || "Please check your credentials and try again",
          variant: "destructive",
        })
      } else {
        console.log('[LoginForm] Login successful')
        toast({
          title: "Login Successful",
          description: "You are now logged in",
        })
        // Navigation will be handled by AuthContext
      }
    } catch (error) {
      console.error('[LoginForm] Unexpected error during login:', error)
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }, [email, password, login, toast])

  // Handle form submission for signup
  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !fullName) {
      toast({
        title: "Error",
        description: "Please fill out all required fields",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoggingIn(true)
      console.log(`[LoginForm] Attempting signup for ${email}`)
      
      const result = await signUp(email, password, {
        full_name: fullName,
        phone,
      })
      
      if (result.error) {
        console.error('[LoginForm] Signup error:', result.error)
        toast({
          title: "Signup Failed",
          description: result.error.message || "Please check your information and try again",
          variant: "destructive",
        })
      } else {
        console.log('[LoginForm] Signup successful')
        toast({
          title: "Account Created",
          description: "Your account has been created successfully",
        })
        // Navigation will be handled by AuthContext
      }
    } catch (error) {
      console.error('[LoginForm] Unexpected error during signup:', error)
      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred. Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }, [email, password, fullName, phone, signUp, toast])

  // If already logged in or still initializing auth, don't show the form
  if (isLoggedIn) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to BeLoved Transportation
        </h1>
        <p className="text-sm text-muted-foreground">
          Please sign in to your account or create a new one
        </p>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger 
            value="login" 
            className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
          >
            Login
          </TabsTrigger>
          <TabsTrigger 
            value="register" 
            className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
          >
            Register
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-red-500 hover:bg-red-600 text-white" 
              disabled={isLoggingIn || isLoading}
            >
              {isLoggingIn || isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="register">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-fullname">Full Name</Label>
              <Input
                id="signup-fullname"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoggingIn}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-phone">Phone (optional)</Label>
              <Input
                id="signup-phone"
                type="tel"
                placeholder="(123) 456-7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoggingIn}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-red-500 hover:bg-red-600 text-white" 
              disabled={isLoggingIn || isLoading}
            >
              {isLoggingIn || isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

