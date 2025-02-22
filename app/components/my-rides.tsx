"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "../contexts/auth-context"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from "../lib/supabase"
import { format } from "date-fns"

type Ride = Database['public']['Tables']['rides']['Row']

export function MyRides() {
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (!user) return

    const fetchRides = async () => {
      setIsLoading(true)
      try {
        const { data: rides, error } = await supabase
          .from('rides')
          .select('*')
          .eq('member_id', user.id)
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

    fetchRides()
  }, [user, supabase])

  if (isLoading) {
    return <div>Loading your rides...</div>
  }

  return (
    <div className="space-y-4">
      {rides.map((ride) => (
        <Card key={ride.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {format(new Date(ride.scheduled_pickup_time), "MMMM d, yyyy 'at' h:mm a")}
              </CardTitle>
              <Badge variant={ride.status === 'completed' ? "default" : "secondary"}>
                {ride.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
            <CardDescription>Ride ID: {ride.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Pickup:</strong>{" "}
                {`${ride.pickup_address.address}, ${ride.pickup_address.city}, ${ride.pickup_address.state} ${ride.pickup_address.zip}`}
              </p>
              <p>
                <strong>Dropoff:</strong>{" "}
                {`${ride.dropoff_address.address}, ${ride.dropoff_address.city}, ${ride.dropoff_address.state} ${ride.dropoff_address.zip}`}
              </p>
              <p>
                <strong>Notes:</strong> {ride.notes || "N/A"}
              </p>
              <p>
                <strong>Recurring:</strong> {ride.recurring}
              </p>
              <p>
                <strong>Payment Method:</strong> {ride.payment_method}
              </p>
              <p>
                <strong>Payment Status:</strong> {ride.payment_status}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
      {rides.length === 0 && <p>You have no scheduled rides.</p>}
    </div>
  )
}

