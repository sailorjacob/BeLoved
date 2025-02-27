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
  const [selectedView, setSelectedView] = useState<'overview' | 'driver' | 'ride'>('overview')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [showAssignedRides, setShowAssignedRides] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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

  if (selectedView === 'driver' && selectedDriver) {
    return (
      <DriverProfilePage driver={selectedDriver} onBack={handleBackFromDriver} />
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

      {/* Quick Access Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {/* First Row */}
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <BookOpen className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">Information Base</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <Clock className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">Pending Acceptance</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <CalendarDays className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <Grid className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">Pickboard</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <Building2 className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">Manifest</CardTitle>
            </CardContent>
          </Card>

          {/* Second Row */}
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <DollarSign className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">Invoicing</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <History className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">History</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <Ban className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">Exclude Member</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <Target className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">Counties</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <UserCircle className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-sm font-medium">Calendar</CardTitle>
            </CardContent>
          </Card>

          {/* Third Row - Additional Buttons */}
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Driver Info</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17h10v-4H7v4zm12-4h-1v4h1v-4zm-14 0H4v4h1v-4zM17.5 5h-11L4 11h16l-2.5-6z" />
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Upload Trips</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Account</CardTitle>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

