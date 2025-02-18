'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Trip {
  id: number
  passengerName: string
  pickupTime: string
  status: string
  pickupAddress: string
  dropoffAddress: string
  startMiles?: number
  endMiles?: number
}

interface DriverProfilePageProps {
  driver: {
    id: number
    name: string
    avatar: string
    status: string
    completedRides: number
    ridesToday: number
    ridesThisWeek: number
  }
}

export function DriverProfilePage({ driver }: DriverProfilePageProps) {
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null)

  // Mock data for trips
  const uncompletedTrips: Trip[] = [
    {
      id: 1,
      passengerName: "Alice Johnson",
      pickupTime: new Date().toISOString(),
      status: "Scheduled",
      pickupAddress: "123 Main St, Anytown",
      dropoffAddress: "456 Oak Ave, Othertown",
    },
    {
      id: 2,
      passengerName: "Bob Smith",
      pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: "En Route",
      pickupAddress: "789 Pine Rd, Somewhere",
      dropoffAddress: "101 Elm St, Anywhere",
      startMiles: 10050,
    },
  ]

  const completedTrips: Trip[] = [
    {
      id: 3,
      passengerName: "Charlie Brown",
      pickupTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: "Completed",
      pickupAddress: "202 Maple Dr, Hometown",
      dropoffAddress: "303 Birch Ln, Nexttown",
      startMiles: 10000,
      endMiles: 10025,
    },
    {
      id: 4,
      passengerName: "Diana Prince",
      pickupTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "Completed",
      pickupAddress: "404 Cedar St, Lasttown",
      dropoffAddress: "505 Walnut Ave, Endtown",
      startMiles: 9975,
      endMiles: 10000,
    },
  ]

  const toggleTripDetails = (tripId: number) => {
    setExpandedTrip(expandedTrip === tripId ? null : tripId)
  }

  const renderTripDetails = (trip: Trip) => (
    <div className="p-4 bg-gray-100 rounded-md">
      <p><strong>Pickup Address:</strong> {trip.pickupAddress}</p>
      <p><strong>Dropoff Address:</strong> {trip.dropoffAddress}</p>
      {trip.startMiles !== undefined && <p><strong>Start Miles:</strong> {trip.startMiles}</p>}
      {trip.endMiles !== undefined && <p><strong>End Miles:</strong> {trip.endMiles}</p>}
      {trip.startMiles !== undefined && trip.endMiles !== undefined && (
        <p><strong>Total Miles:</strong> {trip.endMiles - trip.startMiles}</p>
      )}
    </div>
  )

  return (
    <Card className="my-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={driver.avatar} alt={driver.name} />
            <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{driver.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Status: {driver.status}</p>
            <p className="text-sm text-muted-foreground">Completed Rides: {driver.completedRides}</p>
            <p className="text-sm text-muted-foreground">Today's Rides: {driver.ridesToday}</p>
            <p className="text-sm text-muted-foreground">This Week's Rides: {driver.ridesThisWeek}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-xl font-semibold mb-4">Uncompleted Trips</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Passenger</TableHead>
              <TableHead>Pickup Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uncompletedTrips.map((trip) => (
              <React.Fragment key={trip.id}>
                <TableRow>
                  <TableCell>{trip.passengerName}</TableCell>
                  <TableCell>{format(new Date(trip.pickupTime), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>{trip.status}</TableCell>
                  <TableCell>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => toggleTripDetails(trip.id)}>
                        {expandedTrip === trip.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4}>
                    <Collapsible>
                      <CollapsibleContent>
                        {renderTripDetails(trip)}
                      </CollapsibleContent>
                    </Collapsible>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>

        <h3 className="text-xl font-semibold my-4">Completed Trips History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Passenger</TableHead>
              <TableHead>Pickup Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedTrips.map((trip) => (
              <React.Fragment key={trip.id}>
                <TableRow>
                  <TableCell>{trip.passengerName}</TableCell>
                  <TableCell>{format(new Date(trip.pickupTime), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>{trip.status}</TableCell>
                  <TableCell>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => toggleTripDetails(trip.id)}>
                        {expandedTrip === trip.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4}>
                    <Collapsible>
                      <CollapsibleContent>
                        {renderTripDetails(trip)}
                      </CollapsibleContent>
                    </Collapsible>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

