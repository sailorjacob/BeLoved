"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/auth-context"
import Link from "next/link"
import { FormInput } from "./ui/form-input"

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  name?: string
  phone?: string
}

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const router = useRouter()
  const { login, signUp } = useAuth()

  const validateForm = (type: "login" | "signup" | "admin") => {
    const errors: FormErrors = {}
    
    if (!email) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format"
    
    if (!password) errors.password = "Password is required"
    else if (password.length < 6) errors.password = "Password must be at least 6 characters"
    
    if (type === "signup") {
      if (!confirmPassword) errors.confirmPassword = "Please confirm your password"
      else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match"
      
      if (!name) errors.name = "Name is required"
      if (!phone) errors.phone = "Phone number is required"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent, type: "login" | "signup" | "admin") => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm(type)) return

    try {
      if (type === "signup") {
        const { error: signUpError } = await signUp(email, password, {
          full_name: name,
          phone,
          user_type: 'member'
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        router.push("/")
      } else {
        const { error: loginError } = await login(email, password)
        
        if (loginError) {
          setError(loginError.message)
          return
        }

        if (type === "admin") {
          router.push("/admin")
        } else {
          router.push("/")
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    }
  }

  return (
    <>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>BeLoved Scheduler</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={(e) => handleSubmit(e, "login")} className="space-y-4">
                <FormInput
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={formErrors.email}
                  required
                />
                
                <FormInput
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={formErrors.password}
                  required
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white">
                  Login
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={(e) => handleSubmit(e, "signup")} className="space-y-4">
                <FormInput
                  id="signup-name"
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={formErrors.name}
                  required
                />
                
                <FormInput
                  id="signup-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={formErrors.email}
                  required
                />
                
                <FormInput
                  id="signup-phone"
                  label="Phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={formErrors.phone}
                  required
                />
                
                <FormInput
                  id="signup-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={formErrors.password}
                  required
                />
                
                <FormInput
                  id="signup-confirm-password"
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={formErrors.confirmPassword}
                  required
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white">
                  Sign Up
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="admin">
              <form onSubmit={(e) => handleSubmit(e, "admin")} className="space-y-4">
                <FormInput
                  id="admin-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={formErrors.email}
                  required
                />
                
                <FormInput
                  id="admin-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={formErrors.password}
                  required
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white">
                  Admin Login
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="mt-4 text-center">
        <Link href="/driver-login" className="text-sm text-blue-600 hover:underline">
          Driver?
        </Link>
      </div>
    </>
  )
}

