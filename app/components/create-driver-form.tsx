"use client"

import { useRouter } from 'next/navigation'
import { FormContainer } from '@/components/ui/form-container'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Provider {
  id: string
  name: string
  organization_code: string
}

interface DriverFormData {
  username: string
  password: string
  full_name: string
  email: string
  phone: string
  provider_id: string
}

const initialValues: DriverFormData = {
  username: '',
  password: '',
  full_name: '',
  email: '',
  phone: '',
  provider_id: ''
}

const validationRules = {
  username: (value: string) => {
    if (!value) return 'Username is required'
    if (value.length < 3) return 'Username must be at least 3 characters'
    return undefined
  },
  password: (value: string) => {
    if (!value) return 'Password is required'
    if (value.length < 6) return 'Password must be at least 6 characters'
    return undefined
  },
  full_name: (value: string) => {
    if (!value) return 'Name is required'
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
  provider_id: (value: string) => {
    if (!value) return 'Provider is required'
    return undefined
  }
}

export function CreateDriverForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)

  useEffect(() => {
    // Fetch providers for the dropdown
    const fetchProviders = async () => {
      try {
        const { data, error } = await supabase
          .from('transportation_providers')
          .select('id, name, organization_code')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        setProviders(data || []);
      } catch (error) {
        console.error('Error fetching providers:', error);
        toast.error('Failed to load providers');
      }
    };

    fetchProviders();
  }, []);

  const handleCreateDriver = async (values: DriverFormData) => {
    setIsLoading(true)
    try {
      // Find the selected provider to get its organization code
      const provider = providers.find(p => p.id === values.provider_id);
      if (!provider) {
        throw new Error('Selected provider not found');
      }
      
      // 1. Create auth user with username/password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            user_role: 'driver'
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) throw new Error('No user returned from sign up')

      // 2. Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          username: values.username,
          user_role: 'driver',
          provider_id: values.provider_id,
          organization_code: provider.organization_code  // Set the organization code
        })

      if (profileError) throw profileError

      // 3. Create driver profile record
      const { error: driverProfileError } = await supabase
        .from('driver_profiles')
        .insert({
          id: authData.user.id,
          status: 'active',
          completed_rides: 0,
          total_miles: 0
        })

      if (driverProfileError) throw driverProfileError

      toast.success('Driver created successfully')
      router.push('/admin-dashboard')
    } catch (error) {
      console.error('Error creating driver:', error)
      toast.error('Error creating driver')
    } finally {
      setIsLoading(false)
    }
  }

  const { values, errors, handleChange, handleSubmit } = useFormHandling<DriverFormData>({
    initialValues,
    validationRules,
    onSubmit: handleCreateDriver
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e.target.name as keyof DriverFormData, e.target.value)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/drivers')}
          >
            Back
          </Button>
          <CardTitle>Create New Driver Account</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Provider <span className="text-red-500">*</span>
            </label>
            <Select
              value={values.provider_id}
              onValueChange={(value) => handleChange('provider_id', value)}
            >
              <SelectTrigger className={errors.provider_id ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name} ({provider.organization_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.provider_id && (
              <p className="text-sm text-red-500">{errors.provider_id}</p>
            )}
          </div>
          <FormInput
            label="Username"
            name="username"
            value={values.username}
            error={errors.username}
            onChange={handleInputChange}
            required
          />
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={values.password}
            error={errors.password}
            onChange={handleInputChange}
            required
          />
          <FormInput
            label="Full Name"
            name="full_name"
            value={values.full_name}
            error={errors.full_name}
            onChange={handleInputChange}
            required
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={values.email}
            error={errors.email}
            onChange={handleInputChange}
            required
          />
          <FormInput
            label="Phone Number"
            name="phone"
            value={values.phone}
            error={errors.phone}
            onChange={handleInputChange}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Driver'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

