'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { NavigationManager } from "@/app/contexts/auth-context"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Provider {
  id: string
  name: string
  organization_code: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
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
  organization_code?: string
  status: 'active' | 'inactive'
  member_id?: string
  user_role: 'admin' | 'super_admin'
}

interface ProviderFormData {
  name: string
  organization_code: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
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
  },
  phone: (value: string) => {
    if (!value) return 'Phone number is required'
    if (!/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value)) 
      return 'Invalid phone number format (e.g., 555-123-4567)'
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

// Add organization code for drivers too
// For example:
//
// interface Driver {
//   id: string
//   full_name: string
//   email: string
//   phone: string
//   provider_id?: string
//   organization_code?: string  // Add organization code from provider
//   status: 'active' | 'inactive'
//   member_id?: string
//   // ... other driver fields
// }
//
// When creating or updating drivers, make sure to store the organization_code
// from their associated provider, similar to how admins are handled.
// This will ensure consistent organization across the application.

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
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isEditProviderDialogOpen, setIsEditProviderDialogOpen] = useState(false)
  const [providerToEdit, setProviderToEdit] = useState<Provider | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
      setError(null)

      // Fetch providers
      const { data: providersData, error: providersError } = await supabase
        .from('transportation_providers')
        .select('*')
        .order('name')
      
      if (providersError) throw providersError
      
      // Map providers to proper format
      const mappedProviders = providersData.map(provider => ({
        id: provider.id,
        name: provider.name,
        organization_code: provider.organization_code,
        address: provider.address,
        city: provider.city,
        state: provider.state,
        zip: provider.zip,
        phone: provider.phone,
        status: provider.status
      }))
      
      setProviders(mappedProviders)
      
      // Fetch admins - Note: in a real app, you'd fetch admin users differently
      // This is just fetching all users with admin/super_admin roles from profiles table
      const { data: adminsData, error: adminsError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          user_role,
          provider_id,
          status,
          member_id,
          organization_code
        `)
        .in('user_role', ['admin', 'super_admin'])
      
      if (adminsError) throw adminsError
      
      // Map admin profiles to the required format
      const mappedAdmins = adminsData.map(admin => {
        const provider = mappedProviders.find(p => p.id === admin.provider_id)
        
        return {
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          phone: admin.phone,
          username: admin.email.split('@')[0], // Just use the first part of email as username
          provider_id: admin.provider_id,
          provider: provider,
          organization_code: admin.organization_code || provider?.organization_code,
          status: admin.status || 'active',
          member_id: admin.member_id,
          user_role: admin.user_role
        }
      })
      
      setAdmins(mappedAdmins)
    } catch (error) {
      console.error('[ProviderManagement] Error fetching data:', error)
      toast.error('Failed to fetch data - using demo data instead')
      setError('Failed to fetch provider data. Using demo data instead.')
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
        phone: '555-123-4567',
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
        phone: '555-234-5678',
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
        organization_code: 'DEMO1',
        provider: {
          id: 'demo-1',
          name: 'Demo Provider 1',
          organization_code: 'DEMO1',
          address: '123 Main St',
          city: 'Anytown',
          state: 'IN',
          zip: '47401',
          phone: '555-123-4567',
          status: 'active'
        },
        status: 'active',
        member_id: 'A100001',
        user_role: 'admin'
      },
      {
        id: 'admin-2',
        full_name: 'Demo Admin 2',
        email: 'admin2@example.com',
        phone: '555-234-5678',
        username: 'admin2',
        provider_id: 'demo-2',
        organization_code: 'DEMO2',
        provider: {
          id: 'demo-2',
          name: 'Demo Provider 2',
          organization_code: 'DEMO2',
          address: '456 Oak Ave',
          city: 'Somewhere',
          state: 'IN',
          zip: '47403',
          phone: '555-234-5678',
          status: 'inactive'
        },
        status: 'active',
        member_id: 'A100002',
        user_role: 'admin'
      },
      {
        id: 'admin-3',
        full_name: 'Super Admin',
        email: 'superadmin@example.com',
        phone: '555-345-6789',
        username: 'superadmin',
        provider_id: undefined,
        organization_code: 'SYSTEM',
        status: 'active',
        member_id: 'SA100001',
        user_role: 'super_admin'
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
      zip: '',
      phone: ''
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
            phone: values.phone,
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

        // Get the provider object to access its organization_code
        const provider = providers.find(p => p.id === providerIdToUse);
        if (!provider) {
          throw new Error('Provider not found')
        }

        console.log('[ProviderManagement] Creating admin for provider:', providerIdToUse);

        // Show processing state
        toast.loading('Creating admin account...')

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
            provider_id: providerIdToUse,
            organization_code: provider.organization_code,
            status: 'active'
          })

        if (profileError) throw profileError

        // Clear loading toast and show success
        toast.dismiss()
        toast.success('Admin account created successfully! A confirmation email has been sent.', {
          duration: 5000,
          description: `${values.full_name} can now confirm their email and log in.`
        })
        
        // Close dialog with a slight delay for better UX
        setTimeout(() => {
          setIsAdminDialogOpen(false)
          adminForm.resetForm()
          fetchData()
        }, 1000)
      } catch (error) {
        // Clear loading toast and show error
        toast.dismiss()
        console.error('Error creating admin:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create admin account', {
          duration: 5000
        })
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

  const handleEditProvider = async (values: ProviderFormData) => {
    if (!providerToEdit) return

    try {
      console.log('[ProviderManagement] Attempting to update provider:', values)
      const { error } = await supabase
        .from('transportation_providers')
        .update({
          name: values.name,
          organization_code: values.organization_code,
          address: values.address,
          city: values.city,
          state: values.state,
          zip: values.zip,
          phone: values.phone
        })
        .eq('id', providerToEdit.id)

      if (error) {
        console.error('[ProviderManagement] Error updating provider:', error)
        throw error
      }

      toast.success('Transportation provider updated successfully')
      setIsEditProviderDialogOpen(false)
      // Reset the fetch attempt flag so we can fetch again
      fetchAttemptedRef.current = false
      fetchData()
    } catch (error) {
      console.error('[ProviderManagement] Error updating provider:', error)
      toast.error('Failed to update provider')
    }
  }

  const handleDeleteProvider = async () => {
    if (!providerToEdit) return

    try {
      setIsDeleting(true)
      setDeleteError(null)

      // First verify the super admin password
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw new Error("Authentication error")
      
      // Verify the password with Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: deletePassword
      })

      if (signInError) {
        setDeleteError("Incorrect password. Please try again.")
        return
      }

      // Check if this provider has any admins
      const providerAdmins = admins.filter(admin => admin.provider_id === providerToEdit.id)
      
      if (providerAdmins.length > 0) {
        throw new Error("Cannot delete provider with active admins. Please reassign or delete the admin accounts first.")
      }

      // Delete the provider
      const { error: deleteError } = await supabase
        .from('transportation_providers')
        .delete()
        .eq('id', providerToEdit.id)

      if (deleteError) throw deleteError

      toast.success('Provider deleted successfully')
      setIsDeleteDialogOpen(false)
      setIsEditProviderDialogOpen(false)
      fetchAttemptedRef.current = false
      fetchData()
    } catch (error: any) {
      console.error('[ProviderManagement] Error deleting provider:', error)
      setDeleteError(error.message || 'Failed to delete provider')
      toast.error(error.message || 'Failed to delete provider')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                      <TableCell className="font-medium">
                        <Link 
                          href={`/provider/${provider.id}/details`}
                          className="text-foreground font-bold hover:underline transition-colors"
                        >
                          {provider.name}
                        </Link>
                      </TableCell>
                      <TableCell>{provider.organization_code}</TableCell>
                      <TableCell>
                        {`${provider.address}, ${provider.city}, ${provider.state} ${provider.zip}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={provider.status === 'active' ? 'success' : 'secondary'}>
                          {provider.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{providerAdmins.length}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProviderToEdit(provider)
                              setIsEditProviderDialogOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={provider.status === 'active' ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleStatusToggle(provider)}
                          >
                            {provider.status === 'active' ? 'Deactivate' : 'Activate'}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Provider Admins</CardTitle>
              <CardDescription>
                View and manage administrator accounts for all providers
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-auto max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mr-2"></div>
              <span>Loading admins...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                {filteredAdmins.length} {filteredAdmins.length === 1 ? 'admin' : 'admins'} found
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Org Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No admins found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-mono">{admin.member_id || '-'}</TableCell>
                          <TableCell className="font-bold">
                            <Link 
                              href={`/super-admin-dashboard/members/${admin.id}`}
                              className="text-foreground hover:underline transition-colors"
                            >
                              {admin.full_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              admin.user_role === 'super_admin' ? 'purple' : 'outline'
                            }>
                              {admin.user_role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={admin.status === 'active' ? 'success' : 'destructive'}>
                              {admin.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                          <TableCell className="text-muted-foreground">{admin.phone}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {admin.provider?.name || 'Not assigned'}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono">
                            {admin.organization_code || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
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
            <FormInput
              label="Phone Number"
              name="phone"
              value={providerForm.values.phone}
              error={providerForm.errors.phone}
              onChange={(e) => providerForm.handleChange('phone', e.target.value)}
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

      {/* Edit Provider Dialog */}
      <Dialog open={isEditProviderDialogOpen} onOpenChange={setIsEditProviderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transportation Provider</DialogTitle>
            <DialogDescription>
              Update the details for the selected provider.
            </DialogDescription>
          </DialogHeader>
          {providerToEdit && (
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                // Use the values directly from the form elements
                const formData: ProviderFormData = {
                  name: (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value,
                  organization_code: (e.currentTarget.elements.namedItem('organization_code') as HTMLInputElement).value,
                  address: (e.currentTarget.elements.namedItem('address') as HTMLInputElement).value,
                  city: (e.currentTarget.elements.namedItem('city') as HTMLInputElement).value,
                  state: (e.currentTarget.elements.namedItem('state') as HTMLInputElement).value,
                  zip: (e.currentTarget.elements.namedItem('zip') as HTMLInputElement).value,
                  phone: (e.currentTarget.elements.namedItem('phone') as HTMLInputElement).value
                }
                handleEditProvider(formData)
              }} 
              className="space-y-4"
            >
              <FormInput
                label="Provider Name"
                name="name"
                defaultValue={providerToEdit.name}
                required
              />
              <FormInput
                label="Organization Code"
                name="organization_code"
                defaultValue={providerToEdit.organization_code}
                required
                placeholder="e.g., BLOOMINGTON1"
              />
              <FormInput
                label="Address"
                name="address"
                defaultValue={providerToEdit.address}
                required
              />
              <FormInput
                label="City"
                name="city"
                defaultValue={providerToEdit.city}
                required
              />
              <FormInput
                label="State"
                name="state"
                defaultValue={providerToEdit.state}
                required
              />
              <FormInput
                label="ZIP Code"
                name="zip"
                defaultValue={providerToEdit.zip}
                required
              />
              <FormInput
                label="Phone Number"
                name="phone"
                defaultValue={providerToEdit.phone}
                required
              />
              <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Delete Provider
                </Button>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditProviderDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Provider</Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Provider Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the provider and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="font-medium">
              Are you sure you want to delete {providerToEdit?.name}?
            </p>
            
            <div className="border rounded-md p-4 bg-muted/50">
              <p className="text-sm font-medium mb-2">Please enter your super admin password to confirm:</p>
              <FormInput
                type="password"
                label="Password"
                name="deletePassword"
                id="deletePassword"
                value={deletePassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeletePassword(e.target.value)}
                placeholder="Enter password to confirm"
                required
              />
              {deleteError && (
                <p className="text-sm text-destructive mt-2">{deleteError}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProvider}
              disabled={!deletePassword || isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Deleting...
                </>
              ) : (
                "Delete Provider"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 