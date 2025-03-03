'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, PhoneIcon } from 'lucide-react'
import { RideProgress } from './ride-progress'
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isToday, isFuture, isPast, addDays, subDays, startOfDay } from 'date-fns'
import { RideDetailView } from './ride-detail-view'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/auth-context'
import type { Database } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

interface RideDetailViewProps {
  ride: Ride
  onRideAction: (rideId: string, newStatus: Ride['status'], milesData?: { start?: number | null; end?: number | null }) => Promise<void>
  onBack: () => void
  onMilesEdit: (rideId: string, miles: { start?: number | null; end?: number | null }) => Promise<void>
  onClose: () => void
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString([], { hour: '2-digit', minute: '2-digit' })
}

export function DriverDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [rides, setRides] = useState<Ride[]>([])
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [driverStats, setDriverStats] = useState<DriverStats>({ completed_rides: 0, total_miles: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  // Direct navigation functions for better reliability
  const navigateToDriverInfo = () => {
    console.log('[DriverDashboard] Navigating to driver profile')
    window.location.href = '/driver-profile'
  }
  const navigateToVehicles = () => {
    console.log('[DriverDashboard] Navigating to vehicles')
    window.location.href = '/vehicles'
  }
  const navigateToCompliance = () => {
    console.log('[DriverDashboard] Navigating to compliance')
    window.location.href = '/compliance'
  }
  const navigateToUploadTrips = () => {
    console.log('[DriverDashboard] Navigating to upload trips')
    window.location.href = '/upload-trips'
  }
  const navigateToAccount = () => {
    console.log('[DriverDashboard] Navigating to account')
    window.location.href = '/account'
  }

  useEffect(() => {
    if (!user) return

    const fetchRides = async () => {
      setIsLoading(true)
      try {
        const { data: rides, error } = await supabase
          .from('rides')
          .select(`
            *,
            member:profiles!rides_member_id_fkey(*)
          `)
          .eq('driver_id', user.id)
          .order('scheduled_pickup_time', { ascending: true })

        if (error) {
          console.error('Error fetching rides:', error)
          return
        }

        setRides(rides)
      } catch (err) {
        console.error('Error fetching rides:', err)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchStats = async () => {
      try {
        const { data: stats, error } = await supabase
          .from('driver_profiles')
          .select('completed_rides, total_miles')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching driver stats:', error)
          return
        }

        setDriverStats(stats)
      } catch (err) {
        console.error('Error fetching driver stats:', err)
      }
    }

    // Fetch initial data
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
      console.error('Error updating ride:', error)
      return
    }

    setSelectedRide(finalRide)
    setRides(rides.map(r => r.id === rideId ? finalRide : r))
  }

  const handleMilesEdit = async (rideId: string, miles: { start?: number | null; end?: number | null }) => {
    await handleRideAction(rideId, selectedRide?.status || 'pending', miles)
  }

  const handleCloseRideDetail = () => {
    setSelectedRide(null)
  }

  const sortedRides = [...rides].sort((a, b) => 
    new Date(a.scheduled_pickup_time).getTime() - new Date(b.scheduled_pickup_time).getTime()
  )

  // Filter rides for selected date
  const ridesForSelectedDate = sortedRides.filter(ride => {
    const rideDate = new Date(ride.scheduled_pickup_time)
    return (
      rideDate.getFullYear() === selectedDate.getFullYear() &&
      rideDate.getMonth() === selectedDate.getMonth() &&
      rideDate.getDate() === selectedDate.getDate()
    )
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading your dashboard...</div>
          <div className="text-sm text-gray-500">Please wait while we fetch your assigned rides</div>
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
        onClose={handleCloseRideDetail}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Access Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Information Base</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Pending Acceptance</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <path d="M7 7h10v10H7z"></path>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Pickboard</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Manifest</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M12 16V8m-4 4h8"></path>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Invoicing</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 8v4l3 3"></path>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">History</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Exclude Member</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Counties</CardTitle>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <CardTitle className="text-sm font-medium">Calendar</CardTitle>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Overview</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Rides for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          {ridesForSelectedDate.length === 0 ? (
            <p>No rides scheduled for this date.</p>
          ) : (
            ridesForSelectedDate.map(ride => (
              <Card 
                key={ride.id} 
                className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleRideClick(ride)}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{ride.member.full_name}</CardTitle>
                    <Badge variant={ride.status === 'completed' || ride.status === 'return_completed' ? "default" : "secondary"}>
                      {ride.status.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>{formatTime(ride.scheduled_pickup_time)}</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="mr-2 h-4 w-4" />
                        <span>{ride.member.phone}</span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MapPinIcon className="mr-2 h-4 w-4" />
                      <span>Pickup: {formatAddress(ride.pickup_address)}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="mr-2 h-4 w-4" />
                      <span>Dropoff: {formatAddress(ride.dropoff_address)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatAddress(address: Address): string {
  return `${address.address}, ${address.city}, ${address.state} ${address.zip}`
}

