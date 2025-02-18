"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/auth-context"
import Link from "next/link"

export function DriverLoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const success = await login(username, password)
    if (success) {
      router.push("/driver-dashboard")
    } else {
      setError("Invalid username or password")
    }
  }

  return (
    <>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Driver Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full mt-4">
              Login
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Rider?
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

