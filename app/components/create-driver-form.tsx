"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Driver {
  id: number
  name: string
  username: string
  password: string
  email: string
  phone: string
  status: "Active" | "Inactive"
}

export function CreateDriverForm() {
  const [driver, setDriver] = useState<Driver>({
    id: Date.now(),
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    status: "Active",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const drivers = JSON.parse(localStorage.getItem("drivers") || "[]")
    drivers.push(driver)
    localStorage.setItem("drivers", JSON.stringify(drivers))
    console.log("New driver added:", driver)
    // Redirect to admin dashboard or show success message
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Driver</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={driver.name}
              onChange={(e) => setDriver({ ...driver, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={driver.username}
              onChange={(e) => setDriver({ ...driver, username: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={driver.password}
              onChange={(e) => setDriver({ ...driver, password: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={driver.email}
              onChange={(e) => setDriver({ ...driver, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={driver.phone}
              onChange={(e) => setDriver({ ...driver, phone: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <Button type="submit">Create Driver</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

