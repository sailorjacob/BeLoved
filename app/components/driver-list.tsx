"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Driver {
  id: number
  name: string
  avatar: string
  status: "Active" | "On Break" | "Inactive"
  completedRides: number
  ridesToday: number
  ridesThisWeek: number
  username: string
  password: string
}

const mockDrivers: Driver[] = [
  {
    id: 0,
    name: "Dwayne",
    avatar: "/avatars/dwayne.jpg",
    status: "Active",
    completedRides: 180,
    ridesToday: 5,
    ridesThisWeek: 20,
    username: "dwayne.driver",
    password: "dwayne123", // In a real app, passwords would never be stored in plain text
  },
  {
    id: 1,
    name: "Gino",
    avatar: "/avatars/gino.jpg",
    status: "Active",
    completedRides: 150,
    ridesToday: 3,
    ridesThisWeek: 15,
    username: "gino.driver",
    password: "gino123",
  },
  {
    id: 2,
    name: "Jacob",
    avatar: "/avatars/jacob.jpg",
    status: "On Break",
    completedRides: 120,
    ridesToday: 2,
    ridesThisWeek: 12,
    username: "jacob.driver",
    password: "jacob123",
  },
  {
    id: 3,
    name: "Mike",
    avatar: "/avatars/mike.jpg",
    status: "Active",
    completedRides: 200,
    ridesToday: 4,
    ridesThisWeek: 18,
    username: "mike.driver",
    password: "mike123",
  },
  {
    id: 4,
    name: "Sherry",
    avatar: "/avatars/sherry.jpg",
    status: "Inactive",
    completedRides: 80,
    ridesToday: 1,
    ridesThisWeek: 8,
    username: "sherry.driver",
    password: "sherry123",
  },
  {
    id: 5,
    name: "Danny",
    avatar: "/avatars/danny.jpg",
    status: "Active",
    completedRides: 165,
    ridesToday: 4,
    ridesThisWeek: 16,
    username: "danny.driver",
    password: "danny123",
  },
]

export function DriverList() {
  const [drivers, setDrivers] = useState<Driver[]>([])

  useEffect(() => {
    // In a real application, you would fetch this data from your backend
    setDrivers(mockDrivers)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500"
      case "On Break":
        return "bg-yellow-500"
      case "Inactive":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completed Rides</TableHead>
              <TableHead>Today's Rides</TableHead>
              <TableHead>Weekly Rides</TableHead>
              <TableHead>Login Credentials</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={driver.avatar} alt={driver.name} />
                    <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{driver.name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(driver.status)}>{driver.status}</Badge>
                </TableCell>
                <TableCell>{driver.completedRides}</TableCell>
                <TableCell>{driver.ridesToday}</TableCell>
                <TableCell>{driver.ridesThisWeek}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p><span className="font-medium">Username:</span> {driver.username}</p>
                    <p><span className="font-medium">Password:</span> {driver.password}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Button asChild>
                    <Link href={`/driver-profile/${driver.id}`}>View Profile</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

