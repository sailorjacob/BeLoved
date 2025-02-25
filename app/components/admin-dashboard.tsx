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
  UserCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import { RideDetailView } from "./ride-detail-view"
import { StatsCards } from "./dashboard/stats-cards"
import { RideTrendsChart } from "./dashboard/ride-trends-chart"

type Ride = Database['public']['Tables']['rides']['Row'] & {
  member: Database['public']['Tables']['profiles']['Row']
  driver?: Database['public']['Tables']['profiles']['Row']
}

type Driver = Database['public']['Tables']['profiles']['Row'] & {
  driver_profile: Database['public']['Tables']['driver_profiles']['Row']
}

export function AdminDashboard() {
  const [rides, setRides] = useState<Ride[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [showAssignedRides, setShowAssignedRides] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchRides()
    fetchDrivers()
  }, [])

  const fetchRides = async () => {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        member:profiles!rides_member_id_fkey(*),
        driver:profiles!rides_driver_id_fkey(*)
      `)
      .order('scheduled_pickup_time', { ascending: true })

    if (error) {
      console.error('Error fetching rides:', error)
      return
    }

    setRides(data)
    setIsLoading(false)
  }

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        driver_profile:driver_profiles(*)
      `)
      .eq('user_type', 'driver')

    if (error) {
      console.error('Error fetching drivers:', error)
      return
    }

    setDrivers(data as Driver[])
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

    fetchRides()
  }

  const filteredRides = showAssignedRides
    ? rides.filter((ride) => ride.driver_id)
    : rides.filter((ride) => !ride.driver_id)

  const getDriverRides = (driverName: string) => {
    const allRides = rides.filter((ride) => ride.driver_id === driverName)
    const completedRides = allRides.filter((ride) => ride.status === "completed")
    const uncompletedRides = allRides.filter((ride) => ride.status !== "completed")
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

    fetchRides()
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

  if (isLoading) {
    return <div>Loading...</div>
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

  if (selectedDriver) {
    return (
      <DriverProfilePage
        driverId={selectedDriver.id}
        onBack={handleBackFromDriver}
      />
    )
  }

  return (
    <div className="space-y-8">
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
              <p className="text-3xl font-bold">
                {rides.filter((ride) => ride.status === 'completed' || ride.status === 'return_completed').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Unfulfilled Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {rides.length - rides.filter((ride) => ride.status === 'completed' || ride.status === 'return_completed').length}
              </p>
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
                      <Badge variant={ride.status === 'completed' || ride.status === 'return_completed' ? "default" : "secondary"}>
                        {ride.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
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

        <Card>
          <CardHeader>
            <CardTitle>Driver Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {drivers.map((driver) => (
                <li key={driver.id}>
                  <Collapsible>
                    <div className="flex items-center justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{driver.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{driver.full_name}</p>
                          <p className="text-sm text-muted-foreground">Status: {driver.driver_profile.status}</p>
                          <p className="text-sm text-muted-foreground">Completed Rides: {driver.driver_profile.completed_rides}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" onClick={() => handleViewSchedule(driver)}>
                          Schedule
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleViewSchedule(driver)}>
                          View Profile
                        </Button>
                      </div>
                    </div>
                    <CollapsibleContent className="mt-4"></CollapsibleContent>
                  </Collapsible>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Grid - Now at the bottom */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/information-base">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <BookOpen className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Information Base</span>
              </div>
            </Link>
            
            <Link href="/pending-acceptance">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Clock className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Pending Acceptance</span>
              </div>
            </Link>
            
            <Link href="/schedule">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <CalendarDays className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Schedule</span>
              </div>
            </Link>
            
            <Link href="/pickboard">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Grid className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Pickboard</span>
              </div>
            </Link>
            
            <Link href="/manifest">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Building2 className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Manifest</span>
              </div>
            </Link>
            
            <Link href="/invoicing">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <DollarSign className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Invoicing</span>
              </div>
            </Link>
            
            <Link href="/history">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <History className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">History</span>
              </div>
            </Link>
            
            <Link href="/exclude-member">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Ban className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Exclude Member</span>
              </div>
            </Link>
            
            <Link href="/counties">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Target className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Counties</span>
              </div>
            </Link>
            
            <Link href="/calendar">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <UserCircle className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Calendar</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

