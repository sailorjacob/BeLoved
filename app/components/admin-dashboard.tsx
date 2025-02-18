"use client"

import { useState } from "react"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AdminScheduler } from "./admin-scheduler"
import { DriverProfilePage } from "./driver-profile-page"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  BookOpen, 
  Clock, 
  CalendarDays,
  Grid,
  Building2,
  DollarSign,
  History,
  Ban,
  Target,
  UserCircle
} from "lucide-react"

// Mock data
const mockRides = [
  ...Array(30)
    .fill(null)
    .map((_, index) => ({
      id: index + 1,
      passengerName: `Passenger ${index + 1}`,
      pickupTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.5 ? "Completed" : "Scheduled",
      assignedDriver: ["Dwayne", "Gino", "Jacob", "Mike", "Sherry"][Math.floor(Math.random() * 5)] || "",
      paymentStatus: Math.random() > 0.5 ? "Paid" : "Unpaid",
    })),
]

const mockDrivers = [
  {
    id: 0,
    name: "Dwayne",
    avatar: "/avatars/dwayne.jpg",
    status: "Active",
    completedRides: 180,
    ridesToday: 5,
    ridesThisWeek: 20,
  },
  {
    id: 1,
    name: "Gino",
    avatar: "/avatars/gino.jpg",
    status: "Active",
    completedRides: 150,
    ridesToday: 3,
    ridesThisWeek: 15,
  },
  {
    id: 2,
    name: "Jacob",
    avatar: "/avatars/jacob.jpg",
    status: "On Break",
    completedRides: 120,
    ridesToday: 2,
    ridesThisWeek: 12,
  },
  {
    id: 3,
    name: "Mike",
    avatar: "/avatars/mike.jpg",
    status: "Active",
    completedRides: 200,
    ridesToday: 4,
    ridesThisWeek: 18,
  },
  {
    id: 4,
    name: "Sherry",
    avatar: "/avatars/sherry.jpg",
    status: "Inactive",
    completedRides: 80,
    ridesToday: 1,
    ridesThisWeek: 8,
  },
  {
    id: 5,
    name: "Danny",
    avatar: "/avatars/danny.jpg",
    status: "Active",
    completedRides: 165,
    ridesToday: 4,
    ridesThisWeek: 16,
  },
]

export function AdminDashboard() {
  const [rides, setRides] = useState(mockRides)
  const [isNewRideDialogOpen, setIsNewRideDialogOpen] = useState(false)
  const [showAssignedRides, setShowAssignedRides] = useState(false)
  const [newRide, setNewRide] = useState({
    passengerName: "",
    pickupTime: "",
    assignedDriver: "",
    paymentStatus: "Unpaid",
  })
  const [expandedDriver, setExpandedDriver] = useState<number | null>(null)
  const [showAdminScheduler, setShowAdminScheduler] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<(typeof mockDrivers)[0] | null>(null)
  const router = useRouter()

  const currentWeekStart = startOfWeek(new Date())
  const currentWeekEnd = endOfWeek(new Date())

  const totalRides = rides.length
  const fulfilledRides = rides.filter((ride) => ride.status === "Completed").length
  const unfulfilledRides = totalRides - fulfilledRides

  const handleNewRideSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newRideWithId = {
      ...newRide,
      id: rides.length + 1,
      status: newRide.assignedDriver ? "Assigned" : "Scheduled",
    }
    setRides([...rides, newRideWithId])
    setIsNewRideDialogOpen(false)
    setNewRide({
      passengerName: "",
      pickupTime: "",
      assignedDriver: "",
      paymentStatus: "Unpaid",
    })
  }

  const assignDriver = (rideId: number, driverName: string) => {
    setRides(
      rides.map((ride) => {
        if (ride.id === rideId) {
          // Prevent unassigning completed rides
          if (ride.status === "Completed" && driverName === "unassigned") {
            return ride
          }
          return {
            ...ride,
            assignedDriver: driverName === "unassigned" ? "" : driverName,
            status: driverName === "unassigned" ? "Scheduled" : "Assigned",
          }
        }
        return ride
      }),
    )
  }

  const filteredRides = showAssignedRides
    ? rides.filter((ride) => ride.assignedDriver)
    : rides.filter((ride) => !ride.assignedDriver)

  const getDriverRides = (driverName: string) => {
    const allRides = rides.filter((ride) => ride.assignedDriver === driverName)
    const completedRides = allRides.filter((ride) => ride.status === "Completed")
    const uncompletedRides = allRides.filter((ride) => ride.status !== "Completed")
    return { completedRides, uncompletedRides }
  }

  const handleViewSchedule = (driver: (typeof mockDrivers)[0]) => {
    router.push(`/driver-schedule/${driver.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Rides This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalRides}</p>
            <p className="text-sm text-muted-foreground">
              {format(currentWeekStart, "MMM d")} - {format(currentWeekEnd, "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fulfilled Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{fulfilledRides}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unfulfilled Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{unfulfilledRides}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold">Admin Actions</h2>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push("/create-driver")}
        >
          Create Driver
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push("/create-member")}
        >
          Create Member
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push("/create-user")}
        >
          Create User
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push("/driver-list")}
        >
          View Drivers
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push("/member-list")}
        >
          View Members
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold">Manage Rides</h2>
        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => setShowAdminScheduler(true)}>
          Create New Ride
        </Button>
        <div className="flex items-center space-x-2">
          <Switch id="assigned-rides" checked={showAssignedRides} onCheckedChange={setShowAssignedRides} />
          <Label htmlFor="assigned-rides">{showAssignedRides ? "Assigned Rides" : "Unassigned Rides"}</Label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{showAssignedRides ? "Assigned Rides" : "Unassigned Rides"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Collapsible>
            <div className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Pickup Time</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Driver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRides.slice(0, 6).map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell>{ride.passengerName}</TableCell>
                      <TableCell>{format(new Date(ride.pickupTime), "MMM d, yyyy HH:mm")}</TableCell>
                      <TableCell>{ride.paymentStatus}</TableCell>
                      <TableCell className={ride.status === "Completed" ? "text-green-500 font-semibold" : ""}>
                        {ride.status}
                      </TableCell>
                      <TableCell>
                        {!ride.assignedDriver ? (
                          <Select defaultValue="unassigned" onValueChange={(value) => assignDriver(ride.id, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign Driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockDrivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.name}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select
                            defaultValue={ride.assignedDriver}
                            onValueChange={(value) => assignDriver(ride.id, value)}
                            disabled={ride.status === "Completed"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assign Driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {ride.status !== "Completed" && <SelectItem value="unassigned">Unassign</SelectItem>}
                              {mockDrivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.name}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredRides.length > 6 && (
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    {`Show ${filteredRides.length - 6} more rides`}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
            <CollapsibleContent>
              <Table>
                <TableBody>
                  {filteredRides.slice(6).map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell>{ride.passengerName}</TableCell>
                      <TableCell>{format(new Date(ride.pickupTime), "MMM d, yyyy HH:mm")}</TableCell>
                      <TableCell>{ride.paymentStatus}</TableCell>
                      <TableCell className={ride.status === "Completed" ? "text-green-500 font-semibold" : ""}>
                        {ride.status}
                      </TableCell>
                      <TableCell>
                        {!ride.assignedDriver ? (
                          <Select defaultValue="unassigned" onValueChange={(value) => assignDriver(ride.id, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign Driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockDrivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.name}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select
                            defaultValue={ride.assignedDriver}
                            onValueChange={(value) => assignDriver(ride.id, value)}
                            disabled={ride.status === "Completed"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assign Driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {ride.status !== "Completed" && <SelectItem value="unassigned">Unassign</SelectItem>}
                              {mockDrivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.name}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Driver Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {mockDrivers.map((driver) => (
              <li key={driver.id}>
                <Collapsible>
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={driver.avatar} alt={driver.name} />
                        <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">Status: {driver.status}</p>
                        <p className="text-sm text-muted-foreground">Completed Rides: {driver.completedRides}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button variant="outline" size="sm" onClick={() => handleViewSchedule(driver)}>
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/driver-profile/${driver.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent className="mt-4"></CollapsibleContent>
                </Collapsible>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Quick Access Grid - Now at the bottom */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/information-base">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <BookOpen className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Information Base</span>
              </div>
            </Link>
            
            <Link href="/pending-acceptance">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Clock className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Pending Acceptance</span>
              </div>
            </Link>
            
            <Link href="/schedule">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <CalendarDays className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Schedule</span>
              </div>
            </Link>
            
            <Link href="/pickboard">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Grid className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Pickboard</span>
              </div>
            </Link>
            
            <Link href="/manifest">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Building2 className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Manifest</span>
              </div>
            </Link>
            
            <Link href="/invoicing">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <DollarSign className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Invoicing</span>
              </div>
            </Link>
            
            <Link href="/history">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <History className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">History</span>
              </div>
            </Link>
            
            <Link href="/exclude-member">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Ban className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Exclude Member</span>
              </div>
            </Link>
            
            <Link href="/counties">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Target className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Counties</span>
              </div>
            </Link>
            
            <Link href="/calendar">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <UserCircle className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Calendar</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {showAdminScheduler && <AdminScheduler onClose={() => setShowAdminScheduler(false)} />}
      {selectedDriver && <DriverProfilePage driver={selectedDriver} />}
    </div>
  )
}

