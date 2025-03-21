'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { formatAddress } from "@/lib/utils"
import { format, isToday, compareAsc, startOfDay, addDays } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/contexts/auth-context"
import { useRouter } from "next/navigation"

interface Member {
  id: string
  full_name: string
  phone: string
  email: string
}

interface Ride {
  id: string
  member_id: string
  pickup_address: any
  dropoff_address: any
  scheduled_pickup_time: string
  notes: string
  status: string
  member?: Member
}

export function DriverRides() {
  const [assignedRides, setAssignedRides] = useState<Ride[]>([])
  const [activeRides, setActiveRides] = useState<Ride[]>([])
  const [upcomingRides, setUpcomingRides] = useState<Ride[]>([])
  const [completedRides, setCompletedRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  useEffect(() => {
    fetchAssignedRides()
  }, [])
  
  useEffect(() => {
    if (assignedRides.length > 0) {
      categorizeRides()
    }
  }, [assignedRides])
  
  const fetchAssignedRides = async () => {
    try {
      setIsLoading(true)
      console.log('[DriverRides] Fetching assigned rides for driver:', user?.id)
      
      // Validate user is available
      if (!user?.id) {
        console.error('[DriverRides] No user ID available for fetching rides')
        toast({
          title: "Error",
          description: "User authentication issue. Please log out and log back in.",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          member:member_id(id, full_name, phone, email)
        `)
        .eq('driver_id', user.id)
        .order('scheduled_pickup_time', { ascending: true })
      
      if (error) {
        console.error('[DriverRides] Error fetching assigned rides:', error)
        toast({
          title: "Error",
          description: "Failed to load assigned rides. " + error.message,
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }
      
      console.log(`[DriverRides] Fetched ${data?.length || 0} assigned rides`)
      setAssignedRides(data || [])
    } catch (error) {
      console.error('[DriverRides] Exception fetching assigned rides:', error)
      toast({
        title: "Error",
        description: "Failed to load assigned rides. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const categorizeRides = () => {
    const now = new Date()
    const today = startOfDay(now)
    const tomorrow = addDays(today, 1)
    
    // Active rides are those that are started, picked_up, or any in_progress status
    const active = assignedRides.filter(ride => 
      ['started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up'].includes(ride.status)
    )
    
    // Upcoming rides are scheduled or assigned and in the future
    const upcoming = assignedRides.filter(ride => 
      ['pending', 'assigned'].includes(ride.status) && 
      compareAsc(new Date(ride.scheduled_pickup_time), now) > 0
    )
    
    // Completed rides are those with status completed or return_completed
    const completed = assignedRides.filter(ride => 
      ['completed', 'return_completed'].includes(ride.status)
    )
    
    setActiveRides(active)
    setUpcomingRides(upcoming)
    setCompletedRides(completed)
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
            onClick={() => router.push(`/driver-dashboard/rides/${ride.id}`)}
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Rides</h2>
        <Button onClick={fetchAssignedRides}>Refresh</Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4 mx-auto"></div>
          <p className="text-lg font-medium">Loading rides...</p>
          <p className="text-sm text-gray-500 mt-1">Retrieving your assigned trips</p>
        </div>
      ) : assignedRides.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-lg font-medium mb-2">No assigned rides found</p>
            <p className="text-muted-foreground mb-4">You don't have any trips assigned to you yet.</p>
            <Button onClick={fetchAssignedRides} variant="outline">
              Check Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-3">
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
          
          <TabsContent value="active" className="mt-4">
            {activeRides.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No active rides</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeRides.map(ride => renderRideCard(ride))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-4">
            {upcomingRides.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No upcoming rides</p>
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
          
          <TabsContent value="completed" className="mt-4">
            {completedRides.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No completed rides</p>
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
      )}
    </div>
  )
} 