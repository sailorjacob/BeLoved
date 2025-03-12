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
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'

interface Driver {
  id: string
  full_name: string
  email: string
  phone: string
  username: string
  user_type: string
  provider_id?: string
  organization_code?: string
  driver_profile: {
    status: string
    completed_rides: number
    total_miles: number
  }
}

interface DriverFormData {
  full_name: string
  email: string
  phone: string
  username: string
}

const validationRules = {
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
  }
}

export function DriverManagement({ providerId }: { providerId?: string }) {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null)

  useEffect(() => {
    fetchDrivers()
  }, [providerId])

  const fetchDrivers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          provider:transportation_providers(id, organization_code)
        `)
        .eq('user_role', 'driver');
      
      // Only filter by provider if providerId is provided
      if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map the returned data to include organization_code
      const mappedDrivers = data.map(driver => ({
        ...driver,
        organization_code: driver.organization_code || (driver.provider ? driver.provider.organization_code : undefined)
      }));

      setDrivers(mappedDrivers as Driver[])
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast.error('Failed to fetch drivers')
    } finally {
      setIsLoading(false)
    }
  }

  const { values, errors, handleChange, setValues, handleSubmit } = useFormHandling<DriverFormData>({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      username: ''
    },
    validationRules,
    onSubmit: handleUpdateDriver
  })

  async function handleUpdateDriver(values: DriverFormData) {
    if (!selectedDriver) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          username: values.username,
          organization_code: selectedDriver.organization_code
        })
        .eq('id', selectedDriver.id)

      if (error) throw error

      toast.success('Driver updated successfully')
      setIsEditDialogOpen(false)
      fetchDrivers()
    } catch (error) {
      console.error('Error updating driver:', error)
      toast.error('Failed to update driver')
    }
  }

  const handleEditClick = (driver: Driver) => {
    setSelectedDriver(driver)
    setValues({
      full_name: driver.full_name,
      email: driver.email,
      phone: driver.phone,
      username: driver.username
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (driver: Driver) => {
    setDriverToDelete(driver)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!driverToDelete) return

    try {
      // Delete driver profile first (foreign key constraint)
      const { error: driverProfileError } = await supabase
        .from('driver_profiles')
        .delete()
        .eq('id', driverToDelete.id)

      if (driverProfileError) throw driverProfileError

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', driverToDelete.id)

      if (profileError) throw profileError

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(driverToDelete.id)
      if (authError) throw authError

      toast.success('Driver deleted successfully')
      setIsDeleteDialogOpen(false)
      setDriverToDelete(null)
      fetchDrivers()
    } catch (error) {
      console.error('Error deleting driver:', error)
      toast.error('Failed to delete driver')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e.target.name as keyof DriverFormData, e.target.value)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Driver Management</CardTitle>
          <Button onClick={() => router.push('/create-driver')}>
            Add New Driver
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
                <TableHead>Org Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed Rides</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.full_name}</TableCell>
                  <TableCell>{driver.username}</TableCell>
                  <TableCell>{driver.email}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell className="font-mono">{driver.organization_code || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={driver.driver_profile.status === 'active' ? 'success' : 'secondary'}>
                      {driver.driver_profile.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{driver.driver_profile.completed_rides}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(driver)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(driver)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update the driver's information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Full Name"
              name="full_name"
              value={values.full_name}
              error={errors.full_name}
              onChange={handleInputChange}
              required
            />
            <FormInput
              label="Username"
              name="username"
              value={values.username}
              error={errors.username}
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {driverToDelete?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 