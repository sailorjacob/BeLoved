"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserNav } from "@/components/user-nav"
import Image from "next/image"

interface Driver {
  id: number
  name: string
  username: string
  email: string
  phone: string
  status: "Active" | "Inactive"
  avatar: string
  completedRides: number
}

interface Ride {
  id: number
  passengerName: string
  pickupTime: string
  status: "Upcoming" | "Completed"
}

export default function DriverProfilePage() {
  const params = useParams()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [rides, setRides] = useState<Ride[]>([])

  useEffect(() => {
    // In a real application, you would fetch this data from your backend
    const mockDriver: Driver = {
      id: Number.parseInt(params.id as string),
      name: "Dwayne Johnson",
      username: "dwayne_driver",
      email: "dwayne@example.com",
      phone: "123-456-7890",
      status: "Active",
      avatar: "/avatars/dwayne.jpg",
      completedRides: 180,
    }

    const mockRides: Ride[] = [
      { id: 1, passengerName: "Alice Johnson", pickupTime: "2023-06-15 10:00 AM", status: "Upcoming" },
      { id: 2, passengerName: "Bob Smith", pickupTime: "2023-06-14 2:00 PM", status: "Completed" },
      { id: 3, passengerName: "Charlie Brown", pickupTime: "2023-06-16 11:30 AM", status: "Upcoming" },
      { id: 4, passengerName: "Diana Prince", pickupTime: "2023-06-13 9:00 AM", status: "Completed" },
    ]

    setDriver(mockDriver)
    setRides(mockRides)
  }, [params.id])

  if (!driver) {
    return <div>Loading...</div>
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"
              alt="BeLoved Transportation Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold">Driver Profile</h1>
        </div>
        <UserNav />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={driver.avatar} alt={driver.name} />
              <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{driver.name}</h2>
              <p className="text-muted-foreground">Username: {driver.username}</p>
              <p className="text-muted-foreground">Email: {driver.email}</p>
              <p className="text-muted-foreground">Phone: {driver.phone}</p>
              <p className="text-muted-foreground">Status: {driver.status}</p>
              <p className="text-muted-foreground">Completed Rides: {driver.completedRides}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ride Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Passenger</TableHead>
                <TableHead>Pickup Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell>{ride.passengerName}</TableCell>
                  <TableCell>{ride.pickupTime}</TableCell>
                  <TableCell>{ride.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}

