'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, Search, Check, X, MapPin, MoreHorizontal, Clock, AlertCircle } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ProviderSchedulerProps {
  providerId: string
}

interface Driver {
  id: string
  full_name: string
  status: 'active' | 'inactive'
  availability?: DriverAvailability[]
}

interface DriverAvailability {
  id: string
  driver_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface Ride {
  id: string
  member_id: string
  driver_id: string | null
  pickup_location: string
  pickup_datetime: string
  dropoff_location: string
  dropoff_datetime: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  notes: string
  member?: {
    full_name: string
    phone: string
  }
  driver?: {
    full_name: string
    phone: string
  }
}

export function ProviderScheduler({ providerId }: ProviderSchedulerProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [calendarView, setCalendarView] = useState<'day' | 'week'>('week')
  const [rides, setRides] = useState<Ride[]>([])
  const [filteredRides, setFilteredRides] = useState<Ride[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [isRideDetailsOpen, setIsRideDetailsOpen] = useState(false)
  const [isDriverAssignmentOpen, setIsDriverAssignmentOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<Ride['status'] | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const weekStartDate = startOfWeek(date, { weekStartsOn: 0 })
  const weekEndDate = endOfWeek(date, { weekStartsOn: 0 })
  const daysInWeek = eachDayOfInterval({ start: weekStartDate, end: weekEndDate })

  // Fetch rides and drivers data
  useEffect(() => {
    fetchRides()
    fetchDrivers()
  }, [providerId])

  // Apply filters and search
  useEffect(() => {
    if (!rides.length) {
      setFilteredRides([])
      return
    }

    let filtered = [...rides]

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ride => ride.status === statusFilter)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        ride => 
          ride.member?.full_name?.toLowerCase().includes(query) ||
          ride.pickup_location.toLowerCase().includes(query) ||
          ride.dropoff_location.toLowerCase().includes(query) ||
          ride.notes?.toLowerCase().includes(query)
      )
    }

    // For calendar view, only show rides for the selected date/week
    if (viewMode === 'calendar') {
      if (calendarView === 'day') {
        filtered = filtered.filter(ride => 
          isSameDay(parseISO(ride.pickup_datetime), date)
        )
      } else {
        filtered = filtered.filter(ride => {
          const rideDate = parseISO(ride.pickup_datetime)
          return rideDate >= weekStartDate && rideDate <= weekEndDate
        })
      }
    }

    setFilteredRides(filtered)
  }, [rides, statusFilter, searchQuery, date, viewMode, calendarView, weekStartDate, weekEndDate])

  const fetchRides = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          member:profiles!rides_member_id_fkey(full_name, phone),
          driver:profiles!rides_driver_id_fkey(full_name, phone)
        `)
        .eq('provider_id', providerId)
        .order('pickup_datetime', { ascending: true })

      if (error) throw error
      setRides(data || [])
    } catch (error) {
      console.error('Error fetching rides:', error)
      toast.error('Failed to load rides')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('provider_id', providerId)
        .eq('user_role', 'driver')
        .eq('status', 'active')

      if (error) throw error
      
      // Get driver availability if available
      const driversWithAvailability = await Promise.all((data || []).map(async driver => {
        try {
          const { data: availabilityData } = await supabase
            .from('driver_availability')
            .select('*')
            .eq('driver_id', driver.id)
          
          return {
            ...driver,
            availability: availabilityData || []
          }
        } catch (e) {
          return driver
        }
      }))
      
      setDrivers(driversWithAvailability)
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast.error('Failed to load drivers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignDriver = async () => {
    if (!selectedRide || !selectedDriver) return
    
    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          driver_id: selectedDriver,
          status: 'assigned' 
        })
        .eq('id', selectedRide.id)
        
      if (error) throw error
      
      toast.success('Driver assigned successfully')
      setSelectedDriver(null)
      setIsDriverAssignmentOpen(false)
      fetchRides() // Refresh rides
    } catch (error) {
      console.error('Error assigning driver:', error)
      toast.error('Failed to assign driver')
    }
  }

  const handleUpdateStatus = async (rideId: string, status: Ride['status']) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status })
        .eq('id', rideId)
        
      if (error) throw error
      
      toast.success(`Ride status updated to ${status}`)
      fetchRides() // Refresh rides
    } catch (error) {
      console.error('Error updating ride status:', error)
      toast.error('Failed to update ride status')
    }
  }

  const getStatusBadge = (status: Ride['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setDate(subWeeks(date, 1))
    } else {
      setDate(addWeeks(date, 1))
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'h:mm a')
    } catch (e) {
      return 'Invalid time'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Tabs 
            value={viewMode} 
            onValueChange={(val) => setViewMode(val as 'calendar' | 'list')}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {viewMode === 'calendar' && (
            <Tabs 
              value={calendarView} 
              onValueChange={(val) => setCalendarView(val as 'day' | 'week')}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{format(date, 'MMM d, yyyy')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Select 
            value={statusFilter} 
            onValueChange={(val) => setStatusFilter(val as any)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rides..."
              className="pl-8 h-9 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule New Ride
        </Button>
      </div>
      
      {/* Calendar View */}
      {viewMode === 'calendar' && calendarView === 'week' && (
        <Card>
          <CardHeader className="flex flex-row items-center pb-2">
            <div className="flex-1">
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {daysInWeek.map((day, idx) => (
                <div key={idx} className="text-center border-r last:border-r-0">
                  <div className="px-1 py-2 font-medium bg-muted/40 border-b">
                    <div>{format(day, 'EEE')}</div>
                    <div className="text-sm">{format(day, 'MMM d')}</div>
                  </div>
                  <div className="min-h-[300px] p-1">
                    {filteredRides.filter(ride => 
                      isSameDay(parseISO(ride.pickup_datetime), day)
                    ).map(ride => (
                      <div 
                        key={ride.id}
                        className={`
                          p-2 mb-1 rounded text-xs cursor-pointer border-l-4
                          ${ride.status === 'pending' ? 'border-l-gray-400 bg-gray-100' : ''}
                          ${ride.status === 'assigned' ? 'border-l-blue-400 bg-blue-50' : ''}
                          ${ride.status === 'in_progress' ? 'border-l-indigo-400 bg-indigo-50' : ''}
                          ${ride.status === 'completed' ? 'border-l-green-400 bg-green-50' : ''}
                          ${ride.status === 'cancelled' ? 'border-l-red-400 bg-red-50' : ''}
                        `}
                        onClick={() => {
                          setSelectedRide(ride)
                          setIsRideDetailsOpen(true)
                        }}
                      >
                        <div className="font-medium">{ride.member?.full_name}</div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(ride.pickup_datetime)}
                        </div>
                        <div className="truncate">{ride.pickup_location}</div>
                        {ride.driver && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Driver: {ride.driver.full_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Day View */}
      {viewMode === 'calendar' && calendarView === 'day' && (
        <Card>
          <CardHeader className="flex flex-row items-center pb-2">
            <div className="flex-1">
              <CardTitle>Daily Schedule</CardTitle>
              <CardDescription>
                {format(date, 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setDate(addDays(date, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDate(addDays(date, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {filteredRides.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No rides scheduled for this day
                </div>
              ) : (
                filteredRides.map(ride => (
                  <div 
                    key={ride.id}
                    className="py-3 px-4 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedRide(ride)
                      setIsRideDetailsOpen(true)
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{ride.member?.full_name}</h3>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(ride.pickup_datetime)} - {formatTime(ride.dropoff_datetime)}
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
                    
                    {ride.driver ? (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Driver:</span> {ride.driver.full_name}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Needs Driver
                        </Badge>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>All Scheduled Rides</CardTitle>
            <CardDescription>
              {filteredRides.length} rides found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Dropoff</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRides.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No rides found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRides.map(ride => (
                      <TableRow key={ride.id}>
                        <TableCell className="font-medium">
                          {ride.member?.full_name || 'Unknown Member'}
                        </TableCell>
                        <TableCell>
                          <div>{format(parseISO(ride.pickup_datetime), 'MMM d, yyyy')}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(ride.pickup_datetime)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {ride.pickup_location}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {ride.dropoff_location}
                        </TableCell>
                        <TableCell>
                          {ride.driver ? ride.driver.full_name : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedRide(ride)
                                setIsDriverAssignmentOpen(true)
                              }}
                            >
                              Assign Driver
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ride.status)}
                        </TableCell>
                        <TableCell>
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
                              {ride.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(ride.id, 'assigned')}
                                >
                                  Mark as Assigned
                                </DropdownMenuItem>
                              )}
                              {(ride.status === 'pending' || ride.status === 'assigned') && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(ride.id, 'in_progress')}
                                >
                                  Mark as In Progress
                                </DropdownMenuItem>
                              )}
                              {(ride.status === 'assigned' || ride.status === 'in_progress') && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(ride.id, 'completed')}
                                >
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}
                              {ride.status !== 'completed' && ride.status !== 'cancelled' && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(ride.id, 'cancelled')}
                                  className="text-red-500"
                                >
                                  Cancel Ride
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Ride Details Dialog */}
      <Dialog open={isRideDetailsOpen} onOpenChange={setIsRideDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ride Details</DialogTitle>
          </DialogHeader>
          
          {selectedRide && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Member</h3>
                  <p>{selectedRide.member?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRide.member?.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <div className="mt-1">{getStatusBadge(selectedRide.status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Pickup</h3>
                  <p>{format(parseISO(selectedRide.pickup_datetime), 'MMM d, yyyy')}</p>
                  <p className="text-sm">{formatTime(selectedRide.pickup_datetime)}</p>
                  <p className="text-sm mt-1">{selectedRide.pickup_location}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Dropoff</h3>
                  <p>{format(parseISO(selectedRide.dropoff_datetime), 'MMM d, yyyy')}</p>
                  <p className="text-sm">{formatTime(selectedRide.dropoff_datetime)}</p>
                  <p className="text-sm mt-1">{selectedRide.dropoff_location}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Driver Assignment</h3>
                {selectedRide.driver ? (
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <p>{selectedRide.driver.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedRide.driver.phone}</p>
                    </div>
                    <Button variant="outline" size="sm"
                      onClick={() => {
                        setIsRideDetailsOpen(false)
                        setIsDriverAssignmentOpen(true)
                      }}
                    >
                      Change Driver
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <Button variant="outline" size="sm"
                      onClick={() => {
                        setIsRideDetailsOpen(false)
                        setIsDriverAssignmentOpen(true)
                      }}
                    >
                      Assign Driver
                    </Button>
                  </div>
                )}
              </div>
              
              {selectedRide.notes && (
                <div>
                  <h3 className="text-sm font-medium">Notes</h3>
                  <p className="text-sm mt-1">{selectedRide.notes}</p>
                </div>
              )}
              
              <DialogFooter className="flex justify-between">
                <div className="flex gap-2">
                  {selectedRide.status !== 'completed' && selectedRide.status !== 'cancelled' && (
                    <Button variant="destructive" size="sm" onClick={() => {
                      handleUpdateStatus(selectedRide.id, 'cancelled')
                      setIsRideDetailsOpen(false)
                    }}>
                      Cancel Ride
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsRideDetailsOpen(false)}>
                    Close
                  </Button>
                  {selectedRide.status === 'pending' && (
                    <Button size="sm" onClick={() => {
                      handleUpdateStatus(selectedRide.id, 'assigned')
                      setIsRideDetailsOpen(false)
                    }}>
                      Mark as Assigned
                    </Button>
                  )}
                  {selectedRide.status === 'assigned' && (
                    <Button size="sm" onClick={() => {
                      handleUpdateStatus(selectedRide.id, 'in_progress')
                      setIsRideDetailsOpen(false)
                    }}>
                      Start Ride
                    </Button>
                  )}
                  {selectedRide.status === 'in_progress' && (
                    <Button size="sm" onClick={() => {
                      handleUpdateStatus(selectedRide.id, 'completed')
                      setIsRideDetailsOpen(false)
                    }}>
                      Complete Ride
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Driver Assignment Dialog */}
      <Dialog open={isDriverAssignmentOpen} onOpenChange={setIsDriverAssignmentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Select a driver to assign to this ride
            </DialogDescription>
          </DialogHeader>
          
          {selectedRide && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md">
                <div className="font-medium">{selectedRide.member?.full_name}</div>
                <div className="text-sm">
                  {format(parseISO(selectedRide.pickup_datetime), 'MMM d, yyyy')} at {formatTime(selectedRide.pickup_datetime)}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-medium">Pickup:</span> {selectedRide.pickup_location}
                </div>
              </div>
              
              <Select value={selectedDriver || ''} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No active drivers available
                    </div>
                  ) : (
                    drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDriverAssignmentOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignDriver}
                  disabled={!selectedDriver}
                >
                  Assign Driver
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 