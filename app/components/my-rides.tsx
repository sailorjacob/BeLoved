"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "../contexts/auth-context"

interface Ride {
  id: string
  userId: number
  date: string
  time: string
  pickupAddress: {
    address: string
    city: string
    state: string
    zip: string
  }
  appointmentAddress: {
    address: string
    city: string
    state: string
    zip: string
  }
  contactInfo: {
    name: string
    phone: string
    email: string
  }
  notes: string
  recurring: string
  paymentMethod: string
  status: string
}

export function MyRides() {
  const [rides, setRides] = useState<Ride[]>([])
  const { user } = useAuth()

  useEffect(() => {
    // Load rides from local storage
    const storedRides = JSON.parse(localStorage.getItem("rides") || "[]")
    // Filter rides for the current user
    const userRides = storedRides.filter((ride: Ride) => ride.userId === user?.id)
    setRides(userRides)
  }, [user])

  return (
    <div className="space-y-4">
      {rides.map((ride) => (
        <Card key={ride.id}>
          <CardHeader>
            <CardTitle>
              {new Date(ride.date).toLocaleDateString()} at {ride.time}
            </CardTitle>
            <CardDescription>Ride ID: {ride.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Pickup:</strong>{" "}
                {`${ride.pickupAddress.address}, ${ride.pickupAddress.city}, ${ride.pickupAddress.state} ${ride.pickupAddress.zip}`}
              </p>
              <p>
                <strong>Appointment:</strong>{" "}
                {`${ride.appointmentAddress.address}, ${ride.appointmentAddress.city}, ${ride.appointmentAddress.state} ${ride.appointmentAddress.zip}`}
              </p>
              <p>
                <strong>Contact:</strong>{" "}
                {`${ride.contactInfo.name}, ${ride.contactInfo.phone}, ${ride.contactInfo.email}`}
              </p>
              <p>
                <strong>Notes:</strong> {ride.notes || "N/A"}
              </p>
              <p>
                <strong>Recurring:</strong> {ride.recurring}
              </p>
              <p>
                <strong>Payment Method:</strong> {ride.paymentMethod}
              </p>
              <p>
                <strong>Status:</strong> {ride.status}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
      {rides.length === 0 && <p>You have no scheduled rides.</p>}
    </div>
  )
}

