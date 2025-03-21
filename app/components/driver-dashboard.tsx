'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, PhoneIcon, RefreshCw } from 'lucide-react'
import { RideProgress } from './ride-progress'
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isToday, compareAsc, startOfDay, addDays } from 'date-fns'
import { RideDetailView } from './ride-detail-view'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/auth-context'
import type { Database } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { formatAddress } from "@/lib/utils"

interface Address {
  address: string
  city: string
  state: string
  zip: string
}

type Ride = Database['public']['Tables']['rides']['Row'] & {
  member: Database['public']['Tables']['profiles']['Row']
}

interface DriverStats {
  completed_rides: number
  total_miles: number
}

export function DriverDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [rides, setRides] = useState<Ride[]>([])
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [driverStats, setDriverStats] = useState<DriverStats>({ completed_rides: 0, total_miles: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [activeRides, setActiveRides] = useState<Ride[]>([])
  const [upcomingRides, setUpcomingRides] = useState<Ride[]>([])
  const [completedRides, setCompletedRides] = useState<Ride[]>([])
  const [todayRides, setTodayRides] = useState<Ride[]>([])
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return
    
    fetchRides()
    fetchStats()
    
    // Set up real-time subscription for rides
    const ridesSubscription = supabase
      .channel('rides_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${user.id}`
        },
        () => {
          // Refresh rides when changes occur
          fetchRides()
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      ridesSubscription.unsubscribe()
    }
  }, [user])
  
  useEffect(() => {
    if (rides.length > 0) {
      categorizeRides()
    }
  }, [rides, selectedDate])

  const fetchRides = async () => {
    if (!user?.id) {
      console.error('[DriverDashboard] No user ID available for fetching rides')
      return
    }
    
    setIsLoading(true)
    try {
      console.log('[DriverDashboard] Fetching assigned rides for driver:', user.id)
      
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          member:member_id(id, full_name, phone, email)
        `)
        .eq('driver_id', user.id)
        .order('scheduled_pickup_time', { ascending: true })
      
      if (error) {
        console.error('[DriverDashboard] Error fetching assigned rides:', error)
        toast({
          title: "Error",
          description: "Failed to load assigned rides: " + error.message,
          variant: "destructive"
        })
        return
      }
      
      console.log(`[DriverDashboard] Fetched ${data?.length || 0} assigned rides`)
      setRides(data || [])
    } catch (err) {
      console.error('[DriverDashboard] Exception fetching rides:', err)
      toast({
        title: "Error",
        description: "Failed to load assigned rides",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!user?.id) return
    
    try {
      // First try to see if driver profile exists
      const { data: profileCheck, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('id', user.id)
      
      if (profileError) {
        console.error('[DriverDashboard] Error checking driver profile:', profileError)
        setStatsError('Could not verify driver profile')
        return
      }

      // If profile doesn't exist, create default stats
      if (!profileCheck || profileCheck.length === 0) {
        console.log('[DriverDashboard] No driver profile found, using default stats')
        setDriverStats({ completed_rides: 0, total_miles: 0 })
        return
      }

      // If profile exists, fetch the stats
      const { data: stats, error } = await supabase
        .from('driver_profiles')
        .select('completed_rides, total_miles')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('[DriverDashboard] Error fetching driver stats:', error)
        setStatsError('Could not load driver statistics')
        return
      }

      setDriverStats(stats)
    } catch (err) {
      console.error('[DriverDashboard] Error fetching driver stats:', err)
      setStatsError('Error retrieving statistics')
    }
  }

  const categorizeRides = () => {
    const now = new Date()
    const today = startOfDay(now)
    
    // Active rides are those that are started, picked_up, or any in_progress status
    const active = rides.filter(ride => 
      ['started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up'].includes(ride.status)
    )
    
    // Upcoming rides are scheduled or assigned and in the future
    const upcoming = rides.filter(ride => 
      ['pending', 'assigned'].includes(ride.status) && 
      compareAsc(new Date(ride.scheduled_pickup_time), now) > 0
    )
    
    // Completed rides are those with status completed or return_completed
    const completed = rides.filter(ride => 
      ['completed', 'return_completed'].includes(ride.status)
    )
    
    // Today's rides
    const todayRides = rides.filter(ride => {
      const rideDate = new Date(ride.scheduled_pickup_time)
      return (
        rideDate.getFullYear() === selectedDate.getFullYear() &&
        rideDate.getMonth() === selectedDate.getMonth() &&
        rideDate.getDate() === selectedDate.getDate()
      )
    })
    
    setActiveRides(active)
    setUpcomingRides(upcoming)
    setCompletedRides(completed)
    setTodayRides(todayRides)
  }

  const renderStatusBadge = (status: string) => {
    let color = ""
    let label = ""
    
    switch(status) {
      case 'pending':
        color = "bg-yellow-200 text-yellow-800"
        label = "Pending"
        break
      case 'assigned':
        color = "bg-blue-200 text-blue-800"
        label = "Assigned"
        break
      case 'started':
        color = "bg-indigo-200 text-indigo-800"
        label = "En Route to Pickup"
        break
      case 'picked_up':
        color = "bg-purple-200 text-purple-800"
        label = "Passenger On Board"
        break
      case 'completed':
        color = "bg-green-200 text-green-800"
        label = "Completed"
        break
      case 'in_progress':
        color = "bg-orange-200 text-orange-800"
        label = "In Progress"
        break
      case 'return_started':
        color = "bg-pink-200 text-pink-800"
        label = "Return Trip Started"
        break
      case 'return_picked_up':
        color = "bg-purple-200 text-purple-800"
        label = "Return With Passenger"
        break
      case 'return_completed':
        color = "bg-green-200 text-green-800"
        label = "Return Trip Completed"
        break
      default:
        color = "bg-gray-200 text-gray-800"
        label = status.replace(/_/g, ' ')
    }
    
    return (
      <Badge className={`${color} font-normal`}>
        {label}
      </Badge>
    )
  }

  const sortAndGroupRidesByDate = (rides: Ride[]) => {
    // Sort rides by date ascending
    const sortedRides = [...rides].sort((a, b) => 
      compareAsc(new Date(a.scheduled_pickup_time), new Date(b.scheduled_pickup_time))
    )
    
    // Group rides by date
    const groupedRides: { [key: string]: Ride[] } = {}
    
    sortedRides.forEach(ride => {
      const date = format(new Date(ride.scheduled_pickup_time), 'yyyy-MM-dd')
      if (!groupedRides[date]) {
        groupedRides[date] = []
      }
      groupedRides[date].push(ride)
    })
    
    return groupedRides
  }

  const handleRideClick = (ride: Ride) => {
    setSelectedRide(ride)
  }

  const handleBack = () => {
    setSelectedRide(null)
  }

  const handleRideAction = async (rideId: string, newStatus: Ride['status'], milesData?: { start?: number | null; end?: number | null }) => {
    const updatedRide = rides.find(r => r.id === rideId)
    if (!updatedRide) return

    let finalRide = { ...updatedRide }

    if (milesData) {
      finalRide = {
        ...finalRide,
        ...(milesData.start !== undefined && { start_miles: milesData.start }),
        ...(milesData.end !== undefined && { end_miles: milesData.end })
      }
    }

    finalRide.status = newStatus

    const { error } = await supabase
      .from('rides')
      .update(finalRide)
      .eq('id', rideId)

    if (error) {
      console.error('[DriverDashboard] Error updating ride:', error)
      toast({
        title: "Error",
        description: "Failed to update ride status",
        variant: "destructive"
      })
      return
    }

    // Update local state
    setSelectedRide(finalRide)
    setRides(rides.map(r => r.id === rideId ? finalRide : r))
    toast({
      title: "Success",
      description: "Ride status updated successfully",
    })
  }

  const handleMilesEdit = async (rideId: string, miles: { start?: number | null; end?: number | null }) => {
    await handleRideAction(rideId, selectedRide?.status || 'pending', miles)
  }

  const renderRideCard = (ride: Ride) => {
    return (
      <Card key={ride.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
              </CardTitle>
              <CardDescription>
                {ride.member?.full_name}
              </CardDescription>
            </div>
            {renderStatusBadge(ride.status)}
          </div>
        </CardHeader>
        <CardContent className="py-2">
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="font-medium">From:</span>
              <span className="flex-1">{formatAddress(ride.pickup_address)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">To:</span>
              <span className="flex-1">{formatAddress(ride.dropoff_address)}</span>
            </div>
            {ride.notes && (
              <div className="flex gap-2">
                <span className="font-medium">Notes:</span>
                <span className="flex-1">{ride.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            className="w-full"
            onClick={() => handleRideClick(ride)}
          >
            {
              ['started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up'].includes(ride.status)
                ? 'Continue Ride'
                : ['completed', 'return_completed'].includes(ride.status)
                  ? 'View Details'
                  : 'Manage Ride'
            }
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4 mx-auto"></div>
          <p className="text-lg font-medium">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your assigned rides</p>
        </div>
      </div>
    )
  }

  if (selectedRide) {
    return (
      <RideDetailView
        ride={selectedRide}
        onRideAction={handleRideAction}
        onBack={handleBack}
        onMilesEdit={handleMilesEdit}
        onClose={handleBack}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Driver Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Driver Overview</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchRides} className="gap-2">
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={!isToday(selectedDate) ? "text-blue-500" : ""}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-sm text-gray-500">Completed Rides</div>
                <div className="text-2xl font-bold">{driverStats.completed_rides}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Miles</div>
                <div className="text-2xl font-bold">{driverStats.total_miles}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for All Rides */}
      <Tabs defaultValue="today" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">
            Today
            {todayRides.length > 0 && (
              <Badge variant="secondary" className="ml-2">{todayRides.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            {activeRides.length > 0 && (
              <Badge className="ml-2 bg-red-500">{activeRides.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming
            {upcomingRides.length > 0 && (
              <Badge className="ml-2">{upcomingRides.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
          </TabsTrigger>
        </TabsList>
        
        {/* Today's Rides Tab */}
        <TabsContent value="today" className="mt-4">
          <h2 className="text-xl font-semibold mb-4">Rides for {format(selectedDate, 'MMMM d, yyyy')}</h2>
          
          {todayRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No rides scheduled for this date</p>
                <p className="text-muted-foreground mb-4">Try selecting a different date or checking back later</p>
                <Button variant="outline" onClick={fetchRides}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {todayRides.map(ride => renderRideCard(ride))}
            </div>
          )}
        </TabsContent>
        
        {/* Active Rides Tab */}
        <TabsContent value="active" className="mt-4">
          {activeRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No active rides</p>
                <p className="text-muted-foreground mb-4">You don't have any in-progress trips at the moment</p>
                <Button variant="outline" onClick={fetchRides}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeRides.map(ride => renderRideCard(ride))}
            </div>
          )}
        </TabsContent>
        
        {/* Upcoming Rides Tab */}
        <TabsContent value="upcoming" className="mt-4">
          {upcomingRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No upcoming rides</p>
                <p className="text-muted-foreground mb-4">You don't have any future trips scheduled</p>
                <Button variant="outline" onClick={fetchRides}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(sortAndGroupRidesByDate(upcomingRides)).map(([date, rides]) => (
                <div key={date}>
                  <h3 className="text-lg font-semibold mb-3">
                    {isToday(new Date(date)) 
                      ? 'Today' 
                      : format(new Date(date), 'EEEE, MMMM d')}
                  </h3>
                  <div className="space-y-4">
                    {rides.map(ride => renderRideCard(ride))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Completed Rides Tab */}
        <TabsContent value="completed" className="mt-4">
          {completedRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No completed rides</p>
                <p className="text-muted-foreground mb-4">You haven't completed any rides yet</p>
                <Button variant="outline" onClick={fetchRides}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(sortAndGroupRidesByDate(completedRides)).map(([date, rides]) => (
                <div key={date}>
                  <h3 className="text-lg font-semibold mb-3">
                    {isToday(new Date(date)) 
                      ? 'Today' 
                      : format(new Date(date), 'EEEE, MMMM d')}
                  </h3>
                  <div className="space-y-4">
                    {rides.map(ride => renderRideCard(ride))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

