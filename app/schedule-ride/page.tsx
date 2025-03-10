"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import { TimePicker } from '@/components/time-picker'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function ScheduleRidePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [pickupAddress, setPickupAddress] = useState({
    address: '',
    city: '',
    state: '',
    zip: ''
  })
  const [dropoffAddress, setDropoffAddress] = useState({
    address: '',
    city: '',
    state: '',
    zip: ''
  })
  const [rideDate, setRideDate] = useState<Date | undefined>(undefined)
  const [rideTime, setRideTime] = useState<Date | undefined>(undefined)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to schedule a ride',
        variant: 'destructive'
      })
      return
    }

    if (!rideDate || !rideTime) {
      toast({
        title: 'Missing information',
        description: 'Please select a date and time for your ride',
        variant: 'destructive'
      })
      return
    }

    // Combine date and time
    const scheduledPickupTime = new Date(rideDate)
    scheduledPickupTime.setHours(rideTime.getHours())
    scheduledPickupTime.setMinutes(rideTime.getMinutes())
    
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('rides')
        .insert({
          member_id: profile.id,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          scheduled_pickup_time: scheduledPickupTime.toISOString(),
          payment_method: paymentMethod,
          payment_status: 'pending',
          status: 'pending',
          recurring: 'none',
          notes: notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) {
        throw error
      }
      
      toast({
        title: 'Ride Scheduled',
        description: 'Your ride has been scheduled successfully!',
      })
      
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error scheduling ride:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule ride. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Schedule a Ride</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Pickup Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="pickup-address">Street Address</Label>
              <Input
                id="pickup-address"
                placeholder="123 Main St"
                value={pickupAddress.address}
                onChange={(e) => setPickupAddress({...pickupAddress, address: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="pickup-city">City</Label>
              <Input
                id="pickup-city"
                placeholder="New York"
                value={pickupAddress.city}
                onChange={(e) => setPickupAddress({...pickupAddress, city: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup-state">State</Label>
                <Input
                  id="pickup-state"
                  placeholder="NY"
                  value={pickupAddress.state}
                  onChange={(e) => setPickupAddress({...pickupAddress, state: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="pickup-zip">ZIP Code</Label>
                <Input
                  id="pickup-zip"
                  placeholder="10001"
                  value={pickupAddress.zip}
                  onChange={(e) => setPickupAddress({...pickupAddress, zip: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Destination Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="dropoff-address">Street Address</Label>
              <Input
                id="dropoff-address"
                placeholder="456 Park Ave"
                value={dropoffAddress.address}
                onChange={(e) => setDropoffAddress({...dropoffAddress, address: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="dropoff-city">City</Label>
              <Input
                id="dropoff-city"
                placeholder="New York"
                value={dropoffAddress.city}
                onChange={(e) => setDropoffAddress({...dropoffAddress, city: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dropoff-state">State</Label>
                <Input
                  id="dropoff-state"
                  placeholder="NY"
                  value={dropoffAddress.state}
                  onChange={(e) => setDropoffAddress({...dropoffAddress, state: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="dropoff-zip">ZIP Code</Label>
                <Input
                  id="dropoff-zip"
                  placeholder="10001"
                  value={dropoffAddress.zip}
                  onChange={(e) => setDropoffAddress({...dropoffAddress, zip: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Schedule Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Pickup Date</Label>
              <DatePicker
                date={rideDate}
                onSelect={setRideDate}
                disabled={(date) => date < new Date()}
              />
            </div>
            
            <div>
              <Label>Pickup Time</Label>
              <TimePicker
                date={rideTime}
                onSelect={setRideTime}
              />
            </div>
            
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select
                defaultValue={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or requirements"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24"
            />
          </div>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Scheduling...' : 'Schedule Ride'}
          </Button>
        </div>
      </form>
    </div>
  )
} 