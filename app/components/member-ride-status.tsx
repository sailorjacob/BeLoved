'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { formatAddress } from "@/lib/utils"
import { format, compareAsc, isPast } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Provider {
  id: string
  name: string
}

interface Driver {
  id: string
  full_name: string
  phone: string
}

interface Ride {
  id: string
  pickup_address: any
  dropoff_address: any
  scheduled_pickup_time: string
  notes: string
  status: string
  super_admin_status: string
  provider_status: string
  provider_id: string | null
  driver_id: string | null
  provider?: Provider
  driver?: Driver
}

export function MemberRideStatus() {
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  useEffect(() => {
    fetchRides()
  }, [])
  
  const fetchRides = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          provider:provider_id(id, name),
          driver:profiles!rides_driver_id_fkey(id, full_name, phone),
          member_profile:profiles!rides_member_id_fkey(id, full_name, phone, email)
        `)
        .eq('member_id', user?.id)
        .order('scheduled_pickup_time', { ascending: false })
      
      if (error) {
        console.error('Error fetching rides:', error)
        throw error
      }
      
      setRides(data || [])
    } catch (error) {
      console.error('Error fetching rides:', error)
      toast({
        title: "Error",
        description: "Failed to load your rides",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const getStatusDisplay = (ride: Ride) => {
    // If the ride was declined by super admin
    if (ride.super_admin_status === 'declined') {
      return {
        label: 'Request Declined',
        color: 'bg-red-200 text-red-800'
      }
    }
    
    // If the ride is still pending super admin approval
    if (ride.super_admin_status === 'pending') {
      return {
        label: 'Pending Approval',
        color: 'bg-yellow-200 text-yellow-800'
      }
    }
    
    // If the ride was declined by provider
    if (ride.provider_status === 'declined') {
      return {
        label: 'Provider Declined',
        color: 'bg-red-200 text-red-800'
      }
    }
    
    // If the ride is pending provider review
    if (ride.provider_status === 'pending') {
      return {
        label: 'Provider Reviewing',
        color: 'bg-yellow-200 text-yellow-800'
      }
    }
    
    // Once a driver is assigned
    if (ride.driver_id) {
      switch (ride.status) {
        case 'assigned':
          return {
            label: 'Driver Assigned',
            color: 'bg-blue-200 text-blue-800'
          }
        case 'started':
          return {
            label: 'Driver En Route',
            color: 'bg-blue-200 text-blue-800'
          }
        case 'picked_up':
          return {
            label: 'In Transit',
            color: 'bg-purple-200 text-purple-800'
          }
        case 'completed':
          return {
            label: 'Ride Completed',
            color: 'bg-green-200 text-green-800'
          }
        case 'in_progress':
          return {
            label: 'In Progress',
            color: 'bg-purple-200 text-purple-800'
          }
        case 'return_started':
          return {
            label: 'Return Trip Started',
            color: 'bg-blue-200 text-blue-800'
          }
        case 'return_picked_up':
          return {
            label: 'Return In Transit',
            color: 'bg-purple-200 text-purple-800'
          }
        case 'return_completed':
          return {
            label: 'Return Completed',
            color: 'bg-green-200 text-green-800'
          }
        default:
          return {
            label: ride.status ? ride.status.replace(/_/g, ' ') : 'Scheduled',
            color: 'bg-gray-200 text-gray-800'
          }
      }
    }
    
    // If provider accepted but no driver yet
    if (ride.provider_status === 'accepted') {
      return {
        label: 'Ride Confirmed',
        color: 'bg-green-200 text-green-800'
      }
    }
    
    // Default case
    return {
      label: 'Processing',
      color: 'bg-gray-200 text-gray-800'
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Rides</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRides}>
            Refresh
          </Button>
          <Button asChild>
            <Link href="/member-dashboard/schedule-ride">
              Schedule New Ride
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Rides</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="text-center py-8">Loading rides...</div>
          ) : rides.filter(ride => 
            !isPast(new Date(ride.scheduled_pickup_time)) || 
            ['started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up'].includes(ride.status)
          ).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No upcoming rides</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/member-dashboard/schedule-ride">
                    Schedule a Ride
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rides
                .filter(ride => 
                  !isPast(new Date(ride.scheduled_pickup_time)) || 
                  ['started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up'].includes(ride.status)
                )
                .map(ride => {
                  const status = getStatusDisplay(ride)
                  
                  return (
                    <Card key={ride.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {format(new Date(ride.scheduled_pickup_time), 'EEEE, MMMM d')}
                            </CardTitle>
                            <CardDescription>
                              {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
                            </CardDescription>
                          </div>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">Pickup</p>
                            <p>{formatAddress(ride.pickup_address)}</p>
                          </div>
                          <div>
                            <p className="font-medium">Destination</p>
                            <p>{formatAddress(ride.dropoff_address)}</p>
                          </div>
                          
                          {ride.provider && (
                            <div>
                              <p className="font-medium">Transportation Provider</p>
                              <p>{ride.provider.name}</p>
                            </div>
                          )}
                          
                          {ride.driver && (
                            <div>
                              <p className="font-medium">Driver</p>
                              <p>{ride.driver.full_name} • {ride.driver.phone}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => router.push(`/member-dashboard/rides/${ride.id}`)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-4">
          {isLoading ? (
            <div className="text-center py-8">Loading rides...</div>
          ) : rides.filter(ride => 
            isPast(new Date(ride.scheduled_pickup_time)) && 
            !['started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up'].includes(ride.status)
          ).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No past rides</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rides
                .filter(ride => 
                  isPast(new Date(ride.scheduled_pickup_time)) && 
                  !['started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up'].includes(ride.status)
                )
                .map(ride => {
                  const status = getStatusDisplay(ride)
                  
                  return (
                    <Card key={ride.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {format(new Date(ride.scheduled_pickup_time), 'EEEE, MMMM d')}
                            </CardTitle>
                            <CardDescription>
                              {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
                            </CardDescription>
                          </div>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">Pickup</p>
                            <p>{formatAddress(ride.pickup_address)}</p>
                          </div>
                          <div>
                            <p className="font-medium">Destination</p>
                            <p>{formatAddress(ride.dropoff_address)}</p>
                          </div>
                          
                          {ride.provider && (
                            <div>
                              <p className="font-medium">Transportation Provider</p>
                              <p>{ride.provider.name}</p>
                            </div>
                          )}
                          
                          {ride.driver && (
                            <div>
                              <p className="font-medium">Driver</p>
                              <p>{ride.driver.full_name} • {ride.driver.phone}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => router.push(`/member-dashboard/rides/${ride.id}`)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 