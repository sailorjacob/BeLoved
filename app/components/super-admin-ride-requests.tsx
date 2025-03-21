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
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Provider {
  id: string
  name: string
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
  super_admin_status: string
  payment_method?: string
  recurring?: string
  member?: Member
}

export function SuperAdminRideRequests() {
  const [pendingRequests, setPendingRequests] = useState<Ride[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  useEffect(() => {
    fetchPendingRequests()
    fetchProviders()
  }, [])
  
  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          member:member_id(id, full_name, phone, email)
        `)
        .eq('super_admin_status', 'pending')
        .is('provider_id', null)
        .order('scheduled_pickup_time', { ascending: true })
      
      if (error) throw error
      setPendingRequests(data || [])
    } catch (error) {
      console.error('Error fetching pending requests:', error)
      toast({
        title: "Error",
        description: "Failed to load pending ride requests",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('transportation_providers')
        .select('id, name')
        .eq('status', 'active')
        .order('name')
      
      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error('Error fetching providers:', error)
      toast({
        title: "Error",
        description: "Failed to load transportation providers",
        variant: "destructive"
      })
    }
  }
  
  const handleAccept = async (rideId: string, providerId: string) => {
    try {
      const now = new Date().toISOString()
      
      const { error } = await supabase
        .from('rides')
        .update({
          super_admin_status: 'approved',
          provider_id: providerId,
          provider_status: 'pending',
          assignedby_super_admin_id: user?.id,
          updated_at: now
        })
        .eq('id', rideId)
      
      if (error) throw error
      
      // Add status history entry
      await supabase
        .from('ride_status_history')
        .insert({
          ride_id: rideId,
          previous_status: 'pending',
          new_status: 'provider_assigned',
          changed_by: user?.id,
          notes: 'Assigned to provider by super admin'
        })
      
      toast({
        title: "Success",
        description: "Ride approved and assigned to provider",
      })
      
      // Close the details dialog if open
      setIsDetailsDialogOpen(false)
      
      // Refresh the list
      fetchPendingRequests()
    } catch (error) {
      console.error('Error assigning provider:', error)
      toast({
        title: "Error",
        description: "Failed to approve ride",
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
          super_admin_status: 'declined',
          decline_reason: reason,
          updated_at: now
        })
        .eq('id', rideId)
      
      if (error) throw error
      
      // Add status history entry
      await supabase
        .from('ride_status_history')
        .insert({
          ride_id: rideId,
          previous_status: 'pending',
          new_status: 'declined',
          changed_by: user?.id,
          notes: `Declined by super admin: ${reason}`
        })
      
      toast({
        title: "Success",
        description: "Ride request declined",
      })
      
      // Close the details dialog if open
      setIsDetailsDialogOpen(false)
      
      // Refresh the list
      fetchPendingRequests()
    } catch (error) {
      console.error('Error declining ride:', error)
      toast({
        title: "Error",
        description: "Failed to decline ride",
        variant: "destructive"
      })
    }
  }

  const handleViewDetails = (ride: Ride) => {
    setSelectedRide(ride)
    setIsDetailsDialogOpen(true)
  }
  
  const handleNavigateToMember = (memberId: string) => {
    router.push(`/super-admin-dashboard/members/${memberId}`)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pending Ride Requests</h2>
        <Button onClick={fetchPendingRequests}>Refresh</Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading pending ride requests...</div>
      ) : pendingRequests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No pending ride requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map(ride => (
            <Card key={ride.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDetails(ride)}>
              <CardHeader>
                <CardTitle>Ride Request from {ride.member?.full_name}</CardTitle>
                <CardDescription>
                  {format(new Date(ride.scheduled_pickup_time), 'PPP p')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Pickup Location</p>
                    <p>{formatAddress(ride.pickup_address)}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Destination</p>
                    <p>{formatAddress(ride.dropoff_address)}</p>
                  </div>
                  {ride.notes && (
                    <div className="col-span-2">
                      <p className="font-semibold">Special Requirements</p>
                      <p>{ride.notes}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">Contact Information</p>
                    <p>{ride.member?.phone}</p>
                    <p className="text-sm text-muted-foreground">{ride.member?.email}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewDetails(ride)
                  }}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed Ride View Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedRide && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Ride Request Details
                </DialogTitle>
                <DialogDescription>
                  Submitted on {format(new Date(selectedRide.scheduled_pickup_time), 'PPP')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Member Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Member Information</h3>
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p>
                          <span 
                            className="font-medium text-primary hover:underline cursor-pointer"
                            onClick={() => {
                              if (selectedRide.member_id) {
                                setIsDetailsDialogOpen(false)
                                handleNavigateToMember(selectedRide.member_id)
                              }
                            }}
                          >
                            {selectedRide.member?.full_name}
                          </span>
                        </p>
                        <p className="text-sm">{selectedRide.member?.phone}</p>
                        <p className="text-sm text-muted-foreground">{selectedRide.member?.email}</p>
                      </div>
                      <Link 
                        href={`/super-admin-dashboard/members/${selectedRide.member_id}`} 
                        className="text-sm text-primary hover:underline"
                        onClick={() => setIsDetailsDialogOpen(false)}
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Ride Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ride Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <p className="font-medium">Pickup Location</p>
                      <p>{formatAddress(selectedRide.pickup_address)}</p>
                    </div>
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <p className="font-medium">Destination</p>
                      <p>{formatAddress(selectedRide.dropoff_address)}</p>
                    </div>
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <p className="font-medium">Scheduled Pickup Time</p>
                      <p>{format(new Date(selectedRide.scheduled_pickup_time), 'PPP p')}</p>
                    </div>
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <p className="font-medium">Payment Method</p>
                      <p className="capitalize">{selectedRide.payment_method || 'Not specified'}</p>
                    </div>
                    {selectedRide.recurring && selectedRide.recurring !== 'none' && (
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="font-medium">Recurring</p>
                        <p className="capitalize">{selectedRide.recurring}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Special Requirements */}
                {selectedRide.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Special Requirements</h3>
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <p>{selectedRide.notes}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex justify-between sm:justify-end gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Decline</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Decline Ride Request</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for declining this ride request.
                      </DialogDescription>
                    </DialogHeader>
                    <form id="decline-form" onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      const reason = formData.get('reason') as string
                      handleDecline(selectedRide.id, reason)
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
                    <Button>Approve & Assign</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign to Provider</DialogTitle>
                      <DialogDescription>
                        Select a transportation provider to assign this ride to.
                      </DialogDescription>
                    </DialogHeader>
                    <form id="assign-form" onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      const providerId = formData.get('provider') as string
                      handleAccept(selectedRide.id, providerId)
                    }}>
                      <div className="py-4">
                        <Label htmlFor="provider">Select Provider</Label>
                        <Select name="provider" required>
                          <SelectTrigger id="provider">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.length === 0 ? (
                              <SelectItem value="" disabled>No active providers</SelectItem>
                            ) : (
                              providers.map(provider => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
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
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 