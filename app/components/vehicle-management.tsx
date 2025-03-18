'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { 
  PlusCircle, 
  PencilIcon, 
  Trash2Icon, 
  MoreVertical, 
  CarIcon, 
  AlertCircle, 
  CheckCircleIcon,
  Search
} from 'lucide-react'
import { useFormHandling } from '@/hooks/useFormHandling'
import { format, parseISO, isValid } from 'date-fns'

interface Vehicle {
  id: string
  provider_id: string
  make: string
  model: string
  year: string
  license_plate: string
  vin: string
  status: 'active' | 'maintenance' | 'inactive'
  last_inspection_date: string | null
  insurance_expiry: string | null
  created_at: string
  updated_at: string
  mileage?: number
}

type VehicleForm = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> & { 
  id?: string;
  last_inspection_date: string | null;
  insurance_expiry: string | null;
  mileage?: number;
};

interface VehicleManagementProps {
  providerId: string;
  editVehicleId?: string | null;
}

export function VehicleManagement({ providerId, editVehicleId }: VehicleManagementProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all')

  const vehicleForm = useFormHandling<VehicleForm>({
    initialValues: {
      provider_id: providerId,
      make: '',
      model: '',
      year: '',
      license_plate: '',
      vin: '',
      status: 'active',
      last_inspection_date: null,
      insurance_expiry: null,
      mileage: undefined
    },
    validationRules: {
      make: (value) => !value ? 'Make is required' : undefined,
      model: (value) => !value ? 'Model is required' : undefined,
      year: (value) => {
        if (!value) return 'Year is required'
        if (!/^\d{4}$/.test(value)) return 'Year must be a 4-digit number'
        const year = parseInt(value)
        const currentYear = new Date().getFullYear()
        if (year < 1950 || year > currentYear + 1) return `Year must be between 1950 and ${currentYear + 1}`
        return undefined
      },
      license_plate: (value) => !value ? 'License plate is required' : undefined,
      vin: (value) => {
        if (!value) return 'VIN is required'
        if (value.length !== 17) return 'VIN must be 17 characters'
        return undefined
      },
      status: (value) => !value ? 'Status is required' : undefined,
      last_inspection_date: (value) => {
        if (value && !isValid(parseISO(value))) return 'Invalid date format'
        return undefined
      },
      insurance_expiry: (value) => {
        if (value && !isValid(parseISO(value))) return 'Invalid date format'
        return undefined
      },
      mileage: (value) => {
        if (value !== undefined && value !== null && (isNaN(Number(value)) || Number(value) < 0)) {
          return 'Mileage must be a positive number';
        }
        return undefined;
      }
    },
    onSubmit: async (values) => {
      try {
        setIsLoading(true)
        
        if (selectedVehicle) {
          // Update existing vehicle
          const { error } = await supabase
            .from('vehicles')
            .update({
              make: values.make,
              model: values.model,
              year: values.year,
              license_plate: values.license_plate,
              vin: values.vin,
              status: values.status,
              last_inspection_date: values.last_inspection_date,
              insurance_expiry: values.insurance_expiry,
              mileage: values.mileage,
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedVehicle.id)
            
          if (error) throw error
          
          toast.success('Vehicle updated successfully')
        } else {
          // Create new vehicle
          const { error } = await supabase
            .from('vehicles')
            .insert({
              provider_id: providerId,
              make: values.make,
              model: values.model,
              year: values.year,
              license_plate: values.license_plate,
              vin: values.vin,
              status: values.status,
              last_inspection_date: values.last_inspection_date,
              insurance_expiry: values.insurance_expiry,
              mileage: values.mileage
            })
            
          if (error) throw error
          
          toast.success('Vehicle added successfully')
        }
        
        // Close dialog and refresh vehicles list
        setIsFormDialogOpen(false)
        fetchVehicles()
      } catch (error: any) {
        toast.error(error.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
  })

  useEffect(() => {
    if (providerId) {
      fetchVehicles().then(() => {
        // Handle edit vehicle from URL parameter
        if (editVehicleId && vehicles.length > 0) {
          const vehicleToEdit = vehicles.find(v => v.id === editVehicleId);
          if (vehicleToEdit) {
            handleEditVehicle(vehicleToEdit);
          }
        }
      });
    }
  }, [providerId, editVehicleId, vehicles.length]);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('provider_id', providerId)
        .order('updated_at', { ascending: false })
        
      if (error) throw error
      
      setVehicles(data || [])
      
      if (data && data.length === 0) {
        setError('No vehicles found for this provider. Add your first vehicle using the button above.')
      }
    } catch (error: any) {
      console.error('Error fetching vehicles:', error)
      setError('Failed to load vehicles. Please try again later.')
      toast.error('Failed to load vehicles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddVehicle = () => {
    setSelectedVehicle(null)
    vehicleForm.resetForm()
    vehicleForm.setValues({
      provider_id: providerId,
      make: '',
      model: '',
      year: '',
      license_plate: '',
      vin: '',
      status: 'active',
      last_inspection_date: null,
      insurance_expiry: null,
      mileage: undefined
    })
    setIsFormDialogOpen(true)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    vehicleForm.resetForm()
    vehicleForm.setValues({
      provider_id: vehicle.provider_id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      license_plate: vehicle.license_plate,
      vin: vehicle.vin,
      status: vehicle.status,
      last_inspection_date: vehicle.last_inspection_date,
      insurance_expiry: vehicle.insurance_expiry,
      mileage: vehicle.mileage
    })
    setIsFormDialogOpen(true)
  }

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteVehicle = async () => {
    if (!selectedVehicle) return
    
    try {
      setIsLoading(true)
      
      // Check if vehicle is used in any rides
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('id')
        .eq('vehicle_id', selectedVehicle.id)
        .limit(1)
        
      if (ridesError) throw ridesError
      
      if (ridesData && ridesData.length > 0) {
        toast.error('This vehicle cannot be deleted because it is associated with one or more rides')
        setIsDeleteDialogOpen(false)
        return
      }
      
      // Delete vehicle
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', selectedVehicle.id)
        
      if (error) throw error
      
      toast.success('Vehicle deleted successfully')
      setIsDeleteDialogOpen(false)
      fetchVehicles()
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while deleting the vehicle')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    try {
      const date = parseISO(dateString)
      return format(date, 'MM/dd/yyyy')
    } catch (e) {
      return 'Invalid date'
    }
  }

  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="capitalize">Active</Badge>
      case 'maintenance':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 capitalize">Maintenance</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="capitalize">Inactive</Badge>
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>
    }
  }

  const filteredVehicles = vehicles
    .filter(vehicle => 
      activeTab === 'all' || vehicle.status === activeTab
    )
    .filter(vehicle => 
      searchQuery === '' || 
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.year.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase())
    )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fleet Management</CardTitle>
            <CardDescription>Manage your organization's vehicles</CardDescription>
          </div>
          <Button onClick={handleAddVehicle}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'all' ? "default" : "outline"}
                onClick={() => setActiveTab('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={activeTab === 'active' ? "default" : "outline"}
                onClick={() => setActiveTab('active')}
                size="sm"
              >
                Active
              </Button>
              <Button
                variant={activeTab === 'maintenance' ? "default" : "outline"}
                onClick={() => setActiveTab('maintenance')}
                size="sm"
              >
                Maintenance
              </Button>
              <Button
                variant={activeTab === 'inactive' ? "default" : "outline"}
                onClick={() => setActiveTab('inactive')}
                size="sm"
              >
                Inactive
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{error}</p>
              {error.includes('No vehicles found') && (
                <Button onClick={handleAddVehicle} className="mt-4">
                  Add Your First Vehicle
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Inspection</TableHead>
                  <TableHead>Insurance Expiry</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <CarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-2">No vehicles match your search criteria</p>
                        <Button variant="outline" onClick={() => {
                          setSearchQuery('')
                          setActiveTab('all')
                        }}>
                          Clear Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <Link href={`/admin-dashboard/vehicles/${vehicle.id}`} className="group">
                          <div className="font-medium hover:underline">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-muted-foreground">{vehicle.year}</div>
                        </Link>
                      </TableCell>
                      <TableCell>{vehicle.license_plate}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{vehicle.vin}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell>{formatDate(vehicle.last_inspection_date)}</TableCell>
                      <TableCell>{formatDate(vehicle.insurance_expiry)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditVehicle(vehicle)}>
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteVehicle(vehicle)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2Icon className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedVehicle ? "Edit Vehicle" : "Add New Vehicle"}
            </DialogTitle>
            <DialogDescription>
              {selectedVehicle ? "Update the vehicle details below." : "Fill in the details to add a new vehicle."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            vehicleForm.handleSubmit(e)
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  placeholder="Toyota"
                  value={vehicleForm.values.make}
                  onChange={(e) => vehicleForm.handleChange('make', e.target.value)}
                />
                {vehicleForm.errors.make && (
                  <p className="text-sm text-destructive">{vehicleForm.errors.make}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="Camry"
                  value={vehicleForm.values.model}
                  onChange={(e) => vehicleForm.handleChange('model', e.target.value)}
                />
                {vehicleForm.errors.model && (
                  <p className="text-sm text-destructive">{vehicleForm.errors.model}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  placeholder="2023"
                  value={vehicleForm.values.year}
                  onChange={(e) => vehicleForm.handleChange('year', e.target.value)}
                />
                {vehicleForm.errors.year && (
                  <p className="text-sm text-destructive">{vehicleForm.errors.year}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  placeholder="ABC-123"
                  value={vehicleForm.values.license_plate}
                  onChange={(e) => vehicleForm.handleChange('license_plate', e.target.value)}
                />
                {vehicleForm.errors.license_plate && (
                  <p className="text-sm text-destructive">{vehicleForm.errors.license_plate}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                placeholder="1HGCM82633A123456"
                value={vehicleForm.values.vin}
                onChange={(e) => vehicleForm.handleChange('vin', e.target.value)}
              />
              {vehicleForm.errors.vin && (
                <p className="text-sm text-destructive">{vehicleForm.errors.vin}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={vehicleForm.values.status}
                  onValueChange={(value) => vehicleForm.handleChange('status', value as Vehicle['status'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {vehicleForm.errors.status && (
                  <p className="text-sm text-destructive">{vehicleForm.errors.status}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">Current Mileage (miles)</Label>
                <Input
                  id="mileage"
                  type="number"
                  min="0"
                  placeholder="e.g., 45000"
                  value={vehicleForm.values.mileage?.toString() || ''}
                  onChange={(e) => vehicleForm.handleChange('mileage', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                {vehicleForm.errors.mileage && (
                  <p className="text-sm text-destructive">{vehicleForm.errors.mileage}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last_inspection_date">Last Inspection Date</Label>
                <Input
                  id="last_inspection_date"
                  type="date"
                  value={vehicleForm.values.last_inspection_date || ''}
                  onChange={(e) => vehicleForm.handleChange('last_inspection_date', e.target.value)}
                />
                {vehicleForm.errors.last_inspection_date && (
                  <p className="text-sm text-destructive">{vehicleForm.errors.last_inspection_date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
                <Input
                  id="insurance_expiry"
                  type="date"
                  value={vehicleForm.values.insurance_expiry || ''}
                  onChange={(e) => vehicleForm.handleChange('insurance_expiry', e.target.value)}
                />
                {vehicleForm.errors.insurance_expiry && (
                  <p className="text-sm text-destructive">{vehicleForm.errors.insurance_expiry}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : selectedVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The vehicle will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this vehicle?</p>
            {selectedVehicle && (
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">
                  {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                </p>
                <p className="text-sm text-muted-foreground">
                  License Plate: {selectedVehicle.license_plate}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteVehicle}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 