"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: number
  name: string
  username: string
  password: string
  email: string
  phone: string
  userType: "user" | "driver"
}

export function CreateUserForm() {
  const [user, setUser] = useState<User>({
    id: Date.now(),
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    userType: "user",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    users.push(user)
    localStorage.setItem("users", JSON.stringify(users))
    console.log("New user created:", user)
    // Redirect to admin dashboard or show success message
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={user.phone}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="userType">User Type</Label>
            <Select
              value={user.userType}
              onValueChange={(value: "user" | "driver") => setUser({ ...user, userType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-4">
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

