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
  username?: string
  password?: string
  email?: string
  confirmPassword?: string
}

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const router = useRouter()
  const { login } = useAuth()

  const validateForm = (type: "login" | "signup" | "admin") => {
    const errors: FormErrors = {}
    
    if (!username) errors.username = "Username is required"
    if (!password) errors.password = "Password is required"
    
    if (type === "signup") {
      if (!email) errors.email = "Email is required"
      else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format"
      if (!confirmPassword) errors.confirmPassword = "Please confirm your password"
      else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match"
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
        // Handle signup logic here
        const newUser = {
          id: Date.now(),
          name,
          username,
          password,
          email,
          phone,
          userType: "user" as const,
        }
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        users.push(newUser)
        localStorage.setItem("users", JSON.stringify(users))
        // Log in the new user
        await login(username, password)
        router.push("/")
      } else {
        // Handle login logic here
        const success = await login(username, password)
        if (success) {
          if (type === "admin") {
            router.push("/admin")
          } else {
            router.push("/")
          }
        } else {
          setError("Invalid username or password")
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
                  id="username"
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={formErrors.username}
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
                  id="signup-username"
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={formErrors.username}
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
                  id="admin-username"
                  label="Admin Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={formErrors.username}
                  required
                />
                
                <FormInput
                  id="admin-password"
                  label="Admin Password"
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

