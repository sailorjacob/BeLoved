'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '../contexts/auth-context'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { CarFront, Calendar, Clock, MapPin } from "lucide-react"

export function ProfileForm() {
  const { user, profile, isDriver } = useAuth()
  const [name, setName] = useState(profile?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [driverStats, setDriverStats] = useState({
    completed_rides: 0,
    total_miles: 0,
    status: 'inactive' as 'active' | 'inactive' | 'on_break',
    last_completed_ride: null as string | null,
    average_miles_per_ride: 0,
    rides_this_month: 0
  })
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (profile) {
      setName(profile.full_name)
      setPhone(profile.phone)
    }
    if (user) {
      setEmail(user.email || '')
    }
    
    // Fetch driver stats if user is a driver
    if (isDriver && user) {
      fetchDriverStats()
    }
  }, [profile, user, isDriver])

  const fetchDriverStats = async () => {
    if (!user) return
    setIsLoadingStats(true)

    try {
      // Fetch basic driver profile stats
      const { data: profileData, error: profileError } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      // Fetch additional ride statistics
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('scheduled_pickup_time, start_miles, end_miles')
        .eq('driver_id', user.id)
        .order('scheduled_pickup_time', { ascending: false })

      if (ridesError) throw ridesError

      // Calculate additional statistics
      const thisMonth = new Date().getMonth()
      const ridesThisMonth = ridesData.filter(ride => 
        new Date(ride.scheduled_pickup_time).getMonth() === thisMonth
      ).length

      const completedRidesWithMiles = ridesData.filter(ride => 
        ride.start_miles != null && ride.end_miles != null
      )

      const averageMiles = completedRidesWithMiles.length > 0
        ? completedRidesWithMiles.reduce((acc, ride) => 
            acc + ((ride.end_miles || 0) - (ride.start_miles || 0)), 0
          ) / completedRidesWithMiles.length
        : 0

      setDriverStats({
        completed_rides: profileData.completed_rides,
        total_miles: profileData.total_miles,
        status: profileData.status,
        last_completed_ride: ridesData[0]?.scheduled_pickup_time || null,
        average_miles_per_ride: Math.round(averageMiles * 10) / 10,
        rides_this_month: ridesThisMonth
      })
    } catch (err) {
      console.error('Error fetching driver stats:', err)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        })

        if (emailError) {
          throw emailError
        }
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating your profile')
    } finally {
      setIsSubmitting(false)
    }
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
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>Profile updated successfully!</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isDriver && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Driver Status</CardTitle>
                <Badge variant={
                  driverStats.status === 'active' ? "default" :
                  driverStats.status === 'on_break' ? "secondary" : "outline"
                }>
                  {driverStats.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CarFront className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{driverStats.completed_rides}</p>
                        <p className="text-sm text-muted-foreground">Total Rides Completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{driverStats.total_miles}</p>
                        <p className="text-sm text-muted-foreground">Total Miles Driven</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{driverStats.rides_this_month}</p>
                        <p className="text-sm text-muted-foreground">Rides This Month</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{driverStats.average_miles_per_ride}</p>
                        <p className="text-sm text-muted-foreground">Average Miles Per Ride</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Completed Ride</p>
                    <p className="text-lg font-medium">
                      {driverStats.last_completed_ride 
                        ? format(new Date(driverStats.last_completed_ride), 'PPP p')
                        : 'No completed rides yet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className="text-lg font-medium">
                      {driverStats.completed_rides > 0
                        ? `Averaging ${driverStats.average_miles_per_ride} miles per ride`
                        : 'Start completing rides to see performance metrics'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

