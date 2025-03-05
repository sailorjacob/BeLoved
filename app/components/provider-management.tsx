'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { NavigationManager } from "@/app/contexts/auth-context"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Link from "next/link"

interface Provider {
  id: string
  name: string
  organization_code: string
  address: string
  city: string
  state: string
  zip: string
  status: 'active' | 'inactive'
}

interface Admin {
  id: string
  full_name: string
  email: string
  phone: string
  username: string
  provider_id?: string
  provider?: Provider
  status: 'active' | 'inactive'
}

interface ProviderFormData {
  name: string
  organization_code: string
  address: string
  city: string
  state: string
  zip: string
}

interface AdminFormData {
  full_name: string
  email: string
  phone: string
  username: string
  password: string
  provider_id?: string
}

const providerValidationRules = {
  name: (value: string) => {
    if (!value) return 'Provider name is required'
    if (value.length < 2) return 'Provider name must be at least 2 characters'
    return undefined
  },
  organization_code: (value: string) => {
    if (!value) return 'Organization code is required'
    if (value.length < 2) return 'Organization code must be at least 2 characters'
    return undefined
  },
  address: (value: string) => {
    if (!value) return 'Address is required'
    return undefined
  },
  city: (value: string) => {
    if (!value) return 'City is required'
    return undefined
  },
  state: (value: string) => {
    if (!value) return 'State is required'
    if (value.length !== 2) return 'Please use 2-letter state code'
    return undefined
  },
  zip: (value: string) => {
    if (!value) return 'ZIP code is required'
    if (!/^\d{5}(-\d{4})?$/.test(value)) return 'Invalid ZIP code format'
    return undefined
  }
}

const adminValidationRules = {
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
  username: (value: string) => {
    if (!value) return 'Username is required'
    if (value.length < 3) return 'Username must be at least 3 characters'
    return undefined
  },
  password: (value: string) => {
    if (!value) return 'Password is required'
    if (value.length < 6) return 'Password must be at least 6 characters'
    return undefined
  }
}

export function ProviderManagement() {
  const router = useRouter()
  const [providers, setProviders] = useState<Provider[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false)
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false)
  const [providerToUpdate, setProviderToUpdate] = useState<Provider | null>(null)
  const [isUsingDemoData, setIsUsingDemoData] = useState(false)
  const fetchAttemptedRef = useRef(false)

  // One-time check of providers table
  useEffect(() => {
    const checkProviders = async () => {
      console.log('[DEBUG] Checking providers table...')
      const { data, error } = await supabase
        .from('transportation_providers')
        .select('*')
      
      console.log('[DEBUG] All providers in database:', data)
      console.log('[DEBUG] Any errors:', error)
    }
    checkProviders()
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      if (fetchAttemptedRef.current) return;
      fetchAttemptedRef.current = true;
      setIsLoading(true)
      console.log('[ProviderManagement] Attempting to fetch data from database...')

      // Check if we can access the supabase client
      if (!supabase) {
        console.error('[ProviderManagement] Supabase client is not available')
        throw new Error('Database connection not available')
      }

      // Log the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('[ProviderManagement] Current session:', session)
      if (sessionError) {
        console.error('[ProviderManagement] Session error:', sessionError)
      }

      // Attempt to fetch providers with error handling
      try {
        console.log('[ProviderManagement] Fetching providers...')
        const { data: providerData, error: providerError } = await supabase
          .from('transportation_providers')
          .select('*')

        if (providerError) {
          console.error('[ProviderManagement] Error fetching providers:', providerError)
          throw providerError
        }
        
        console.log('[ProviderManagement] Raw provider data:', providerData)
        setProviders(providerData || [])
      } catch (providerError) {
        console.error('[ProviderManagement] Provider fetch failed:', providerError)
        throw new Error('Could not fetch providers')
      }

      // Attempt to fetch admins with error handling
      try {
        console.log('[ProviderManagement] Fetching admins...')
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select(`
            *,
            provider:transportation_providers(*)
          `)
          .eq('user_type', 'admin')

        if (adminError) {
          console.error('[ProviderManagement] Error fetching admins:', adminError)
          throw adminError
        }
        
        console.log('[ProviderManagement] Admins fetched:', adminData)
        setAdmins(adminData || [])
      } catch (adminError) {
        console.error('[ProviderManagement] Admin fetch failed:', adminError)
        throw new Error('Could not fetch admins')
      }
    } catch (error) {
      console.error('[ProviderManagement] Error fetching data:', error)
      toast.error('Failed to fetch data - using demo data instead')
      // Load demo data as fallback
      setIsUsingDemoData(true)
      setDemoData()
    } finally {
      setIsLoading(false)
    }
  }

  const setDemoData = () => {
    // Set some sample demo data
    setProviders([
      {
        id: 'demo-1',
        name: 'Demo Provider 1',
        organization_code: 'DEMO1',
        address: '123 Main St',
        city: 'Anytown',
        state: 'IN',
        zip: '47401',
        status: 'active'
      },
      {
        id: 'demo-2',
        name: 'Demo Provider 2',
        organization_code: 'DEMO2',
        address: '456 Oak Ave',
        city: 'Somewhere',
        state: 'IN',
        zip: '47403',
        status: 'inactive'
      }
    ])

    setAdmins([
      {
        id: 'admin-1',
        full_name: 'Demo Admin 1',
        email: 'admin1@example.com',
        phone: '555-123-4567',
        username: 'admin1',
        provider_id: 'demo-1',
        provider: {
          id: 'demo-1',
          name: 'Demo Provider 1',
          organization_code: 'DEMO1',
          address: '123 Main St',
          city: 'Anytown',
          state: 'IN',
          zip: '47401',
          status: 'active'
        },
        status: 'active'
      }
    ])
  }

  const providerForm = useFormHandling<ProviderFormData>({
    initialValues: {
      name: '',
      organization_code: '',
      address: '',
      city: '',
      state: '',
      zip: ''
    },
    validationRules: providerValidationRules,
    onSubmit: async (values) => {
      try {
        console.log('[ProviderManagement] Attempting to create provider:', values)
        const { data, error } = await supabase
          .from('transportation_providers')
          .insert([{
            name: values.name,
            organization_code: values.organization_code,
            address: values.address,
            city: values.city,
            state: values.state,
            zip: values.zip,
            status: 'active'
          }])
          .select()

        if (error) {
          console.error('[ProviderManagement] Error creating provider:', error)
          throw error
        }

        console.log('[ProviderManagement] Provider created successfully:', data)
        toast.success('Transportation provider created successfully')
        setIsProviderDialogOpen(false)
        providerForm.resetForm()
        
        // Reset the fetch attempt flag so we can fetch again
        fetchAttemptedRef.current = false
        fetchData()
      } catch (error) {
        console.error('[ProviderManagement] Error creating provider:', error)
        toast.error('Failed to create provider')
      }
    }
  })

  const adminForm = useFormHandling<AdminFormData>({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      provider_id: undefined
    },
    validationRules: adminValidationRules,
    onSubmit: async (values) => {
      try {
        // Use the selected provider's ID if available
        const providerIdToUse = selectedProvider?.id || values.provider_id;
        
        if (!providerIdToUse) {
          throw new Error('Please select a provider')
        }

        console.log('[ProviderManagement] Creating admin for provider:', providerIdToUse);

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.full_name,
              user_type: 'admin'
            }
          }
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('No user returned from sign up')

        // 2. Create admin profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            username: values.username,
            user_type: 'admin',
            provider_id: providerIdToUse,
            status: 'active'
          })

        if (profileError) throw profileError

        toast.success('Admin account created successfully')
        setIsAdminDialogOpen(false)
        adminForm.resetForm()
        fetchData()
      } catch (error) {
        console.error('Error creating admin:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create admin account')
      }
    }
  })

  const handleStatusToggle = async (provider: Provider) => {
    setProviderToUpdate(provider)
    setIsStatusUpdateDialogOpen(true)
  }

  const handleConfirmStatusUpdate = async () => {
    if (!providerToUpdate) return

    try {
      const newStatus = providerToUpdate.status === 'active' ? 'inactive' : 'active'
      
      // Update provider status
      const { error: providerError } = await supabase
        .from('transportation_providers')
        .update({ status: newStatus })
        .eq('id', providerToUpdate.id)

      if (providerError) throw providerError

      // Update associated admin accounts status
      const { error: adminError } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('provider_id', providerToUpdate.id)
        .eq('user_type', 'admin')

      if (adminError) throw adminError

      toast.success(`Provider ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
      setIsStatusUpdateDialogOpen(false)
      setProviderToUpdate(null)
      fetchData()
    } catch (error) {
      console.error('Error updating provider status:', error)
      toast.error('Failed to update provider status')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Demo data notice */}
      {isUsingDemoData && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-md font-medium text-blue-800">Demo Mode</h3>
          <p className="text-sm text-blue-700 mt-1">
            Showing demo data. In production, this page will display and allow management of actual transportation providers.
          </p>
        </div>
      )}

      {/* Providers Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transportation Providers</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Manage your transportation providers and their administrators
            </p>
          </div>
          <Button onClick={() => setIsProviderDialogOpen(true)}>
            Add New Provider
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Organization Code</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length > 0 ? (
                providers.map((provider) => {
                  const providerAdmins = admins.filter(admin => admin.provider_id === provider.id)
                  return (
                    <TableRow key={provider.id}>
                      <TableCell>{provider.name}</TableCell>
                      <TableCell>{provider.organization_code}</TableCell>
                      <TableCell>
                        {`${provider.address}, ${provider.city}, ${provider.state} ${provider.zip}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={provider.status === 'active' ? 'success' : 'secondary'}>
                            {provider.status}
                          </Badge>
                          <Switch
                            checked={provider.status === 'active'}
                            onCheckedChange={() => handleStatusToggle(provider)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{providerAdmins.length}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProvider(provider)
                              setIsAdminDialogOpen(true)
                            }}
                          >
                            Add Admin
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/providers/${provider.id}/details`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p className="text-muted-foreground">No providers found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsProviderDialogOpen(true)}
                      >
                        Add Your First Provider
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Admins Section with Enhanced Filtering */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Provider Admins</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Manage administrator accounts for all providers
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select
                onValueChange={(value) => {
                  // Add filtering logic here
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => {
                  // Add status filtering logic here
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>{admin.full_name}</TableCell>
                  <TableCell>{admin.username}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.phone}</TableCell>
                  <TableCell>
                    {admin.provider?.name || 'Not assigned'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.status === 'active' ? 'success' : 'secondary'}>
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Add edit admin functionality
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/${admin.id}/activity`}>
                          View Activity
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={isStatusUpdateDialogOpen} onOpenChange={setIsStatusUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Provider Status</AlertDialogTitle>
            <AlertDialogDescription>
              {providerToUpdate?.status === 'active' 
                ? 'This will deactivate the provider and all associated admin accounts. Are you sure?'
                : 'This will reactivate the provider and all associated admin accounts. Are you sure?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsStatusUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={providerToUpdate?.status === 'active' ? 'destructive' : 'default'}
              onClick={handleConfirmStatusUpdate}
            >
              {providerToUpdate?.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Provider Dialog */}
      <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transportation Provider</DialogTitle>
            <DialogDescription>
              Enter the details for the new transportation provider.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              providerForm.handleSubmit(e)
            }} 
            className="space-y-4"
          >
            <FormInput
              label="Provider Name"
              name="name"
              value={providerForm.values.name}
              error={providerForm.errors.name}
              onChange={(e) => providerForm.handleChange('name', e.target.value)}
              required
            />
            <FormInput
              label="Organization Code"
              name="organization_code"
              value={providerForm.values.organization_code}
              error={providerForm.errors.organization_code}
              onChange={(e) => providerForm.handleChange('organization_code', e.target.value)}
              required
              placeholder="e.g., BLOOMINGTON1"
            />
            <FormInput
              label="Address"
              name="address"
              value={providerForm.values.address}
              error={providerForm.errors.address}
              onChange={(e) => providerForm.handleChange('address', e.target.value)}
              required
            />
            <FormInput
              label="City"
              name="city"
              value={providerForm.values.city}
              error={providerForm.errors.city}
              onChange={(e) => providerForm.handleChange('city', e.target.value)}
              required
            />
            <FormInput
              label="State"
              name="state"
              value={providerForm.values.state}
              error={providerForm.errors.state}
              onChange={(e) => providerForm.handleChange('state', e.target.value)}
              required
            />
            <FormInput
              label="ZIP Code"
              name="zip"
              value={providerForm.values.zip}
              error={providerForm.errors.zip}
              onChange={(e) => providerForm.handleChange('zip', e.target.value)}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProviderDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Provider</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
            <DialogDescription>
              Create an admin account for {selectedProvider?.name || 'a transportation provider'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            // Set the provider_id from selectedProvider when form submits
            if (selectedProvider) {
              adminForm.handleChange('provider_id', selectedProvider.id)
            }
            adminForm.handleSubmit(e)
          }} className="space-y-4">
            {!selectedProvider && (
              <Select 
                onValueChange={(value) => adminForm.handleChange('provider_id', value)}
                value={adminForm.values.provider_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FormInput
              label="Full Name"
              name="full_name"
              value={adminForm.values.full_name}
              error={adminForm.errors.full_name}
              onChange={(e) => adminForm.handleChange('full_name', e.target.value)}
              required
            />
            <FormInput
              label="Username"
              name="username"
              value={adminForm.values.username}
              error={adminForm.errors.username}
              onChange={(e) => adminForm.handleChange('username', e.target.value)}
              required
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={adminForm.values.email}
              error={adminForm.errors.email}
              onChange={(e) => adminForm.handleChange('email', e.target.value)}
              required
            />
            <FormInput
              label="Phone Number"
              name="phone"
              value={adminForm.values.phone}
              error={adminForm.errors.phone}
              onChange={(e) => adminForm.handleChange('phone', e.target.value)}
              required
            />
            <FormInput
              label="Password"
              name="password"
              type="password"
              value={adminForm.values.password}
              error={adminForm.errors.password}
              onChange={(e) => adminForm.handleChange('password', e.target.value)}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Admin</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 