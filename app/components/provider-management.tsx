'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch providers
      const { data: providerData, error: providerError } = await supabase
        .from('transportation_providers')
        .select('*')

      if (providerError) throw providerError

      // Fetch admins with their provider details
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select(`
          *,
          provider:transportation_providers(*)
        `)
        .eq('user_role', 'admin')

      if (adminError) throw adminError

      setProviders(providerData)
      setAdmins(adminData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
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

        if (error) throw error

        toast.success('Transportation provider created successfully')
        setIsProviderDialogOpen(false)
        providerForm.resetForm()
        fetchData()
      } catch (error) {
        console.error('Error creating provider:', error)
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
        if (!values.provider_id) {
          throw new Error('Please select a provider')
        }

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.full_name,
              user_role: 'admin'
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
            user_role: 'admin',
            provider_id: values.provider_id,
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
        .eq('user_role', 'admin')

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
              {providers.map((provider) => {
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
                          onClick={() => router.push(`/providers/${provider.id}/details`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
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
                        onClick={() => router.push(`/admin/${admin.id}/activity`)}
                      >
                        View Activity
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