'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '../contexts/auth-context'

export function ProfileForm() {
  const { isDriver } = useAuth()
  const [name, setName] = useState('John Doe')
  const [email, setEmail] = useState('john@example.com')
  const [phone, setPhone] = useState('123-456-7890')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Updating profile:', { name, email, phone })
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>View and update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Update Profile</Button>
          </form>
        </CardContent>
      </Card>

      {isDriver && (
        <Card>
          <CardHeader>
            <CardTitle>Driver Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <div>
                <p className="text-2xl font-bold">15</p>
                <p className="text-sm text-muted-foreground">Rides Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
              <div>
                <p className="text-2xl font-bold">$350</p>
                <p className="text-sm text-muted-foreground">Earnings This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

