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

interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  status: 'active' | 'inactive'
  organization_code: string
  admin?: {
    id: string
    full_name: string
    email: string
    phone: string
    username: string
  }
}

interface Admin {
  id: string
  full_name: string
  email: string
  phone: string
  username: string
  location_id?: string
  location?: {
    name: string
  }
}

interface LocationFormData {
  name: string
  address: string
  city: string
  state: string
  zip: string
  organization_code: string
}

interface AdminFormData {
  full_name: string
  email: string
  phone: string
  username: string
  password: string
}

const locationValidationRules = {
  name: (value: string) => {
    if (!value) return 'Location name is required'
    if (value.length < 2) return 'Location name must be at least 2 characters'
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
  organization_code: (value: string) => {
    if (!value) return 'Organization code is required'
    if (value.length < 2) return 'Organization code must be at least 2 characters'
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

export function LocationManagement() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch locations with their admins
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select(`
          *,
          admin:profiles(*)
        `)

      if (locationError) throw locationError

      // Fetch all admins with their assigned locations
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select(`
          *,
          location:locations(name)
        `)
        .eq('user_type', 'admin')

      if (adminError) throw adminError

      setLocations(locationData as Location[])
      setAdmins(adminData as Admin[])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  const locationForm = useFormHandling<LocationFormData>({
    initialValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      organization_code: ''
    },
    validationRules: locationValidationRules,
    onSubmit: async (values) => {
      console.log('Submitting location form with values:', values)
      try {
        const { data, error } = await supabase
          .from('locations')
          .insert([{
            name: values.name,
            address: values.address,
            city: values.city,
            state: values.state,
            zip: values.zip,
            organization_code: values.organization_code,
            status: 'active'
          }])
          .select()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        console.log('Location created successfully:', data)
        toast.success('Location created successfully')
        setIsLocationDialogOpen(false)
        locationForm.resetForm()
        fetchData()
      } catch (error) {
        console.error('Error creating location:', error)
        toast.error('Failed to create location')
      }
    }
  })

  const adminForm = useFormHandling<AdminFormData>({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      username: '',
      password: ''
    },
    validationRules: adminValidationRules,
    onSubmit: async (values) => {
      try {
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
            user_type: 'admin'
          })

        if (profileError) throw profileError

        toast.success('Admin account created successfully')
        setIsAdminDialogOpen(false)
        adminForm.resetForm()
        fetchData()
      } catch (error) {
        console.error('Error creating admin:', error)
        toast.error('Failed to create admin account')
      }
    }
  })

  const handleAssignAdmin = async () => {
    if (!selectedLocation || !selectedAdmin) return

    try {
      // Update the admin's profile with the location ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ location_id: selectedLocation.id })
        .eq('id', selectedAdmin.id)

      if (updateError) throw updateError

      // Update the location with the admin ID
      const { error: locationError } = await supabase
        .from('locations')
        .update({ admin_id: selectedAdmin.id })
        .eq('id', selectedLocation.id)

      if (locationError) throw locationError

      toast.success('Admin assigned to location successfully')
      setIsAssignDialogOpen(false)
      setSelectedLocation(null)
      setSelectedAdmin(null)
      fetchData()
    } catch (error) {
      console.error('Error assigning admin:', error)
      toast.error('Failed to assign admin to location')
    }
  }

  const handleDeleteLocation = async () => {
    if (!selectedLocation) return

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', selectedLocation.id)

      if (error) throw error

      toast.success('Location deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedLocation(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting location:', error)
      toast.error('Failed to delete location')
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
      {/* Locations Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Locations</CardTitle>
          <Button onClick={() => setIsLocationDialogOpen(true)}>
            Add New Location
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Admin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>{location.name}</TableCell>
                  <TableCell>
                    {`${location.address}, ${location.city}, ${location.state} ${location.zip}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={location.status === 'active' ? 'success' : 'secondary'}>
                      {location.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {location.admin ? location.admin.full_name : 'No admin assigned'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLocation(location)
                          setIsAssignDialogOpen(true)
                        }}
                      >
                        Assign Admin
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedLocation(location)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Admins Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admins</CardTitle>
          <Button onClick={() => setIsAdminDialogOpen(true)}>
            Add New Admin
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Assigned Location</TableHead>
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
                    {admin.location ? admin.location.name : 'Not assigned'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Enter the details for the new location. The organization code helps identify different transportation teams within the same location.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              locationForm.handleSubmit(e)
            }} 
            className="space-y-4"
          >
            <FormInput
              label="Location Name"
              name="name"
              value={locationForm.values.name}
              error={locationForm.errors.name}
              onChange={(e) => locationForm.handleChange('name', e.target.value)}
              required
            />
            <FormInput
              label="Organization Code"
              name="organization_code"
              value={locationForm.values.organization_code}
              error={locationForm.errors.organization_code}
              onChange={(e) => locationForm.handleChange('organization_code', e.target.value)}
              required
              placeholder="e.g., TEAM1, BLOOMINGTON1"
            />
            <FormInput
              label="Address"
              name="address"
              value={locationForm.values.address}
              error={locationForm.errors.address}
              onChange={(e) => locationForm.handleChange('address', e.target.value)}
              required
            />
            <FormInput
              label="City"
              name="city"
              value={locationForm.values.city}
              error={locationForm.errors.city}
              onChange={(e) => locationForm.handleChange('city', e.target.value)}
              required
            />
            <FormInput
              label="State"
              name="state"
              value={locationForm.values.state}
              error={locationForm.errors.state}
              onChange={(e) => locationForm.handleChange('state', e.target.value)}
              required
            />
            <FormInput
              label="ZIP Code"
              name="zip"
              value={locationForm.values.zip}
              error={locationForm.errors.zip}
              onChange={(e) => locationForm.handleChange('zip', e.target.value)}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Location</Button>
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
              Enter the details for the new admin account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={adminForm.handleSubmit} className="space-y-4">
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

      {/* Assign Admin Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Admin to Location</DialogTitle>
            <DialogDescription>
              Select an admin to assign to {selectedLocation?.name}.
            </DialogDescription>
          </DialogHeader>
          <Select onValueChange={(value) => {
            const admin = admins.find(a => a.id === value)
            setSelectedAdmin(admin || null)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select an admin" />
            </SelectTrigger>
            <SelectContent>
              {admins
                .filter(admin => !admin.location_id || admin.location_id === selectedLocation?.id)
                .map(admin => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.full_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignAdmin} disabled={!selectedAdmin}>
              Assign Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Location Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedLocation?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLocation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 