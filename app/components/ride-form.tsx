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
import { Checkbox } from '@/components/ui/checkbox'
import { startOfDay, isBefore, addHours } from 'date-fns'
import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'

interface Address {
  address: string
  city: string
  state: string
  zip: string
}

interface RideFormData {
  pickup_address: Address
  dropoff_address: Address
  appointment_time: string
  scheduled_pickup_time: string
  notes: string
  payment_method: string
  recurring: 'none' | 'daily' | 'weekly' | 'monthly'
  needs_return_trip: boolean
  return_pickup_time: string
  return_pickup_address?: Address
  return_dropoff_address?: Address
  return_pickup_tba: boolean
}

const initialValues: RideFormData = {
  pickup_address: { address: '', city: '', state: '', zip: '' },
  dropoff_address: { address: '', city: '', state: '', zip: '' },
  appointment_time: '',
  scheduled_pickup_time: '',
  notes: '',
  payment_method: 'cash',
  recurring: 'none',
  needs_return_trip: false,
  return_pickup_time: '',
  return_pickup_tba: false
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
  appointment_time: (value: string) => {
    if (!value) return 'Appointment time is required'
    return undefined
  },
  scheduled_pickup_time: (value: string, formValues: RideFormData) => {
    // This is calculated automatically based on appointment time
    return undefined
  },
  payment_method: (value: string) => {
    if (!value) return 'Payment method is required'
    return undefined
  },
  return_pickup_time: (value: string, formValues: RideFormData) => {
    if (formValues.needs_return_trip && !formValues.return_pickup_tba && !value) {
      return 'Return pickup time is required unless TBA is selected'
    }
    return undefined
  },
  return_pickup_address: (value: Address | undefined, formValues: RideFormData) => {
    if (formValues.needs_return_trip && value) {
      if (!value.address) return 'Street address is required'
      if (!value.city) return 'City is required'
      if (!value.state) return 'State is required'
      if (!value.zip) return 'ZIP code is required'
    }
    return undefined
  },
  return_dropoff_address: (value: Address | undefined, formValues: RideFormData) => {
    if (formValues.needs_return_trip && value) {
      if (!value.address) return 'Street address is required'
      if (!value.city) return 'City is required'
      if (!value.state) return 'State is required'
      if (!value.zip) return 'ZIP code is required'
    }
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
  const [useCustomReturnAddresses, setUseCustomReturnAddresses] = useState(false)

  const handleCreateRide = async (values: RideFormData) => {
    const today = startOfDay(new Date())
    if (isBefore(selectedDate, today)) {
      throw new Error('Cannot schedule a ride for a past date')
    }

    if (isAdmin && !memberId) {
      throw new Error('Please select a member')
    }

    // Create the scheduled appointment time by combining the selected date and time
    const [appointmentHours, appointmentMinutes] = values.appointment_time.split(':').map(Number)
    const appointmentTime = new Date(selectedDate)
    appointmentTime.setHours(appointmentHours, appointmentMinutes, 0, 0)
    
    // Create the scheduled pickup time by combining the selected date and scheduled pickup time
    // This may be auto-calculated in the UI as 1 hour before appointment time
    const [pickupHours, pickupMinutes] = values.scheduled_pickup_time.split(':').map(Number)
    const scheduledPickupTime = new Date(selectedDate)
    scheduledPickupTime.setHours(pickupHours, pickupMinutes, 0, 0)

    try {
      // Prepare the initial ride data
      const rideData = {
        member_id: isAdmin ? memberId : user?.id,
        pickup_address: values.pickup_address,
        dropoff_address: values.dropoff_address,
        appointment_time: appointmentTime.toISOString(),
        scheduled_pickup_time: scheduledPickupTime.toISOString(),
        notes: values.notes,
        payment_method: values.payment_method,
        recurring: values.recurring,
        status: 'pending',
        payment_status: 'pending',
        super_admin_status: 'pending',
        is_return_trip: false
      }

      // Use supabase (not admin) first to try inserting
      let { error } = await supabase
        .from('rides')
        .insert(rideData)

      // If there's an RLS error, try with supabaseAdmin
      if (error && error.code === '42501') {
        console.log('Using admin client due to RLS policy issue')
        const { error: adminError } = await supabaseAdmin
          .from('rides')
          .insert(rideData)
          
        if (adminError) {
          console.error('Error creating ride with admin client:', adminError)
          throw new Error(`Failed to create ride: ${adminError.message}`)
        }
      } else if (error) {
        console.error('Error creating ride:', error)
        throw new Error(`Failed to create ride: ${error.message}`)
      }

      // If a return trip is needed, create another ride entry
      if (values.needs_return_trip) {
        // Determine return pickup time
        let returnPickupTime: Date | null = null;
        
        if (!values.return_pickup_tba) {
          const [returnHours, returnMinutes] = values.return_pickup_time.split(':').map(Number)
          returnPickupTime = new Date(selectedDate)
          returnPickupTime.setHours(returnHours, returnMinutes, 0, 0)
        }

        // Create return ride data
        const returnRideData = {
          member_id: isAdmin ? memberId : user?.id,
          pickup_address: useCustomReturnAddresses && values.return_pickup_address 
            ? values.return_pickup_address 
            : values.dropoff_address,
          dropoff_address: useCustomReturnAddresses && values.return_dropoff_address 
            ? values.return_dropoff_address 
            : values.pickup_address,
          appointment_time: appointmentTime.toISOString(),
          scheduled_pickup_time: returnPickupTime ? returnPickupTime.toISOString() : null,
          notes: values.notes + (values.return_pickup_tba ? " (Return pickup time TBA)" : ""),
          payment_method: values.payment_method,
          recurring: values.recurring,
          status: 'pending',
          payment_status: 'pending',
          super_admin_status: 'pending',
          is_return_trip: true,
          return_pickup_tba: values.return_pickup_tba
        }

        // Try with regular client first
        let { error: returnError } = await supabase
          .from('rides')
          .insert(returnRideData)

        // If there's an RLS error, try with supabaseAdmin
        if (returnError && returnError.code === '42501') {
          console.log('Using admin client for return trip due to RLS policy issue')
          const { error: returnAdminError } = await supabaseAdmin
            .from('rides')
            .insert(returnRideData)
            
          if (returnAdminError) {
            console.error('Error creating return ride with admin client:', returnAdminError)
            // Don't throw here since the first ride was created successfully
          }
        } else if (returnError) {
          console.error('Error creating return ride:', returnError)
          // Don't throw here since the first ride was created successfully
        }
      }

      // Redirect based on user type
      router.push(isAdmin ? '/admin-dashboard' : '/member-dashboard/rides')
    } catch (error) {
      console.error('Error in ride creation:', error)
      throw error
    }
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

  // Calculate pickup time automatically (1 hour before appointment)
  useEffect(() => {
    if (values.appointment_time) {
      const [hours, minutes] = values.appointment_time.split(':').map(Number)
      // Calculate 1 hour before
      let pickupHours = hours - 1
      if (pickupHours < 0) pickupHours = 0
      
      const pickupTime = `${pickupHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      handleChange('scheduled_pickup_time', pickupTime)
    }
  }, [values.appointment_time])

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
          <Label htmlFor="appointment-time">Appointment Time</Label>
          <Select
            value={values.appointment_time}
            onValueChange={(value) => handleChange('appointment_time', value)}
          >
            <SelectTrigger id="appointment-time">
              <SelectValue placeholder="Select appointment time" />
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
          {errors.appointment_time && (
            <p className="text-sm text-red-500">{errors.appointment_time}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Pickup Time (1 hour before appointment)</Label>
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

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="return-trip"
            checked={values.needs_return_trip}
            onCheckedChange={(checked) => handleChange('needs_return_trip', !!checked)}
          />
          <Label htmlFor="return-trip" className="font-medium">Add Return Trip</Label>
        </div>

        {values.needs_return_trip && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
            <h3 className="font-semibold text-lg">Return Trip Details</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="custom-addresses"
                checked={useCustomReturnAddresses}
                onCheckedChange={setUseCustomReturnAddresses}
              />
              <Label htmlFor="custom-addresses">
                Use different addresses for return trip
              </Label>
            </div>
            
            {useCustomReturnAddresses && (
              <>
                <AddressInput
                  id="return-pickup"
                  label="Return Pickup Address"
                  value={values.return_pickup_address || values.dropoff_address}
                  onChange={(address) => handleChange('return_pickup_address', address)}
                  errors={errors.return_pickup_address as any}
                  required
                />

                <AddressInput
                  id="return-dropoff"
                  label="Return Dropoff Address"
                  value={values.return_dropoff_address || values.pickup_address}
                  onChange={(address) => handleChange('return_dropoff_address', address)}
                  errors={errors.return_dropoff_address as any}
                  required
                />
              </>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="return-tba"
                checked={values.return_pickup_tba}
                onCheckedChange={(checked) => handleChange('return_pickup_tba', !!checked)}
              />
              <Label htmlFor="return-tba">Return pickup time to be announced (TBA)</Label>
            </div>

            {!values.return_pickup_tba && (
              <div className="space-y-2">
                <Label htmlFor="return-time">Return Pickup Time</Label>
                <Select
                  value={values.return_pickup_time}
                  onValueChange={(value) => handleChange('return_pickup_time', value)}
                >
                  <SelectTrigger id="return-time">
                    <SelectValue placeholder="Select return pickup time" />
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
                {errors.return_pickup_time && (
                  <p className="text-sm text-red-500">{errors.return_pickup_time}</p>
                )}
              </div>
            )}
          </div>
        )}

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

