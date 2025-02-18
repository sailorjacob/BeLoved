'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecurringOptions } from './recurring-options'
import { PaymentOptions } from './payment-options'

interface AdminRideFormProps {
  selectedDate: Date | undefined
  onClose: () => void
}

export function AdminRideForm({ selectedDate, onClose }: AdminRideFormProps) {
  const [time, setTime] = useState('')
  const [pickupAddress, setPickupAddress] = useState({ address: '', city: '', state: '', zip: '' })
  const [appointmentAddress, setAppointmentAddress] = useState({ address: '', city: '', state: '', zip: '' })
  const [contactInfo, setContactInfo] = useState({ name: '', phone: '', email: '' })
  const [notes, setNotes] = useState('')
  const [recurring, setRecurring] = useState('none')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [driverArrivalTime, setDriverArrivalTime] = useState('')
  const [assignedDriver, setAssignedDriver] = useState('unassigned') // Updated initial state

  useEffect(() => {
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      const arrivalTime = new Date(0, 0, 0, hours - 1, minutes)
      setDriverArrivalTime(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
  }, [time])

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 6; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(
          <SelectItem key={timeString} value={timeString}>
            {new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </SelectItem>
        )
      }
    }
    return options
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log({
      date: selectedDate,
      time,
      pickupAddress,
      appointmentAddress,
      contactInfo,
      notes,
      recurring,
      paymentMethod,
      assignedDriver
    })
    onClose()
  }

  // Mock drivers data
  const mockDrivers = [
    { id: 0, name: 'Dwayne' },
    { id: 1, name: 'Gino' },
    { id: 2, name: 'Jacob' },
    { id: 3, name: 'Mike' },
    { id: 4, name: 'Sherry' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" value={selectedDate?.toDateString()} readOnly />
      </div>
      
      <div>
        <Label htmlFor="time">Appointment Time</Label>
        <Select value={time} onValueChange={setTime}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            {generateTimeOptions()}
          </SelectContent>
        </Select>
      </div>
      
      {time && (
        <div className="text-sm text-blue-600">
          Your driver will arrive at {driverArrivalTime}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="pickup">Pickup Address</Label>
        <Input id="pickup-address" placeholder="Address" value={pickupAddress.address} onChange={(e) => setPickupAddress({...pickupAddress, address: e.target.value})} required />
        <Input id="pickup-city" placeholder="City" value={pickupAddress.city} onChange={(e) => setPickupAddress({...pickupAddress, city: e.target.value})} required />
        <div className="flex space-x-2">
          <Input id="pickup-state" placeholder="State" value={pickupAddress.state} onChange={(e) => setPickupAddress({...pickupAddress, state: e.target.value})} required />
          <Input id="pickup-zip" placeholder="ZIP Code" value={pickupAddress.zip} onChange={(e) => setPickupAddress({...pickupAddress, zip: e.target.value})} required />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="appointment">Appointment Address</Label>
        <Input id="appointment-address" placeholder="Address" value={appointmentAddress.address} onChange={(e) => setAppointmentAddress({...appointmentAddress, address: e.target.value})} required />
        <Input id="appointment-city" placeholder="City" value={appointmentAddress.city} onChange={(e) => setAppointmentAddress({...appointmentAddress, city: e.target.value})} required />
        <div className="flex space-x-2">
          <Input id="appointment-state" placeholder="State" value={appointmentAddress.state} onChange={(e) => setAppointmentAddress({...appointmentAddress, state: e.target.value})} required />
          <Input id="appointment-zip" placeholder="ZIP Code" value={appointmentAddress.zip} onChange={(e) => setAppointmentAddress({...appointmentAddress, zip: e.target.value})} required />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Contact Information</Label>
        <Input 
          id="contact-name" 
          placeholder="Full Name" 
          value={contactInfo.name} 
          onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})} 
          required 
        />
        <Input 
          id="contact-phone" 
          type="tel" 
          placeholder="Phone Number" 
          value={contactInfo.phone} 
          onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})} 
          required 
        />
        <Input 
          id="contact-email" 
          type="email" 
          placeholder="Email Address" 
          value={contactInfo.email} 
          onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})} 
          required 
        />
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
      
      <div>
        <Label htmlFor="assignedDriver">Assigned Driver</Label>
        <Select value={assignedDriver} onValueChange={setAssignedDriver}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {mockDrivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.name}>{driver.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="text-sm text-red-600">
        Please note that we require your driver to pick you up 1 hour before your appointment time. If the appointment is scheduled for a Monday, the ride must be booked by Friday before close of business.
      </div>
      
      <Button type="submit" className="w-full">Schedule Ride</Button>
    </form>
  )
}

