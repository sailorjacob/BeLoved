
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Ride = Database['public']['Tables']['rides']['Row'] & {
  member: Database['public']['Tables']['profiles']['Row']
}

interface DriverHistoryViewProps {
  driverId: string
}

export function DriverHistoryView({ driverId }: DriverHistoryViewProps) {
  const [pastRides, setPastRides] = useState<Ride[]>([])
  const [upcomingRides, setUpcomingRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDriverRides()
  }, [driverId])

  const fetchDriverRides = async () => {
    const now = new Date().toISOString()
    
    // Fetch past rides
    const { data: pastData, error: pastError } = await supabase
      .from('rides')
      .select(`
        *,
        member:profiles!rides_member_id_fkey(*)
      `)
      .eq('driver_id', driverId)
      .lt('scheduled_pickup_time', now)
      .order('scheduled_pickup_time', { ascending: false })

    if (pastError) {
      console.error('Error fetching past rides:', pastError)
    } else {
      setPastRides(pastData)
    }

    // Fetch upcoming rides
    const { data: upcomingData, error: upcomingError } = await supabase
      .from('rides')
      .select(`
        *,
        member:profiles!rides_member_id_fkey(*)
      `)
      .eq('driver_id', driverId)
      .gte('scheduled_pickup_time', now)
      .order('scheduled_pickup_time', { ascending: true })

    if (upcomingError) {
      console.error('Error fetching upcoming rides:', upcomingError)
    } else {
      setUpcomingRides(upcomingData)
    }

    setIsLoading(false)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Rides</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingRides.length === 0 ? (
            <p>No upcoming rides scheduled</p>
          ) : (
            <div className="space-y-4">
              {upcomingRides.map((ride) => (
                <Card key={ride.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{ride.member.full_name}</p>
                        <p className="text-sm text-gray-500">{ride.member.phone}</p>
                        <div className="mt-2">
                          <p className="text-sm font-medium">Appointment: {format(new Date(ride.scheduled_pickup_time), 'PPP p')}</p>
                          <p className="text-sm text-gray-500">
                            Pickup: {format(new Date(new Date(ride.scheduled_pickup_time).getTime() - 60 * 60 * 1000), 'p')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={ride.status === 'completed' ? "default" : "secondary"}>
                        {ride.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Rides</CardTitle>
        </CardHeader>
        <CardContent>
          {pastRides.length === 0 ? (
            <p>No past rides</p>
          ) : (
            <div className="space-y-4">
              {pastRides.map((ride) => (
                <Card key={ride.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{ride.member.full_name}</p>
                        <p className="text-sm text-gray-500">{ride.member.phone}</p>
                        <div className="mt-2">
                          <p className="text-sm font-medium">Appointment: {format(new Date(ride.scheduled_pickup_time), 'PPP p')}</p>
                          <p className="text-sm text-gray-500">
                            Pickup: {format(new Date(new Date(ride.scheduled_pickup_time).getTime() - 60 * 60 * 1000), 'p')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={ride.status === 'completed' ? "default" : "secondary"}>
                        {ride.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 