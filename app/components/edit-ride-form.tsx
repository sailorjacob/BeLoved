'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormContainer } from '@/components/ui/form-container'
import { AddressInput } from '@/components/ui/address-input'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { supabase } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'

interface Address {
  address: string
  city: string
  state: string
  zip: string
}

interface RideFormData {
  pickup_address: Address
  dropoff_address: Address
  scheduled_pickup_time: string
  notes: string
  payment_method: string
  recurring: 'none' | 'daily' | 'weekly' | 'monthly'
  status: 'pending' | 'assigned' | 'started' | 'picked_up' | 'completed' | 'return_pending' | 'return_started' | 'return_picked_up' | 'return_completed'
}

const initialValues: RideFormData = {
  pickup_address: { address: '', city: '', state: '', zip: '' },
  dropoff_address: { address: '', city: '', state: '', zip: '' },
  scheduled_pickup_time: '',
  notes: '',
  payment_method: 'cash',
  recurring: 'none',
  status: 'pending'
}

interface EditRideFormProps {
  id: string
}

const validationRules = {
  pickup_address: (value: Address) => {
    if (!value.address) return 'Street address is required'
    if (!value.city) return 'City is required'
    if (!value.state) return 'State is required'
    if (!value.zip) return 'ZIP code is required'
    return undefined
  },
  dropoff_address: (value: Address) => {
    if (!value.address) return 'Street address is required'
    if (!value.city) return 'City is required'
    if (!value.state) return 'State is required'
    if (!value.zip) return 'ZIP code is required'
    return undefined
  },
  scheduled_pickup_time: (value: string) => {
    if (!value) return 'Pickup time is required'
    return undefined
  },
  payment_method: (value: string) => {
    if (!value) return 'Payment method is required'
    return undefined
  }
}

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = (i % 2) * 30
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'started', label: 'Started' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'completed', label: 'Completed' },
  { value: 'return_pending', label: 'Return Pending' },
  { value: 'return_started', label: 'Return Started' },
  { value: 'return_picked_up', label: 'Return Picked Up' },
  { value: 'return_completed', label: 'Return Completed' }
]

export function EditRideForm({ id }: EditRideFormProps) {
  const router = useRouter()

  const {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleSubmit,
    setValues
  } = useFormHandling({
    initialValues,
    validationRules,
    onSubmit: handleUpdateRide
  })

  useEffect(() => {
    const fetchRide = async () => {
      const { data: ride, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching ride:', error)
        return
      }

      if (ride) {
        const scheduledTime = new Date(ride.scheduled_pickup_time)
        setValues({
          pickup_address: ride.pickup_address,
          dropoff_address: ride.dropoff_address,
          scheduled_pickup_time: format(scheduledTime, 'HH:mm'),
          notes: ride.notes || '',
          payment_method: ride.payment_method,
          recurring: ride.recurring,
          status: ride.status
        })
      }
    }

    fetchRide()
  }, [id, setValues])

  async function handleUpdateRide(values: RideFormData) {
    const { error } = await supabase
      .from('rides')
      .update({
        pickup_address: values.pickup_address,
        dropoff_address: values.dropoff_address,
        notes: values.notes,
        payment_method: values.payment_method,
        recurring: values.recurring,
        status: values.status
      })
      .eq('id', id)

    if (error) throw error

    router.push('/my-rides')
    router.refresh()
  }

  return (
    <FormContainer
      title="Edit Ride"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
      submitButtonText="Update Ride"
    >
      <div className="space-y-6">
        <AddressInput
          id="pickup"
          label="Pickup Address"
          value={values.pickup_address}
          onChange={(address) => handleChange('pickup_address', address)}
          errors={errors.pickup_address as any}
          required
        />

        <AddressInput
          id="dropoff"
          label="Dropoff Address"
          value={values.dropoff_address}
          onChange={(address) => handleChange('dropoff_address', address)}
          errors={errors.dropoff_address as any}
          required
        />

        <div className="space-y-2">
          <Label htmlFor="time">Pickup Time</Label>
          <Select
            value={values.scheduled_pickup_time}
            onValueChange={(value) => handleChange('scheduled_pickup_time', value)}
          >
            <SelectTrigger id="time">
              <SelectValue placeholder="Select pickup time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.scheduled_pickup_time && (
            <p className="text-sm text-red-500">{errors.scheduled_pickup_time}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Ride Status</Label>
          <Select
            value={values.status}
            onValueChange={(value: any) => handleChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment">Payment Method</Label>
          <Select
            value={values.payment_method}
            onValueChange={(value) => handleChange('payment_method', value)}
          >
            <SelectTrigger id="payment">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="credit">Credit Card</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
            </SelectContent>
          </Select>
          {errors.payment_method && (
            <p className="text-sm text-red-500">{errors.payment_method}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="recurring">Recurring Ride</Label>
          <Select
            value={values.recurring}
            onValueChange={(value: any) => handleChange('recurring', value)}
          >
            <SelectTrigger id="recurring">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">One-time</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <FormInput
          id="notes"
          label="Notes"
          value={values.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Any special instructions or requirements"
          className="h-24"
          containerClassName="col-span-2"
        />
      </div>
    </FormContainer>
  )
}

