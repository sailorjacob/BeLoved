"use client"

import { useRouter } from 'next/navigation'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { AddressInput } from '@/components/ui/address-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { useAuth } from '@/app/contexts/auth-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { startOfDay, isBefore } from 'date-fns'

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
}

const initialValues: RideFormData = {
  pickup_address: { address: '', city: '', state: '', zip: '' },
  dropoff_address: { address: '', city: '', state: '', zip: '' },
  scheduled_pickup_time: '',
  notes: '',
  payment_method: 'cash',
  recurring: 'none'
}

interface RideFormProps {
  selectedDate: Date
  isAdmin?: boolean
  memberId?: string
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

export function RideForm({ selectedDate, isAdmin = false, memberId }: RideFormProps) {
  const router = useRouter()
  const { user } = useAuth()

  const handleCreateRide = async (values: RideFormData) => {
    const today = startOfDay(new Date())
    if (isBefore(selectedDate, today)) {
      throw new Error('Cannot schedule a ride for a past date')
    }

    if (isAdmin && !memberId) {
      throw new Error('Please select a member')
    }

    // Create the scheduled pickup time by combining the selected date and time
    const [hours, minutes] = values.scheduled_pickup_time.split(':').map(Number)
    const scheduledPickupTime = new Date(selectedDate)
    scheduledPickupTime.setHours(hours, minutes, 0, 0)

    // Prepare the ride data
    const rideData = {
      member_id: isAdmin ? memberId : user?.id,
      pickup_address: values.pickup_address,
      dropoff_address: values.dropoff_address,
      scheduled_pickup_time: scheduledPickupTime.toISOString(),
      notes: values.notes,
      payment_method: values.payment_method,
      recurring: values.recurring,
      status: 'pending',
      payment_status: 'pending',
      super_admin_status: 'pending',
    }

    // Use the admin client to bypass RLS policy issues
    const { error } = await supabaseAdmin
      .from('rides')
      .insert(rideData)

    if (error) {
      console.error('Error creating ride:', error)
      throw new Error(`Failed to create ride: ${error.message}`)
    }

    // Redirect based on user type
    router.push(isAdmin ? '/admin-dashboard' : '/member-dashboard/rides')
  }

  const {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleSubmit
  } = useFormHandling({
    initialValues,
    validationRules,
    onSubmit: handleCreateRide
  })

  return (
    <FormContainer
      title="Schedule a Ride"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
      submitButtonText="Schedule Ride"
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

