'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserNav } from '@/app/components/user-nav'
import { 
  Car, 
  ArrowLeft,
  CalendarIcon,
  Clock,
  MapPin
} from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { format, isToday, compareAsc } from 'date-fns'

interface Member {
  id: string
  full_name: string
  email: string
  phone: string
  user_role: string
}

interface Ride {
  id: string
  member_id: string
  pickup_address: any
  dropoff_address: any
  scheduled_pickup_time: string
  status: string
  start_miles?: number | null
  end_miles?: number | null
  notes?: string | null
  payment_method?: string
  is_return_trip?: boolean
  trip_id?: string
  member?: {
    id: string
    full_name: string
    phone?: string
    email?: string
  }
}

export default function DriverRidesPage({ params }: { params: { id: string } }) {
  const { isLoggedIn, isLoading: authLoading, role } = useAuth()
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [activeRides, setActiveRides] = useState<Ride[]>([])
  const [upcomingRides, setUpcomingRides] = useState<Ride[]>([])
  const [completedRides, setCompletedRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/')
        return
      }
      
      if (role !== 'admin') {
        const dashboardPath = role === 'super_admin' 
          ? '/super-admin-dashboard'
          : role === 'driver'
            ? '/driver-dashboard'
            : '/member-dashboard'
        router.push(dashboardPath)
        return
      }
      
      // If we got here, user is logged in as admin
      fetchMemberAndRides(params.id)
    }
  }, [isLoggedIn, role, router, authLoading, params.id])

  const fetchMemberAndRides = async (memberId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch member profile
      const { data: memberData, error: memberError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .single()

      if (memberError) {
        throw memberError
      }

      setMember(memberData)

      // Only fetch rides if the member is a driver
      if (memberData.user_role === 'driver') {
        await fetchDriverRides(memberId)
      } else {
        setRides([])
        setError("This member is not a driver.")
      }
    } catch (err) {
      console.error('Error fetching member data:', err)
      setError('Failed to load member profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDriverRides = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          member:profiles!rides_member_id_fkey(id, full_name, phone, email)
        `)
        .eq('driver_id', driverId)
        .order('scheduled_pickup_time', { ascending: false })

      if (error) {
        console.error('Error fetching driver rides:', error)
        setError('Failed to load driver rides.')
        return
      }

      setRides(data || [])
      categorizeRides(data || [])
    } catch (err) {
      console.error('Error in fetchDriverRides:', err)
      setError('An unexpected error occurred.')
    }
  }

  const categorizeRides = (allRides: Ride[]) => {
    const now = new Date()
    
    // Active rides are those that are started, picked_up, or any in_progress status
    const active = allRides.filter(ride => 
      ['started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up'].includes(ride.status)
    )
    
    // Upcoming rides are pending or assigned, regardless of time
    const upcoming = allRides.filter(ride => 
      ['pending', 'assigned', 'return_pending'].includes(ride.status)
    )
    
    // Completed rides are those with status completed or return_completed
    const completed = allRides.filter(ride => 
      ['completed', 'return_completed'].includes(ride.status)
    )
    
    setActiveRides(active)
    setUpcomingRides(upcoming)
    setCompletedRides(completed)
  }

  const renderStatusBadge = (status: string) => {
    let variant = "secondary"
    let label = status.replace(/_/g, ' ')
    
    switch(status) {
      case 'pending':
        variant = "outline"
        label = "Pending"
        break
      case 'assigned':
        variant = "secondary"
        label = "Assigned"
        break
      case 'started':
        variant = "secondary"
        label = "En Route to Pickup"
        break
      case 'picked_up':
        variant = "default"
        label = "Passenger On Board"
        break
      case 'completed':
        variant = "success"
        label = "Completed"
        break
      case 'return_started':
        variant = "secondary"
        label = "Return Trip Started"
        break
      case 'return_picked_up':
        variant = "default"
        label = "Return With Passenger"
        break
      case 'return_completed':
        variant = "success"
        label = "Return Completed"
        break
    }
    
    return (
      <Badge variant={variant as any}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Badge>
    )
  }

  // Loading states
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading driver rides...</p>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Driver Rides</h1>
          <Button variant="outline" asChild>
            <Link href={`/admin-dashboard/members/${params.id}`}>
              Back to Member
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Error</h3>
              <p>{error || "Member not found"}</p>
            </div>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link href={`/admin-dashboard/members/${params.id}`}>
                  Return to Member Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{member.full_name}'s Rides</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href={`/admin-dashboard/members/${params.id}`} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Profile
            </Link>
          </Button>
          <UserNav />
        </div>
      </div>
      
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="mr-2 h-5 w-5" />
              Driver Rides Summary
            </CardTitle>
            <CardDescription>
              Overview of {member.full_name}'s assigned rides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Rides</p>
                <p className="text-2xl font-bold">{activeRides.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Upcoming Rides</p>
                <p className="text-2xl font-bold">{upcomingRides.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Completed Rides</p>
                <p className="text-2xl font-bold">{completedRides.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Rides</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {rides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No rides found</p>
                <p className="text-muted-foreground">This driver has no assigned rides.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 text-muted-foreground font-medium">Date & Time</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Member</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Pickup/Destination</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride) => (
                    <tr key={ride.id} className="border-t">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center font-medium">
                            <CalendarIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                            {format(new Date(ride.scheduled_pickup_time), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Clock className="mr-1 h-4 w-4" />
                            {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
                          </div>
                          {ride.is_return_trip && (
                            <Badge variant="outline" className="mt-1 w-fit">Return Trip</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {ride.member?.full_name || "Unknown Member"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ride.member?.phone || "-"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-start">
                            <MapPin className="mt-1 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {ride.pickup_address ? formatAddress(ride.pickup_address) : "No pickup address"}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="mt-1 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {ride.dropoff_address ? formatAddress(ride.dropoff_address) : "No dropoff address"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {renderStatusBadge(ride.status)}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin-dashboard/rides/${ride.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4 mt-4">
          {activeRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No active rides</p>
                <p className="text-muted-foreground">This driver has no active rides.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 text-muted-foreground font-medium">Date & Time</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Member</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Pickup/Destination</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRides.map((ride) => (
                    <tr key={ride.id} className="border-t">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center font-medium">
                            <CalendarIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                            {format(new Date(ride.scheduled_pickup_time), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Clock className="mr-1 h-4 w-4" />
                            {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
                          </div>
                          {ride.is_return_trip && (
                            <Badge variant="outline" className="mt-1 w-fit">Return Trip</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {ride.member?.full_name || "Unknown Member"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ride.member?.phone || "-"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-start">
                            <MapPin className="mt-1 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {ride.pickup_address ? formatAddress(ride.pickup_address) : "No pickup address"}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="mt-1 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {ride.dropoff_address ? formatAddress(ride.dropoff_address) : "No dropoff address"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {renderStatusBadge(ride.status)}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin-dashboard/rides/${ride.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No upcoming rides</p>
                <p className="text-muted-foreground">This driver has no upcoming rides.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 text-muted-foreground font-medium">Date & Time</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Member</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Pickup/Destination</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRides.map((ride) => (
                    <tr key={ride.id} className="border-t">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center font-medium">
                            <CalendarIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                            {format(new Date(ride.scheduled_pickup_time), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Clock className="mr-1 h-4 w-4" />
                            {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
                          </div>
                          {ride.is_return_trip && (
                            <Badge variant="outline" className="mt-1 w-fit">Return Trip</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {ride.member?.full_name || "Unknown Member"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ride.member?.phone || "-"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-start">
                            <MapPin className="mt-1 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {ride.pickup_address ? formatAddress(ride.pickup_address) : "No pickup address"}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="mt-1 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {ride.dropoff_address ? formatAddress(ride.dropoff_address) : "No dropoff address"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {renderStatusBadge(ride.status)}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin-dashboard/rides/${ride.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No completed rides</p>
                <p className="text-muted-foreground">This driver has no completed rides.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 text-muted-foreground font-medium">Date & Time</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Member</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Pickup/Destination</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completedRides.map((ride) => (
                    <tr key={ride.id} className="border-t">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center font-medium">
                            <CalendarIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                            {format(new Date(ride.scheduled_pickup_time), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Clock className="mr-1 h-4 w-4" />
                            {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
                          </div>
                          {ride.is_return_trip && (
                            <Badge variant="outline" className="mt-1 w-fit">Return Trip</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {ride.member?.full_name || "Unknown Member"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ride.member?.phone || "-"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-start">
                            <MapPin className="mt-1 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {ride.pickup_address ? formatAddress(ride.pickup_address) : "No pickup address"}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="mt-1 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {ride.dropoff_address ? formatAddress(ride.dropoff_address) : "No dropoff address"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {renderStatusBadge(ride.status)}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin-dashboard/rides/${ride.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
} 