"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecurringOptions } from "./recurring-options"
import { PaymentOptions } from "./payment-options"
import { format, isBefore, startOfDay } from "date-fns"
import { useAuth } from "../contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle } from 'lucide-react'

type PaymentMethod = 'cash' | 'insurance' | 'pay_now'

interface RideFormProps {
  selectedDate: Date | undefined
  isAdmin?: boolean
}

interface NewMemberFormData {
  full_name: string;
  email: string;
  phone: string;
}

export function RideForm({ selectedDate, isAdmin = false }: RideFormProps) {
  const [time, setTime] = useState("")
  const [pickupAddress, setPickupAddress] = useState({ address: "", city: "", state: "", zip: "" })
  const [dropoffAddress, setDropoffAddress] = useState({ address: "", city: "", state: "", zip: "" })
  const [notes, setNotes] = useState("")
  const [recurring, setRecurring] = useState<Database['public']['Tables']['rides']['Row']['recurring']>("none")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [driverArrivalTime, setDriverArrivalTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [memberId, setMemberId] = useState<string>("")
  const [members, setMembers] = useState<Array<{ id: string; full_name: string }>>([])
  const [showNewMemberForm, setShowNewMemberForm] = useState(false)
  const [newMemberData, setNewMemberData] = useState<NewMemberFormData>({
    full_name: '',
    email: '',
    phone: ''
  })
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (isAdmin) {
      // Fetch members list for admin
      const fetchMembers = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('user_type', 'member')
          .order('full_name')

        if (error) {
          console.error('Error fetching members:', error)
          return
        }

        setMembers(data)
      }

      fetchMembers()
    }
  }, [isAdmin])

  useEffect(() => {
    if (time) {
      const [hours, minutes] = time.split(":").map(Number)
      const arrivalTime = new Date(0, 0, 0, hours - 1, minutes)
      setDriverArrivalTime(arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    }
  }, [time])

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 6; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        options.push(
          <SelectItem key={timeString} value={timeString}>
            {new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </SelectItem>,
        )
      }
    }
    return options
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!selectedDate) {
        alert("Please select a valid date.")
        return
      }

      const today = startOfDay(new Date())
      if (isBefore(selectedDate, today)) {
        alert("Cannot schedule a ride for a past date.")
        return
      }

      // For admin, require member selection
      if (isAdmin && !memberId) {
        alert("Please select a member.")
        return
      }

      // Create the scheduled pickup time by combining the selected date and time
      const [hours, minutes] = time.split(":").map(Number)
      const scheduledPickupTime = new Date(selectedDate)
      scheduledPickupTime.setHours(hours, minutes, 0, 0)

      const { error } = await supabase
        .from('rides')
        .insert({
          member_id: isAdmin ? memberId : user?.id,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          scheduled_pickup_time: scheduledPickupTime.toISOString(),
          notes,
          payment_method: paymentMethod,
          recurring,
          status: 'pending',
          payment_status: 'pending'
        })

      if (error) {
        console.error('Error creating ride:', error)
        alert("Failed to schedule ride. Please try again.")
        return
      }

      // Redirect based on user type
      router.push(isAdmin ? "/admin-dashboard" : "/my-rides")
    } catch (err) {
      console.error('Error scheduling ride:', err)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateMember = async () => {
    try {
      // Create a new user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newMemberData.email,
        password: Math.random().toString(36).slice(-8), // Generate random password
        options: {
          data: {
            full_name: newMemberData.full_name,
            user_type: 'member'
          }
        }
      })

      if (authError) {
        console.error('Error creating user:', authError)
        alert("Failed to create member account. Please try again.")
        return
      }

      if (!authData.user) {
        alert("Failed to create member account. Please try again.")
        return
      }

      // Create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: newMemberData.full_name,
          email: newMemberData.email,
          phone: newMemberData.phone,
          user_type: 'member'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        alert("Failed to create member profile. Please try again.")
        return
      }

      // Add the new member to the list and select them
      setMembers(prev => [...prev, { id: authData.user.id, full_name: newMemberData.full_name }])
      setMemberId(authData.user.id)
      setShowNewMemberForm(false)
      
      // Reset form
      setNewMemberData({
        full_name: '',
        email: '',
        phone: ''
      })

      alert("Member account created successfully! You can now schedule a ride for them.")
    } catch (err) {
      console.error('Error in member creation:', err)
      alert("An error occurred while creating the member account. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 border rounded-lg p-4">
      <h2 className="text-2xl font-semibold mb-4">Schedule a Ride</h2>

      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="member">Member</Label>
            <Dialog open={showNewMemberForm} onOpenChange={setShowNewMemberForm}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  New Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newMemberData.full_name}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMemberData.email}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newMemberData.phone}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleCreateMember}
                    className="w-full"
                  >
                    Create Member
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" value={selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"} readOnly />
      </div>

      <div>
        <Label htmlFor="time">Appointment Time</Label>
        <Select value={time} onValueChange={setTime}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>{generateTimeOptions()}</SelectContent>
        </Select>
      </div>

      {time && <div className="text-sm text-blue-600">Your driver will arrive at {driverArrivalTime}</div>}

      <div className="space-y-2">
        <Label htmlFor="pickup">Pickup Address</Label>
        <Input
          id="pickup-address"
          placeholder="Address"
          value={pickupAddress.address}
          onChange={(e) => setPickupAddress({ ...pickupAddress, address: e.target.value })}
          required
        />
        <Input
          id="pickup-city"
          placeholder="City"
          value={pickupAddress.city}
          onChange={(e) => setPickupAddress({ ...pickupAddress, city: e.target.value })}
          required
        />
        <div className="flex space-x-2">
          <Input
            id="pickup-state"
            placeholder="State"
            value={pickupAddress.state}
            onChange={(e) => setPickupAddress({ ...pickupAddress, state: e.target.value })}
            required
          />
          <Input
            id="pickup-zip"
            placeholder="ZIP Code"
            value={pickupAddress.zip}
            onChange={(e) => setPickupAddress({ ...pickupAddress, zip: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dropoff">Dropoff Address</Label>
        <Input
          id="dropoff-address"
          placeholder="Address"
          value={dropoffAddress.address}
          onChange={(e) => setDropoffAddress({ ...dropoffAddress, address: e.target.value })}
          required
        />
        <Input
          id="dropoff-city"
          placeholder="City"
          value={dropoffAddress.city}
          onChange={(e) => setDropoffAddress({ ...dropoffAddress, city: e.target.value })}
          required
        />
        <div className="flex space-x-2">
          <Input
            id="dropoff-state"
            placeholder="State"
            value={dropoffAddress.state}
            onChange={(e) => setDropoffAddress({ ...dropoffAddress, state: e.target.value })}
            required
          />
          <Input
            id="dropoff-zip"
            placeholder="ZIP Code"
            value={dropoffAddress.zip}
            onChange={(e) => setDropoffAddress({ ...dropoffAddress, zip: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="(Do you require assistance to the door? Use a walker, cane? Blind? or require an extra rider?)"
        />
      </div>

      <RecurringOptions value={recurring} onChange={setRecurring} />

      <PaymentOptions value={paymentMethod} onChange={setPaymentMethod} />

      <div className="text-sm text-red-600">
        Please note that we require your driver to pick you up 1 hour before your appointment time. If the appointment
        is scheduled for a Monday, the ride must be booked by Friday before close of business.
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Scheduling..." : "Schedule Ride"}
      </Button>
    </form>
  )
}

