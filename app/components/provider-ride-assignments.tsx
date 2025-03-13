'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { formatAddress } from "@/lib/utils"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/contexts/auth-context"

interface Driver {
  id: string
  full_name: string
  phone: string
}

interface Member {
  id: string
  full_name: string
  phone: string
  email: string
}

interface Ride {
  id: string
  member_id: string
  pickup_address: any
  dropoff_address: any
  scheduled_pickup_time: string
  notes: string
  status: string
  provider_status: string
  member?: Member
}

export function ProviderRideAssignments() {
  const [pendingAssignments, setPendingAssignments] = useState<Ride[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [providerId, setProviderId] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  
  useEffect(() => {
    fetchProviderInfo()
  }, [])
  
  useEffect(() => {
    if (providerId) {
      fetchPendingAssignments()
      fetchDrivers()
    }
  }, [providerId])
  
  const fetchProviderInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('provider_id')
        .eq('id', user?.id)
        .single()
      
      if (error) throw error
      setProviderId(data.provider_id)
    } catch (error) {
      console.error('Error fetching provider info:', error)
      toast({
        title: "Error",
        description: "Failed to load provider information",
        variant: "destructive"
      })
    }
  }
  
  const fetchPendingAssignments = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          member:member_id(id, full_name, phone, email)
        `)
        .eq('provider_id', providerId)
        .eq('provider_status', 'pending')
        .order('scheduled_pickup_time', { ascending: true })
      
      if (error) throw error
      setPendingAssignments(data || [])
    } catch (error) {
      console.error('Error fetching pending assignments:', error)
      toast({
        title: "Error",
        description: "Failed to load pending ride assignments",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('provider_id', providerId)
        .eq('user_role', 'driver')
        .eq('status', 'active')
        .order('full_name')
      
      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast({
        title: "Error",
        description: "Failed to load available drivers",
        variant: "destructive"
      })
    }
  }
  
  const handleAccept = async (rideId: string, driverId: string) => {
    try {
      const now = new Date().toISOString()
      
      const { error } = await supabase
        .from('rides')
        .update({
          provider_status: 'accepted',
          driver_id: driverId,
          assignedby_provider_admin_id: user?.id,
          updated_at: now,
          status: 'assigned' // Update the main ride status
        })
        .eq('id', rideId)
      
      if (error) throw error
      
      // Add status history entry
      await supabase
        .from('ride_status_history')
        .insert({
          ride_id: rideId,
          previous_status: 'provider_assigned',
          new_status: 'driver_assigned',
          changed_by: user?.id,
          notes: 'Ride accepted and assigned to driver by provider admin'
        })
      
      toast({
        title: "Success",
        description: "Ride accepted and assigned to driver",
      })
      
      // Refresh the list
      fetchPendingAssignments()
    } catch (error) {
      console.error('Error assigning driver:', error)
      toast({
        title: "Error",
        description: "Failed to accept ride",
        variant: "destructive"
      })
    }
  }
  
  const handleDecline = async (rideId: string, reason: string) => {
    try {
      const now = new Date().toISOString()
      
      const { error } = await supabase
        .from('rides')
        .update({
          provider_status: 'declined',
          provider_decline_reason: reason,
          updated_at: now
        })
        .eq('id', rideId)
      
      if (error) throw error
      
      // Add status history entry
      await supabase
        .from('ride_status_history')
        .insert({
          ride_id: rideId,
          previous_status: 'provider_assigned',
          new_status: 'provider_declined',
          changed_by: user?.id,
          notes: `Declined by provider: ${reason}`
        })
      
      toast({
        title: "Success",
        description: "Ride assignment declined",
      })
      
      // Refresh the list
      fetchPendingAssignments()
    } catch (error) {
      console.error('Error declining ride:', error)
      toast({
        title: "Error",
        description: "Failed to decline ride",
        variant: "destructive"
      })
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pending Ride Assignments</h2>
        <Button onClick={fetchPendingAssignments}>Refresh</Button>
      </div>
      
      {!providerId ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No provider associated with your account</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-8">Loading pending ride assignments...</div>
      ) : pendingAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No pending ride assignments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingAssignments.map(ride => (
            <Card key={ride.id}>
              <CardHeader>
                <CardTitle>New Ride Assignment</CardTitle>
                <CardDescription>
                  {format(new Date(ride.scheduled_pickup_time), 'PPP p')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Member</p>
                    <p>{ride.member?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{ride.member?.phone}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Pickup Location</p>
                    <p>{formatAddress(ride.pickup_address)}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Destination</p>
                    <p>{formatAddress(ride.dropoff_address)}</p>
                  </div>
                  {ride.notes && (
                    <div>
                      <p className="font-semibold">Special Requirements</p>
                      <p>{ride.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Decline</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Decline Ride Assignment</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for declining this ride assignment.
                      </DialogDescription>
                    </DialogHeader>
                    <form id="decline-form" onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      const reason = formData.get('reason') as string
                      handleDecline(ride.id, reason)
                    }}>
                      <div className="py-4">
                        <Label htmlFor="decline-reason">Reason for declining</Label>
                        <Textarea 
                          id="decline-reason" 
                          name="reason" 
                          placeholder="Enter reason"
                          required 
                        />
                      </div>
                    </form>
                    <DialogFooter>
                      <Button type="submit" form="decline-form">Submit</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Accept & Assign Driver</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign to Driver</DialogTitle>
                      <DialogDescription>
                        Select a driver to assign this ride to.
                      </DialogDescription>
                    </DialogHeader>
                    <form id="assign-form" onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      const driverId = formData.get('driver') as string
                      handleAccept(ride.id, driverId)
                    }}>
                      <div className="py-4">
                        <Label htmlFor="driver">Select Driver</Label>
                        <Select name="driver" required>
                          <SelectTrigger id="driver">
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.length === 0 ? (
                              <SelectItem value="" disabled>No active drivers</SelectItem>
                            ) : (
                              drivers.map(driver => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.full_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </form>
                    <DialogFooter>
                      <Button type="submit" form="assign-form">Assign</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 