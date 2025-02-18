'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecurringOptions } from './recurring-options'
import { PaymentOptions } from './payment-options'

interface EditRideFormProps {
  id: string
}

export function EditRideForm({ id }: EditRideFormProps) {
  // This is a placeholder. In a real application, you would fetch the ride data based on the ID.
  const [ride, setRide] = useState({
    date: '2023-06-01',
    time: '10:00',
    pickupAddress: { address: '123 Main St', city: 'Anytown', state: 'ST', zip: '12345' },
    appointmentAddress: { address: '456 Hospital Ave', city: 'Medtown', state: 'ST', zip: '67890' },
    contactInfo: { name: 'John Doe', phone: '123-456-7890', email: 'john@example.com' },
    notes: '',
    recurring: 'none',
    paymentMethod: 'cash'
  })

  useEffect(() => {
    // Fetch ride data here based on the ID
    console.log('Fetching ride data for ID:', id)
  }, [id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Updating ride:', ride)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 border rounded-lg p-4">
      <h2 className="text-2xl font-semibold mb-4">Edit Ride</h2>
      
      <div>
        <Label htmlFor="date">Date</Label>
        <Input 
          id="date" 
          type="date" 
          value={ride.date} 
          onChange={(e) => setRide({...ride, date: e.target.value})}
          required 
        />
      </div>
      
      <div>
        <Label htmlFor="time">Appointment Time</Label>
        <Input 
          id="time" 
          type="time" 
          value={ride.time} 
          onChange={(e) => setRide({...ride, time: e.target.value})}
          required 
        />
      </div>
      
      {/* Pickup Address */}
      <div className="space-y-2">
        <Label htmlFor="pickup">Pickup Address</Label>
        <Input 
          id="pickup-address" 
          placeholder="Address" 
          value={ride.pickupAddress.address} 
          onChange={(e) => setRide({...ride, pickupAddress: {...ride.pickupAddress, address: e.target.value}})}
          required 
        />
        <Input 
          id="pickup-city" 
          placeholder="City" 
          value={ride.pickupAddress.city} 
          onChange={(e) => setRide({...ride, pickupAddress: {...ride.pickupAddress, city: e.target.value}})}
          required 
        />
        <div className="flex space-x-2">
          <Input 
            id="pickup-state" 
            placeholder="State" 
            value={ride.pickupAddress.state} 
            onChange={(e) => setRide({...ride, pickupAddress: {...ride.pickupAddress, state: e.target.value}})}
            required 
          />
          <Input 
            id="pickup-zip" 
            placeholder="ZIP Code" 
            value={ride.pickupAddress.zip} 
            onChange={(e) => setRide({...ride, pickupAddress: {...ride.pickupAddress, zip: e.target.value}})}
            required 
          />
        </div>
      </div>
      
      {/* Appointment Address */}
      <div className="space-y-2">
        <Label htmlFor="appointment">Appointment Address</Label>
        <Input 
          id="appointment-address" 
          placeholder="Address" 
          value={ride.appointmentAddress.address} 
          onChange={(e) => setRide({...ride, appointmentAddress: {...ride.appointmentAddress, address: e.target.value}})}
          required 
        />
        <Input 
          id="appointment-city" 
          placeholder="City" 
          value={ride.appointmentAddress.city} 
          onChange={(e) => setRide({...ride, appointmentAddress: {...ride.appointmentAddress, city: e.target.value}})}
          required 
        />
        <div className="flex space-x-2">
          <Input 
            id="appointment-state" 
            placeholder="State" 
            value={ride.appointmentAddress.state} 
            onChange={(e) => setRide({...ride, appointmentAddress: {...ride.appointmentAddress, state: e.target.value}})}
            required 
          />
          <Input 
            id="appointment-zip" 
            placeholder="ZIP Code" 
            value={ride.appointmentAddress.zip} 
            onChange={(e) => setRide({...ride, appointmentAddress: {...ride.appointmentAddress, zip: e.target.value}})}
            required 
          />
        </div>
      </div>
      
      {/* Contact Information */}
      <div className="space-y-2">
        <Label>Contact Information</Label>
        <Input 
          id="contact-name" 
          placeholder="Full Name" 
          value={ride.contactInfo.name} 
          onChange={(e) => setRide({...ride, contactInfo: {...ride.contactInfo, name: e.target.value}})} 
          required 
        />
        <Input 
          id="contact-phone" 
          type="tel" 
          placeholder="Phone Number" 
          value={ride.contactInfo.phone} 
          onChange={(e) => setRide({...ride, contactInfo: {...ride.contactInfo, phone: e.target.value}})} 
          required 
        />
        <Input 
          id="contact-email" 
          type="email" 
          placeholder="Email Address" 
          value={ride.contactInfo.email} 
          onChange={(e) => setRide({...ride, contactInfo: {...ride.contactInfo, email: e.target.value}})} 
          required 
        />
      </div>
      
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          value={ride.notes} 
          onChange={(e) => setRide({...ride, notes: e.target.value})} 
          placeholder="(Do you require assistance to the door? Use a walker, cane? Blind? or require an extra rider?)"
        />
      </div>
      
      <RecurringOptions value={ride.recurring} onChange={(value) => setRide({...ride, recurring: value})} />
      
      <PaymentOptions value={ride.paymentMethod} onChange={(value) => setRide({...ride, paymentMethod: value})} />
      
      <div className="text-sm text-red-600">
        Please note that rides cannot be edited within 24 hours of the scheduled pickup time.
      </div>
      
      <Button type="submit" className="w-full">Update Ride</Button>
    </form>
  )
}

