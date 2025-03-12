"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AdminScheduler } from "./admin-scheduler"
import { DriverProfilePage } from "./driver-profile-page"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  BookOpen, 
  Clock, 
  CalendarDays,
  Grid,
  Building2,
  DollarSign,
  History,
  Ban,
  Target,
  UserCircle,
  CheckCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import { RideDetailView } from "./ride-detail-view"
import { StatsCards } from "./dashboard/stats-cards"
import { RideTrendsChart } from "./dashboard/ride-trends-chart"
import { DriverDirectory } from "./driver-directory"
import { toast } from 'sonner'

type Ride = Database['public']['Tables']['rides']['Row'] & {
  member: Database['public']['Tables']['profiles']['Row']
  driver?: Database['public']['Tables']['profiles']['Row']
}

type Driver = Database['public']['Tables']['profiles']['Row'] & {
  driver_profile?: Database['public']['Tables']['driver_profiles']['Row'] | null
}

interface DriverProfilePageProps {
  driverId: string
  onBack: () => void
}

export function AdminDashboard() {
  const [selectedView, setSelectedView] = useState<'overview' | 'driver' | 'ride'>('overview')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [showAssignedRides, setShowAssignedRides] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [provider, setProvider] = useState<any>(null)
  const [providerLoaded, setProviderLoaded] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log("Initializing admin dashboard...");
        setIsLoading(true);
        setDashboardError(null);
        
        // Get current user's session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          console.error('No session found');
          setDashboardError('No active session found. Please log in again.');
          router.push('/');
          return;
        }

        console.log("Session user ID:", session.user.id);
        
        // Fetch user's profile including provider_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setDashboardError('Failed to load your profile information.');
          throw profileError;
        }

        console.log("Profile with provider_id:", profile?.provider_id);

        if (!profile?.provider_id) {
          console.error('No provider ID found for user');
          setDashboardError('Your account is not associated with any provider organization.');
          return;
        }

        // Fetch provider details
        const { data: providerData, error: providerError } = await supabase
          .from('transportation_providers')
          .select('*')
          .eq('id', profile.provider_id)
          .single();

        if (providerError) {
          console.error('Error fetching provider:', providerError);
          setDashboardError('Failed to load provider details.');
          throw providerError;
        }

        console.log("Provider loaded:", providerData);
        setProvider(providerData);
        setProviderLoaded(true);
        
        // Fetch rides and drivers after provider is set
        await fetchRides(profile.provider_id);
        await fetchDrivers(profile.provider_id);
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error initializing dashboard:', error);
        setDashboardError(`Failed to load dashboard data: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
        toast.error('Failed to load dashboard data');
      }
    }

    initializeDashboard();
  }, [router])

  const fetchRides = async (providerId: string) => {
    try {
      console.log("Fetching rides for provider:", providerId);
      
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          member:profiles!rides_member_id_fkey(*),
          driver:profiles!rides_driver_id_fkey(*)
        `)
        .eq('provider_id', providerId)
        .order('scheduled_pickup_time', { ascending: true });

      if (error) {
        console.error('Error fetching rides:', error);
        return;
      }

      console.log(`Fetched ${data?.length || 0} rides for provider`);
      setRides(data || []);
    } catch (error) {
      console.error('Error in fetchRides:', error);
    }
  }

  const fetchDrivers = async (providerId: string) => {
    try {
      console.log("Fetching drivers for provider:", providerId);
      
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`
          *,
          driver_profile:driver_profiles(*)
        `)
        .eq('user_role', 'driver')
        .eq('provider_id', providerId);

      if (error) {
        console.error('Error fetching drivers:', error);
        return;
      }

      console.log(`Fetched ${data?.length || 0} drivers with status ${status}`);
      console.log("First driver:", data?.[0]);
      
      setDrivers(data as Driver[]);
    } catch (error) {
      console.error('Error in fetchDrivers:', error);
    }
  }

  const assignDriver = async (rideId: string, driverId: string | null) => {
    const { error } = await supabase
      .from('rides')
      .update({
        driver_id: driverId,
        status: driverId ? 'assigned' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)

    if (error) {
      console.error('Error assigning driver:', error)
      return
    }

    fetchRides(provider.id)
  }

  const filteredRides = showAssignedRides
    ? rides.filter((ride) => ride.driver_id)
    : rides.filter((ride) => !ride.driver_id)

  const getDriverRides = (driverName: string) => {
    const allRides = rides.filter((ride) => ride.driver?.full_name === driverName)
    const completedRides = allRides.filter((ride) => ride.status && ride.status === "completed")
    const uncompletedRides = allRides.filter((ride) => ride.status && ride.status !== "completed")
    return { completedRides, uncompletedRides }
  }

  const handleViewSchedule = (driver: Driver) => {
    setSelectedDriver(driver)
  }

  const handleViewDetails = (ride: Ride) => {
    setSelectedRide(ride)
  }

  const handleBackFromDetails = () => {
    setSelectedRide(null)
  }

  const handleBackFromDriver = () => {
    setSelectedDriver(null)
  }

  const handleRideAction = async (rideId: string, newStatus: Ride['status'], milesData?: { start?: number | null; end?: number | null }) => {
    const { error } = await supabase
      .from('rides')
      .update({
        status: newStatus,
        ...(milesData?.start !== undefined && { start_miles: milesData.start }),
        ...(milesData?.end !== undefined && { end_miles: milesData.end }),
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)

    if (error) {
      console.error('Error updating ride:', error)
      return
    }

    fetchRides(provider.id)
  }

  const handleMilesEdit = async (rideId: string, miles: { start?: number | null; end?: number | null }) => {
    const { error } = await supabase
      .from('rides')
      .update({
        ...(miles.start !== undefined && { start_miles: miles.start }),
        ...(miles.end !== undefined && { end_miles: miles.end }),
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)

    if (error) {
      console.error('Error updating ride miles:', error)
    }
  }

  if (selectedView === 'driver' && selectedDriver) {
    return (
      <DriverProfilePage 
        driverId={selectedDriver.id} 
        onBack={handleBackFromDriver} 
      />
    )
  }

  if (selectedRide) {
    return (
      <RideDetailView
        ride={selectedRide}
        onRideAction={handleRideAction}
        onBack={handleBackFromDetails}
        onMilesEdit={handleMilesEdit}
        onClose={handleBackFromDetails}
      />
    )
  }

  return (
    <div className="space-y-8">
      {provider && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{provider.name}</h1>
            <p className="text-muted-foreground">
              {provider.address}, {provider.city}, {provider.state} {provider.zip}
            </p>
          </div>
          {provider.status && (
            <Badge variant={provider.status === 'active' ? 'success' : 'secondary'}>
              {provider.status.toUpperCase()}
            </Badge>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/admin/info" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <BookOpen className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Information Base</span>
            </Link>
            <Link href="/admin/pending" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Clock className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Pending Acceptance</span>
            </Link>
            <Link href="/admin/schedule" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <CalendarDays className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Schedule</span>
            </Link>
            <Link href="/admin/pickboard" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Grid className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Pickboard</span>
            </Link>
            <Link href="/admin/manifest" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Building2 className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Manifest</span>
            </Link>
            <Link href="/admin/invoicing" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <DollarSign className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Invoicing</span>
            </Link>
            <Link href="/admin/history" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <History className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">History</span>
            </Link>
            <Link href="/admin/exclude" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Ban className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Exclude Member</span>
            </Link>
            <Link href="/admin/counties" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Target className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Counties</span>
            </Link>
            <Link href="/admin/calendar" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <UserCircle className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Calendar</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      <StatsCards rides={rides} drivers={drivers} />
      <RideTrendsChart rides={rides} />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Rides This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{rides.length}</p>
              <p className="text-sm text-muted-foreground">
                {format(startOfWeek(new Date()), "MMM d")} - {format(endOfWeek(new Date()), "MMM d, yyyy")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fulfilled Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  <span>Completed Rides</span>
                </div>
                <Badge variant="outline">
                  {rides.filter((ride) => ride.status && (ride.status === 'completed' || ride.status === 'return_completed')).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-yellow-500" />
                  <span>Active Rides</span>
                </div>
                <Badge variant="outline">
                  {rides.length - rides.filter((ride) => ride.status && (ride.status === 'completed' || ride.status === 'return_completed')).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Manage Rides</h2>
          <div className="flex items-center space-x-2">
            <Switch id="assigned-rides" checked={showAssignedRides} onCheckedChange={setShowAssignedRides} />
            <Label htmlFor="assigned-rides">{showAssignedRides ? "Assigned Rides" : "Unassigned Rides"}</Label>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{showAssignedRides ? "Assigned Rides" : "Unassigned Rides"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Appointment Time</TableHead>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRides.map((ride) => (
                  <TableRow key={ride.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ride.member.full_name}</div>
                        <div className="text-sm text-muted-foreground">{ride.member.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ride.scheduled_pickup_time), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(new Date(ride.scheduled_pickup_time).getTime() - 60 * 60 * 1000), "h:mm a")}
                    </TableCell>
                    <TableCell>
                      {ride.status ? (
                        <Badge variant={(ride.status === 'completed' || ride.status === 'return_completed') ? "default" : "secondary"}>
                          {ride.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">UNKNOWN</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ride.driver_id || "unassigned"}
                        onValueChange={(value) => assignDriver(ride.id, value === "unassigned" ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {ride.driver ? ride.driver.full_name : "Unassigned"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(ride)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-8">
          {dashboardError ? (
            <Card>
              <CardContent className="py-4">
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                  <p>{dashboardError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Reload Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-4"></div>
                  <p>Loading driver directory...</p>
                </div>
              </CardContent>
            </Card>
          ) : providerLoaded && provider?.id ? (
            <DriverDirectory 
              providerId={provider.id} 
              onViewProfile={handleViewSchedule} 
              onViewSchedule={handleViewSchedule}
            />
          ) : (
            <Card>
              <CardContent className="py-4">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
                  <p>Cannot load driver directory: Provider information is missing</p>
                  <p className="text-xs mt-2">
                    Debug: Provider loaded status - {providerLoaded ? 'Yes' : 'No'}, 
                    Provider ID - {provider?.id || 'Missing'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

