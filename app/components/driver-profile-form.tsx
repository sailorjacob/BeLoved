'use client'

import { useEffect } from 'react'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { AddressInput } from '@/components/ui/address-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { useAuth } from '@/hooks/useAuth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

interface Address {
  address: string
  city: string
  state: string
  zip: string
}

interface DriverProfileFormData {
  full_name: string
  email: string
  phone: string
  license_number: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: string
  vehicle_color: string
  vehicle_plate: string
  home_address: Address
  status: 'active' | 'inactive' | 'on_break'
}

const initialValues: DriverProfileFormData = {
  full_name: '',
  email: '',
  phone: '',
  license_number: '',
  vehicle_make: '',
  vehicle_model: '',
  vehicle_year: '',
  vehicle_color: '',
  vehicle_plate: '',
  home_address: {
    address: '',
    city: '',
    state: '',
    zip: ''
  },
  status: 'inactive'
}

const validationRules = {
  full_name: (value: string) => {
    if (!value) return 'Full name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    return undefined
  },
  email: (value: string) => {
    if (!value) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
    return undefined
  },
  phone: (value: string) => {
    if (!value) return 'Phone number is required'
    if (!/^\+?[\d\s-]{10,}$/.test(value)) return 'Invalid phone number format'
    return undefined
  },
  license_number: (value: string) => {
    if (!value) return 'Driver license number is required'
    return undefined
  },
  vehicle_make: (value: string) => {
    if (!value) return 'Vehicle make is required'
    return undefined
  },
  vehicle_model: (value: string) => {
    if (!value) return 'Vehicle model is required'
    return undefined
  },
  vehicle_year: (value: string) => {
    if (!value) return 'Vehicle year is required'
    const year = parseInt(value)
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      return 'Invalid vehicle year'
    }
    return undefined
  },
  vehicle_color: (value: string) => {
    if (!value) return 'Vehicle color is required'
    return undefined
  },
  vehicle_plate: (value: string) => {
    if (!value) return 'License plate number is required'
    return undefined
  },
  home_address: (value: Address) => {
    if (!value.address) return 'Street address is required'
    if (!value.city) return 'City is required'
    if (!value.state) return 'State is required'
    if (!value.zip) return 'ZIP code is required'
    return undefined
  }
}

export function DriverProfileForm() {
  const { user, updateProfile } = useAuth()

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
    onSubmit: async (values) => {
      // Update profile in Supabase
      const { error: profileError } = await updateProfile({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        home_address: values.home_address
      })

      if (profileError) throw profileError

      // Update driver profile
      const { error: driverProfileError } = await supabase
        .from('driver_profiles')
        .update({
          license_number: values.license_number,
          vehicle_make: values.vehicle_make,
          vehicle_model: values.vehicle_model,
          vehicle_year: values.vehicle_year,
          vehicle_color: values.vehicle_color,
          vehicle_plate: values.vehicle_plate,
          status: values.status
        })
        .eq('id', user?.id)

      if (driverProfileError) throw driverProfileError
    }
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      // Fetch both profile and driver profile data
      const [{ data: profile }, { data: driverProfile }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        supabase
          .from('driver_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
      ])

      if (profile && driverProfile) {
        setValues({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          home_address: profile.home_address || initialValues.home_address,
          license_number: driverProfile.license_number,
          vehicle_make: driverProfile.vehicle_make,
          vehicle_model: driverProfile.vehicle_model,
          vehicle_year: driverProfile.vehicle_year,
          vehicle_color: driverProfile.vehicle_color,
          vehicle_plate: driverProfile.vehicle_plate,
          status: driverProfile.status
        })
      }
    }

    fetchProfile()
  }, [user, setValues])

  return (
    <FormContainer
      title="Driver Profile"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
      submitButtonText="Save Changes"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="full_name"
            label="Full Name"
            value={values.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            error={errors.full_name}
            required
          />

          <FormInput
            id="email"
            label="Email"
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            required
          />

          <FormInput
            id="phone"
            label="Phone"
            type="tel"
            value={values.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={errors.phone}
            required
          />

          <FormInput
            id="license_number"
            label="Driver License Number"
            value={values.license_number}
            onChange={(e) => handleChange('license_number', e.target.value)}
            error={errors.license_number}
            required
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="vehicle_make"
              label="Make"
              value={values.vehicle_make}
              onChange={(e) => handleChange('vehicle_make', e.target.value)}
              error={errors.vehicle_make}
              required
            />

            <FormInput
              id="vehicle_model"
              label="Model"
              value={values.vehicle_model}
              onChange={(e) => handleChange('vehicle_model', e.target.value)}
              error={errors.vehicle_model}
              required
            />

            <FormInput
              id="vehicle_year"
              label="Year"
              value={values.vehicle_year}
              onChange={(e) => handleChange('vehicle_year', e.target.value)}
              error={errors.vehicle_year}
              required
            />

            <FormInput
              id="vehicle_color"
              label="Color"
              value={values.vehicle_color}
              onChange={(e) => handleChange('vehicle_color', e.target.value)}
              error={errors.vehicle_color}
              required
            />

            <FormInput
              id="vehicle_plate"
              label="License Plate"
              value={values.vehicle_plate}
              onChange={(e) => handleChange('vehicle_plate', e.target.value)}
              error={errors.vehicle_plate}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(value: 'active' | 'inactive' | 'on_break') => 
                  handleChange('status', value)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_break">On Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <AddressInput
            id="home"
            label="Home Address"
            value={values.home_address}
            onChange={(address) => handleChange('home_address', address)}
            errors={errors.home_address as any}
            required
          />
        </div>
      </div>
    </FormContainer>
  )
} 