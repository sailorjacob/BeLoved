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
import { useAuth } from '../contexts/auth-context'
import type { Database } from '@/lib/supabase'

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

