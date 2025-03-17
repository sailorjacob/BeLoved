'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/auth-context'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Navigation, PhoneCall, MessageSquare, CheckCircle, AlertCircle, User, CircleAlert, MoreHorizontal, Car } from 'lucide-react'
import { format, isToday, isPast, isFuture, formatDistanceToNow, parseISO, isThisWeek, addDays, subDays } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import Link from "next/link"

interface DriverPortalProps {
  providerId: string
}

interface Ride {
  id: string
  member_id: string
  driver_id: string
  pickup_location: string
  pickup_datetime: string
  dropoff_location: string
  dropoff_datetime: string
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  notes: string
  member?: {
    full_name: string
    phone: string
    avatar_url?: string
  }
}

interface DriverStats {
  totalAssigned: number
  inProgress: number
  completed: number
  completionRate: number
  todayRides: number
  upcomingRides: number
}

export function DriverPortal({ providerId }: DriverPortalProps) {
  const { user, profile } = useAuth()
  const [rides, setRides] = useState<Ride[]>([])
  const [todayRides, setTodayRides] = useState<Ride[]>([])
  const [upcomingRides, setUpcomingRides] = useState<Ride[]>([])
  const [pastRides, setPastRides] = useState<Ride[]>([])
  const [stats, setStats] = useState<DriverStats>({
    totalAssigned: 0,
    inProgress: 0,
    completed: 0,
    completionRate: 0,
    todayRides: 0,
    upcomingRides: 0,
  })
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [isRideDetailsOpen, setIsRideDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [displayedDate, setDisplayedDate] = useState<Date>(new Date())

  useEffect(() => {
    if (user && profile) {
      fetchDriverRides()
    }
  }, [user, profile, providerId])

  useEffect(() => {
    if (rides.length) {
      // Organize rides into categories
      const today: Ride[] = []
      const upcoming: Ride[] = []
      const past: Ride[] = []
      
      rides.forEach(ride => {
        const rideDate = parseISO(ride.pickup_datetime)
        if (isToday(rideDate)) {
          today.push(ride)
        } else if (isFuture(rideDate)) {
          upcoming.push(ride)
        } else {
          past.push(ride)
        }
      })
      
      setTodayRides(today.sort((a, b) => 
        new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime())
      )
      
      setUpcomingRides(upcoming.sort((a, b) => 
        new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime())
      )
      
      setPastRides(past.sort((a, b) => 
        new Date(b.pickup_datetime).getTime() - new Date(a.pickup_datetime).getTime())
      )
      
      // Calculate driver stats
      const completed = rides.filter(r => r.status === 'completed').length
      const total = rides.length
      const inProgress = rides.filter(r => r.status === 'in_progress').length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
      
      setStats({
        totalAssigned: total,
        inProgress,
        completed,
        completionRate,
        todayRides: today.length,
        upcomingRides: upcoming.length,
      })
    }
  }, [rides])

  // Filter rides for the selected date in the calendar
  const ridesOnSelectedDate = rides.filter(ride => {
    const rideDate = parseISO(ride.pickup_datetime)
    return rideDate.getDate() === selectedDate.getDate() && 
           rideDate.getMonth() === selectedDate.getMonth() && 
           rideDate.getFullYear() === selectedDate.getFullYear()
  }).sort((a, b) => 
    new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime()
  )

  const fetchDriverRides = async () => {
    if (!profile?.id) return
    
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          member:profiles!rides_member_id_fkey(full_name, phone, avatar_url)
        `)
        .eq('driver_id', profile.id)
        .eq('provider_id', providerId)
        .in('status', ['assigned', 'in_progress', 'completed', 'cancelled'])
        .order('pickup_datetime', { ascending: false })

      if (error) throw error
      setRides(data || [])
    } catch (error) {
      console.error('Error fetching rides:', error)
      toast.error('Failed to load your assigned rides')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (rideId: string, status: Ride['status']) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status })
        .eq('id', rideId)
        
      if (error) throw error
      
      // Update local state to reflect the change
      setRides(rides.map(ride => 
        ride.id === rideId ? { ...ride, status } : ride
      ))
      
      toast.success(`Ride status updated to ${status.replace('_', ' ')}`)
      setIsRideDetailsOpen(false)
    } catch (error) {
      console.error('Error updating ride status:', error)
      toast.error('Failed to update ride status')
    }
  }

  const getStatusBadge = (status: Ride['status']) => {
    switch (status) {
      case 'assigned':
        return <Badge variant="secondary">Assigned</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'h:mm a')
    } catch (e) {
      return 'Invalid time'
    }
  }

  const formatTimeDistance = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      if (isPast(date)) {
        return `${formatDistanceToNow(date)} ago`
      } else {
        return `in ${formatDistanceToNow(date)}`
      }
    } catch (e) {
      return 'Invalid date'
    }
  }

  const getTimeStatus = (ride: Ride) => {
    const pickupTime = parseISO(ride.pickup_datetime)
    
    if (isPast(pickupTime) && ride.status !== 'completed' && ride.status !== 'cancelled') {
      return <span className="text-red-500 text-sm flex items-center">
        <CircleAlert className="h-3 w-3 mr-1" /> Overdue
      </span>
    }
    
    if (isToday(pickupTime)) {
      const now = new Date()
      const diffMs = pickupTime.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      if (diffHours < 1 && diffHours > 0) {
        return <span className="text-amber-500 text-sm flex items-center">
          <Clock className="h-3 w-3 mr-1" /> Soon
        </span>
      }
    }
    
    return null
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setDisplayedDate(subDays(displayedDate, 1))
    } else {
      setDisplayedDate(addDays(displayedDate, 1))
    }
    
    // Also update the selected date to match the displayed date
    setSelectedDate(direction === 'prev' ? subDays(displayedDate, 1) : addDays(displayedDate, 1))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Driver Header Section */}
      <div>
        <h1 className="text-2xl font-bold">Driver Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayRides}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayRides === 0 ? 'No rides scheduled today' : `${stats.todayRides} ride${stats.todayRides > 1 ? 's' : ''} today`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingRides}</div>
            <p className="text-xs text-muted-foreground">Scheduled for the future</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inProgress === 0 ? 'No active rides' : `${stats.inProgress} active ride${stats.inProgress > 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold mr-2">{stats.completionRate}%</div>
              <div className="h-10 w-10 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-green-500"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    strokeDasharray={`${stats.completionRate * 2.51}, 251`}
                    strokeDashoffset="0"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Overall completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Today's Rides Tab */}
        <TabsContent value="today">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Today's Schedule</h2>
            
            {todayRides.length === 0 ? (
              <Card>
                <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                  <Car className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No rides scheduled for today</h3>
                  <p className="text-muted-foreground">
                    You have no assigned rides for today. Check the upcoming tab for future rides.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {todayRides.map(ride => (
                  <Card key={ride.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{ride.member?.full_name}</CardTitle>
                          <CardDescription>
                            {formatTime(ride.pickup_datetime)}
                            {getTimeStatus(ride)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(ride.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 mr-1 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">Pickup</div>
                            <div>{ride.pickup_location}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 mr-1 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">Dropoff</div>
                            <div>{ride.dropoff_location}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link href={`tel:${ride.member?.phone}`}>
                            <PhoneCall className="h-3.5 w-3.5 mr-1" />
                            Call
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ride.pickup_location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Navigation className="h-3.5 w-3.5 mr-1" />
                            Navigate
                          </Link>
                        </Button>
                      </div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRide(ride)
                                setIsRideDetailsOpen(true)
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ride.status === 'assigned' && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(ride.id, 'in_progress')}
                              >
                                Start Ride
                              </DropdownMenuItem>
                            )}
                            {ride.status === 'in_progress' && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(ride.id, 'completed')}
                              >
                                Complete Ride
                              </DropdownMenuItem>
                            )}
                            {(ride.status === 'assigned' || ride.status === 'in_progress') && (
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleUpdateStatus(ride.id, 'cancelled')}
                              >
                                Cancel Ride
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Upcoming Rides Tab */}
        <TabsContent value="upcoming">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Upcoming Rides</h2>
            
            {upcomingRides.length === 0 ? (
              <Card>
                <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                  <Car className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No upcoming rides</h3>
                  <p className="text-muted-foreground">
                    You don't have any rides scheduled for the future.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingRides.map(ride => (
                  <Card key={ride.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{ride.member?.full_name}</CardTitle>
                          <CardDescription>
                            {format(parseISO(ride.pickup_datetime), 'EEE, MMM d')} at {formatTime(ride.pickup_datetime)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(ride.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 mr-1 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">Pickup</div>
                            <div>{ride.pickup_location}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 mr-1 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">Dropoff</div>
                            <div>{ride.dropoff_location}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedRide(ride)
                          setIsRideDetailsOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ride Calendar</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="ml-auto gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {format(selectedDate, 'PP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Card>
              <CardHeader className="flex flex-row items-center pb-2">
                <div className="flex-1">
                  <CardTitle>Rides on {format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigateDay('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigateDay('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {ridesOnSelectedDate.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No rides scheduled for this day
                    </div>
                  ) : (
                    ridesOnSelectedDate.map(ride => (
                      <div 
                        key={ride.id}
                        className="py-3 px-4 hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedRide(ride)
                          setIsRideDetailsOpen(true)
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {ride.member?.avatar_url ? (
                                <AvatarImage src={ride.member.avatar_url} alt={ride.member.full_name} />
                              ) : (
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{ride.member?.full_name}</h3>
                              <div className="text-sm text-muted-foreground">
                                {formatTime(ride.pickup_datetime)} - {formatTime(ride.dropoff_datetime)}
                              </div>
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(ride.status)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 mr-1 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-medium">Pickup</div>
                              <div>{ride.pickup_location}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 mr-1 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-medium">Dropoff</div>
                              <div>{ride.dropoff_location}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ride History</h2>
            
            {pastRides.length === 0 ? (
              <Card>
                <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No past rides</h3>
                  <p className="text-muted-foreground">
                    You don't have any completed rides yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastRides.map(ride => (
                  <Card key={ride.id} className={ride.status === 'cancelled' ? 'opacity-75' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{ride.member?.full_name}</CardTitle>
                          <CardDescription>
                            {format(parseISO(ride.pickup_datetime), 'EEE, MMM d')} at {formatTime(ride.pickup_datetime)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(ride.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <div>
                            <span className="font-medium">Pickup:</span> {ride.pickup_location}
                          </div>
                          <div>
                            <span className="font-medium">Dropoff:</span> {ride.dropoff_location}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedRide(ride)
                          setIsRideDetailsOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Ride Details Dialog */}
      <Dialog open={isRideDetailsOpen} onOpenChange={setIsRideDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ride Details</DialogTitle>
          </DialogHeader>
          
          {selectedRide && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  {selectedRide.member?.avatar_url ? (
                    <AvatarImage src={selectedRide.member.avatar_url} alt={selectedRide.member.full_name} />
                  ) : (
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedRide.member?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRide.member?.phone}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="font-medium">Status:</span> {getStatusBadge(selectedRide.status)}
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Date:</span> {format(parseISO(selectedRide.pickup_datetime), 'PP')}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Pickup</h3>
                  <p className="text-sm">{formatTime(selectedRide.pickup_datetime)}</p>
                  <p className="text-sm mt-1">{selectedRide.pickup_location}</p>
                  <Button 
                    size="sm"
                    variant="outline" 
                    className="mt-2"
                    asChild
                  >
                    <Link 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedRide.pickup_location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-3.5 w-3.5 mr-1" />
                      Navigate
                    </Link>
                  </Button>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Dropoff</h3>
                  <p className="text-sm">{formatTime(selectedRide.dropoff_datetime)}</p>
                  <p className="text-sm mt-1">{selectedRide.dropoff_location}</p>
                  <Button 
                    size="sm"
                    variant="outline" 
                    className="mt-2"
                    asChild
                  >
                    <Link 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedRide.dropoff_location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-3.5 w-3.5 mr-1" />
                      Navigate
                    </Link>
                  </Button>
                </div>
              </div>
              
              {selectedRide.notes && (
                <div>
                  <h3 className="text-sm font-medium">Notes</h3>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedRide.notes}</p>
                </div>
              )}
              
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link href={`tel:${selectedRide.member?.phone}`}>
                    <PhoneCall className="h-3.5 w-3.5 mr-1" />
                    Call Member
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link href={`sms:${selectedRide.member?.phone}`}>
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    Message
                  </Link>
                </Button>
              </div>
              
              <DialogFooter className="gap-2">
                <div className="flex-1">
                  {(selectedRide.status === 'assigned' || selectedRide.status === 'in_progress') && (
                    <Button variant="destructive" size="sm" onClick={() => {
                      handleUpdateStatus(selectedRide.id, 'cancelled')
                    }}>
                      Cancel Ride
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsRideDetailsOpen(false)}>
                    Close
                  </Button>
                  {selectedRide.status === 'assigned' && (
                    <Button size="sm" onClick={() => {
                      handleUpdateStatus(selectedRide.id, 'in_progress')
                    }}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Start Ride
                    </Button>
                  )}
                  {selectedRide.status === 'in_progress' && (
                    <Button size="sm" onClick={() => {
                      handleUpdateStatus(selectedRide.id, 'completed')
                    }}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Complete Ride
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 