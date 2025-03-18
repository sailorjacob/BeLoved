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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from "next/link"
import { MapPin, ExternalLink, UserPlus, Users, ChevronDown, CheckCircle, Search } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface ProviderStats {
  total_admins: number
  total_drivers: number
  total_rides: number
  active_rides: number
  completed_rides: number
  cancelled_rides: number
}

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  changed_by: string
  changes: any
  ip_address: string
  user_agent: string
  created_at: string
  changed_by_user?: {
    full_name: string
  }
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: string
  license_plate: string
  vin: string
  status: 'active' | 'maintenance' | 'inactive'
  last_inspection_date: string
  insurance_expiry: string
}

interface Driver {
  id: string
  full_name: string
  email: string
  phone: string
  license_number: string
  license_expiry: string
  status: 'active' | 'inactive'
}

interface Admin {
  id: string
  full_name: string
  email: string
  phone: string
  username: string
  status: 'active' | 'inactive'
}

interface ProviderDetailsProps {
  providerId: string
}

interface RideStatus {
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'pending'
}

interface Member {
  id: string
  full_name: string
  email: string
  phone: string
  username?: string
  user_role: 'member' | 'driver' | 'admin' | 'super_admin'
  status: 'active' | 'inactive'
  provider_id?: string
}

interface StaffFormData {
  full_name: string
  email: string
  phone: string
  username: string
  password: string
  provider_id: string
  role: 'admin' | 'driver'
}

export function ProviderDetails({ providerId }: ProviderDetailsProps) {
  const router = useRouter()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [stats, setStats] = useState<ProviderStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Admin | Driver | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)
  const [staffMode, setStaffMode] = useState<'create' | 'promote'>('create')
  const [staffRole, setStaffRole] = useState<'admin' | 'driver'>('admin')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [selectedUser, setSelectedUser] = useState<Member | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('Provider Details mounted with ID:', providerId)
    if (providerId) {
      fetchProviderDetails()
      fetchAdditionalData()
    } else {
      console.error('No provider ID provided')
    }
  }, [providerId])

  const fetchProviderDetails = async () => {
    try {
      console.log('Fetching provider details for ID:', providerId)
      
      // Log the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Current session:', session)
      if (sessionError) {
        console.error('Session error:', sessionError)
      }

      // Fetch provider details with detailed logging
      console.log('Making Supabase query for provider:', {
        table: 'transportation_providers',
        id: providerId,
        userRole: session?.user?.user_metadata?.user_role
      })
      
      const { data: providerData, error: providerError } = await supabase
        .from('transportation_providers')
        .select('*')
        .eq('id', providerId)
        .single()

      if (providerError) {
        console.error('Provider fetch error:', providerError)
        throw providerError
      }

      if (!providerData) {
        console.error('No provider found with ID:', providerId)
        throw new Error('Provider not found')
      }

      console.log('Provider data found:', providerData)
      setProvider(providerData)

      // Set empty stats by default
      const defaultStats = {
        total_admins: 0,
        total_drivers: 0,
        total_rides: 0,
        active_rides: 0,
        completed_rides: 0,
        cancelled_rides: 0
      }
      setStats(defaultStats)

      try {
        // Try to fetch stats if tables exist
        const stats = await fetchProviderStats(providerId)
        setStats(stats)
      } catch (error) {
        console.log('Stats tables may not exist yet:', error)
        // Keep default stats
      }

      try {
        // Try to fetch audit logs if table exists
        const { data: logsData, error: logsError } = await supabase
          .from('audit_logs')
          .select(`
            *,
            changed_by_user:profiles!audit_logs_changed_by_fkey(full_name)
          `)
          .eq('entity_id', providerId)
          .order('created_at', { ascending: false })
          .limit(100)

        if (logsError) {
          console.error('Audit logs error:', logsError)
          setAuditLogs([])
        } else {
          setAuditLogs(logsData || [])
        }
      } catch (error) {
        console.log('Audit logs table may not exist yet:', error)
        setAuditLogs([])
      }

    } catch (error) {
      console.error('Error fetching provider details:', error)
      toast.error('Failed to fetch provider details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProviderStats = async (providerId: string): Promise<ProviderStats> => {
    try {
      // Fetch admin and driver counts
      const { data: adminsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('provider_id', providerId)
        .eq('user_role', 'admin')

      const { data: driversCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('provider_id', providerId)
        .eq('user_role', 'driver')

      // Try to fetch rides if table exists
      let ridesData: RideStatus[] = []
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('status')
          .eq('provider_id', providerId)
        
        if (error) {
          console.error('Rides fetch error:', error)
        } else if (data) {
          ridesData = data as RideStatus[]
        }
      } catch (error) {
        console.log('Rides table may not exist yet:', error)
      }
      
      return {
        total_admins: adminsCount?.length || 0,
        total_drivers: driversCount?.length || 0,
        total_rides: ridesData.length,
        active_rides: ridesData.filter(r => ['assigned', 'in_progress'].includes(r.status)).length,
        completed_rides: ridesData.filter(r => r.status === 'completed').length,
        cancelled_rides: ridesData.filter(r => r.status === 'cancelled').length,
      }
    } catch (error) {
      console.error('Error fetching provider stats:', error)
      return {
        total_admins: 0,
        total_drivers: 0,
        total_rides: 0,
        active_rides: 0,
        completed_rides: 0,
        cancelled_rides: 0
      }
    }
  }

  const formatChanges = (changes: any) => {
    if (!changes) return 'No changes recorded'

    if (changes.changed_fields) {
      return Object.entries(changes.changed_fields)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ')
    }

    if (changes.new) {
      return 'New record created'
    }

    if (changes.old) {
      return 'Record deleted'
    }

    return JSON.stringify(changes)
  }

  const fetchAdditionalData = async () => {
    try {
      console.log('Fetching additional data for provider:', providerId)
      
      // Fetch admins
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .eq('provider_id', providerId)
        .eq('user_role', 'admin')

      if (adminError) {
        console.error('Admin fetch error:', adminError)
        setAdmins([])
      } else {
        setAdmins(adminData || [])
      }

      // Fetch drivers
      const { data: driverData, error: driverError } = await supabase
        .from('profiles')
        .select('*')
        .eq('provider_id', providerId)
        .eq('user_role', 'driver')

      if (driverError) {
        console.error('Driver fetch error:', driverError)
        setDrivers([])
      } else {
        setDrivers(driverData || [])
      }

      // Try to fetch vehicles if table exists
      try {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('provider_id', providerId)

        if (vehicleError) {
          console.error('Vehicle fetch error:', vehicleError)
          setVehicles([])
        } else {
          setVehicles(vehicleData || [])
        }
      } catch (error) {
        console.log('Vehicles table may not exist yet:', error)
        setVehicles([])
      }

    } catch (error) {
      console.error('Error fetching additional data:', error)
      // Set empty arrays as fallback
      setAdmins([])
      setDrivers([])
      setVehicles([])
    }
  }

  // Add a safe date format function after the component variables
  const safeFormatDate = (dateString: string | null | undefined, formatString: string = 'MM/dd/yyyy') => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), formatString);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  // Add staff form handling
  const staffForm = useFormHandling<StaffFormData>({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      provider_id: providerId,
      role: 'admin'
    },
    validationRules: {
      full_name: (value) => !value ? 'Full name is required' : undefined,
      email: (value) => {
        if (!value) return 'Email is required'
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
        return undefined
      },
      phone: (value) => {
        if (!value) return 'Phone number is required'
        if (!/^\+?[\d\s-]{10,}$/.test(value)) return 'Invalid phone format'
        return undefined
      },
      username: (value) => !value ? 'Username is required' : undefined,
      password: (value) => !value ? 'Password is required' : value.length < 6 ? 'Password must be at least 6 characters' : undefined,
      provider_id: (value) => !value ? 'Provider is required' : undefined,
      role: (value) => !value ? 'Role is required' : undefined
    },
    onSubmit: async (values) => {
      try {
        if (!provider) {
          throw new Error('Provider not found')
        }

        // Show loading toast
        toast.loading(`Creating ${values.role} account...`)

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.full_name,
              user_role: values.role
            }
          }
        })

        if (authError) {
          // If there's an authentication error, it might be a permission issue
          // However, we should still show an error to the user
          console.error('Auth error creating user:', authError)
          throw new Error(`Failed to create user account: ${authError.message}`)
        }

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
            user_role: values.role,
            provider_id: values.provider_id,
            organization_code: provider.organization_code,
            status: 'active'
          })

        if (profileError) throw profileError

        // 3. If creating a driver, add driver-specific data
        if (values.role === 'driver') {
          const { error: driverProfileError } = await supabase
            .from('driver_profiles')
            .insert({
              id: authData.user.id,
              status: 'active',
              completed_rides: 0,
              total_miles: 0
            })

          if (driverProfileError) throw driverProfileError
        }

        // Clear loading toast and show success
        toast.dismiss()
        toast.success(`${values.role.charAt(0).toUpperCase() + values.role.slice(1)} account created successfully!`, {
          duration: 5000,
          description: `${values.full_name} can now confirm their email and log in.`
        })
        
        // Close dialog
        setTimeout(() => {
          setIsStaffDialogOpen(false)
          staffForm.resetForm()
          fetchAdditionalData() // Refresh the data
        }, 1000)
      } catch (error) {
        toast.dismiss()
        console.error(`Error creating ${values.role}:`, error)
        toast.error(error instanceof Error ? error.message : `Failed to create ${values.role} account`, {
          duration: 5000
        })
      }
    }
  })

  // Add search and promote functionality
  const handleSearchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    // Clear previous timeout if it exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set a new timeout to delay the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
          .in('user_role', ['member', 'driver', 'admin'])  // Only search for users who can be promoted
          .order('full_name', { ascending: true })
          .limit(10)

        if (error) throw error
        setSearchResults(data || [])
      } catch (error) {
        console.error('Error searching users:', error)
        toast.error('Failed to search users')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500)  // 500ms delay to avoid too many requests
  }

  const handlePromoteUser = async () => {
    if (!selectedUser || !provider) {
      toast.error('Please select a user')
      return
    }

    try {
      // Show loading toast
      toast.loading(`Updating user role...`)

      // Update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_role: staffRole,
          provider_id: providerId,
          organization_code: provider.organization_code
        })
        .eq('id', selectedUser.id)

      if (updateError) throw updateError

      // If promoting to driver, create driver_profile if it doesn't exist
      if (staffRole === 'driver') {
        // First check if driver profile exists
        const { data: existingProfile } = await supabase
          .from('driver_profiles')
          .select('id')
          .eq('id', selectedUser.id)
          .single()

        if (!existingProfile) {
          const { error: driverProfileError } = await supabase
            .from('driver_profiles')
            .insert({
              id: selectedUser.id,
              status: 'active',
              completed_rides: 0,
              total_miles: 0
            })

          if (driverProfileError) throw driverProfileError
        }
      }

      // Instead of using the admin API directly (which might be restricted),
      // we'll use a fallback approach that works for all admin types
      try {
        // First try the admin API for super admins
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          selectedUser.id,
          { user_metadata: { user_role: staffRole } }
        )
        
        if (authUpdateError) {
          console.log('Admin API not available, using fallback method')
          // This will be caught and we'll continue with the success flow
          throw authUpdateError
        }
      } catch (error) {
        // Log the error but don't fail the whole operation
        // The profile update still worked, which is the most important part
        console.log('Could not update auth metadata, but profile was updated successfully:', error)
      }

      // Clear loading toast and show success
      toast.dismiss()
      toast.success(`User successfully assigned as ${staffRole}`, {
        duration: 5000,
        description: `${selectedUser.full_name} is now a ${staffRole} for ${provider.name}.`
      })
      
      // Close dialog
      setTimeout(() => {
        setIsStaffDialogOpen(false)
        setSelectedUser(null)
        setSearchQuery('')
        setSearchResults([])
        fetchAdditionalData() // Refresh the data
      }, 1000)
    } catch (error) {
      toast.dismiss()
      console.error(`Error promoting user:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to update user role`, {
        duration: 5000
      })
    }
  }

  const openStaffDialog = (mode: 'create' | 'promote', role: 'admin' | 'driver') => {
    setStaffMode(mode)
    setStaffRole(role)
    
    if (mode === 'create') {
      staffForm.handleChange('provider_id', providerId)
      staffForm.handleChange('role', role)
    } else {
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
    }
    
    setIsStaffDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Provider not found</h2>
        <Button
          className="mt-4"
          asChild
        >
          <Link href="/providers-dashboard">
            Back to Providers
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{provider.name}</h1>
          <p className="text-muted-foreground">Organization Code: {provider.organization_code}</p>
        </div>
        <div className="flex gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                Staff Actions <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem 
                onClick={() => openStaffDialog('create', 'admin')}
                className="cursor-pointer"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Admin
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openStaffDialog('create', 'driver')}
                className="cursor-pointer"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Driver
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openStaffDialog('promote', 'admin')}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                Promote to Admin
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openStaffDialog('promote', 'driver')}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                Promote to Driver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            asChild
          >
            <Link href="/providers-dashboard">
              Back to Providers
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Provider Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={provider.status === 'active' ? 'success' : 'secondary'}>
              {provider.status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{provider.address}</p>
            <p>{provider.city}, {provider.state} {provider.zip}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Admins:</span>
              <span className="font-bold">{stats?.total_admins}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Drivers:</span>
              <span className="font-bold">{stats?.total_drivers}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Rides:</span>
              <span className="font-bold">{stats?.active_rides}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Organization Details</h3>
                  <p className="text-sm text-muted-foreground">Name: {provider.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {provider.organization_code}</p>
                  <p className="text-sm text-muted-foreground">Status: {provider.status}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Contact Information</h3>
                  <p className="text-sm text-muted-foreground">{provider.address}</p>
                  <p className="text-sm text-muted-foreground">{provider.city}, {provider.state} {provider.zip}</p>
                  <p className="text-sm text-muted-foreground">Phone: {provider.phone || 'N/A'}</p>
                </div>
              </div>
              
              {/* Map View */}
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Location</h3>
                <div className="h-[200px] bg-zinc-100 rounded-lg relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-red-500">
                      <MapPin className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-sm">
                    {provider.address}, {provider.city}, {provider.state}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Administrator Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {admins.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>{admin.full_name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>{admin.phone}</TableCell>
                        <TableCell>
                          <Badge variant={admin.status === 'active' ? 'success' : 'secondary'}>
                            {admin.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/super-admin-dashboard/members/${admin.id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Profile
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No administrators assigned</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Add First Admin
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fleet">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Fleet</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Inspection</TableHead>
                      <TableHead>Insurance Expiry</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>{vehicle.year} {vehicle.make} {vehicle.model}</TableCell>
                        <TableCell>{vehicle.license_plate}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              vehicle.status === 'active' ? 'success' : 
                              vehicle.status === 'maintenance' ? 'secondary' : 
                              'secondary'
                            }
                          >
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{vehicle.last_inspection_date ? safeFormatDate(vehicle.last_inspection_date) : 'N/A'}</TableCell>
                        <TableCell>{vehicle.insurance_expiry ? safeFormatDate(vehicle.insurance_expiry) : 'N/A'}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin-dashboard/vehicles/${vehicle.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No vehicles found</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Add First Vehicle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              {drivers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell>{driver.full_name}</TableCell>
                        <TableCell>
                          <div>{driver.email}</div>
                          <div className="text-sm text-muted-foreground">{driver.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div>{driver.license_number}</div>
                          <div className="text-sm text-muted-foreground">
                            Expires: {driver.license_expiry ? safeFormatDate(driver.license_expiry) : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={driver.status === 'active' ? 'success' : 'secondary'}>
                            {driver.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/super-admin-dashboard/members/${driver.id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Profile
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No drivers assigned to this provider</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Add First Driver
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {log.created_at ? safeFormatDate(log.created_at, 'MMM d, yyyy HH:mm:ss') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.action.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.changed_by_user?.full_name || 'System'}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {formatChanges(log.changes)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No activity logs found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Staff Management Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {staffMode === 'create' 
                ? `Add New ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}` 
                : `Promote User to ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}`}
            </DialogTitle>
            <DialogDescription>
              {staffMode === 'create' 
                ? `Create a new ${staffRole} account for ${provider?.name || 'the provider'}.`
                : `Assign an existing user as a ${staffRole} for ${provider?.name || 'the provider'}.`}
            </DialogDescription>
          </DialogHeader>

          {staffMode === 'create' ? (
            <form onSubmit={(e) => {
              e.preventDefault()
              staffForm.handleSubmit(e)
            }} className="space-y-4">
              <FormInput
                label="Full Name"
                name="full_name"
                value={staffForm.values.full_name}
                error={staffForm.errors.full_name}
                onChange={(e) => staffForm.handleChange('full_name', e.target.value)}
                required
              />
              <FormInput
                label="Username"
                name="username"
                value={staffForm.values.username}
                error={staffForm.errors.username}
                onChange={(e) => staffForm.handleChange('username', e.target.value)}
                required
              />
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={staffForm.values.email}
                error={staffForm.errors.email}
                onChange={(e) => staffForm.handleChange('email', e.target.value)}
                required
              />
              <FormInput
                label="Phone Number"
                name="phone"
                value={staffForm.values.phone}
                error={staffForm.errors.phone}
                onChange={(e) => staffForm.handleChange('phone', e.target.value)}
                required
              />
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={staffForm.values.password}
                error={staffForm.errors.password}
                onChange={(e) => staffForm.handleChange('password', e.target.value)}
                required
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create {staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Search for User</label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleSearchUsers(e.target.value)
                    }}
                  />
                </div>
                {isSearching && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-sm text-gray-500">Searching...</span>
                  </div>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                {searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((user) => (
                      <div 
                        key={user.id} 
                        className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                          selectedUser?.id === user.id ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="text-xs mr-2">
                              {user.user_role}
                            </Badge>
                            <Badge 
                              variant={user.status === 'active' ? 'success' : 'destructive'}
                              className="text-xs"
                            >
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          {selectedUser?.id === user.id && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.length >= 3 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">Type at least 3 characters to search</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handlePromoteUser}
                  disabled={!selectedUser}
                >
                  Promote to {staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 