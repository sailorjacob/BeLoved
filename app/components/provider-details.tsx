'use client'

import { useState, useEffect } from 'react'
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
import { MapPin } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
        <Button
          asChild
        >
          <Link href="/providers-dashboard">
            Back to Providers
          </Link>
        </Button>
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
                            onClick={() => {
                              setSelectedProfile(admin)
                              setIsProfileDialogOpen(true)
                            }}
                          >
                            View Profile
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
                          <Button variant="outline" size="sm">View Details</Button>
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
                            onClick={() => {
                              setSelectedProfile(driver)
                              setIsProfileDialogOpen(true)
                            }}
                          >
                            View Profile
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

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Details</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Personal Information</h3>
                <p className="text-sm">Name: {selectedProfile.full_name}</p>
                <p className="text-sm">Email: {selectedProfile.email}</p>
                <p className="text-sm">Phone: {selectedProfile.phone}</p>
              </div>
              {'license_number' in selectedProfile && (
                <div>
                  <h3 className="font-semibold">License Information</h3>
                  <p className="text-sm">License Number: {selectedProfile.license_number}</p>
                  <p className="text-sm">Expiry: {selectedProfile.license_expiry ? safeFormatDate(selectedProfile.license_expiry) : 'N/A'}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold">Account Status</h3>
                <Badge variant={selectedProfile.status === 'active' ? 'success' : 'secondary'}>
                  {selectedProfile.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 