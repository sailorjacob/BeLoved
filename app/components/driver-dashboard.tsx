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

type RideStatus = 
  | 'pending'
  | 'started'
  | 'picked_up'
  | 'completed'
  | 'return_pending'
  | 'return_started'
  | 'return_picked_up'
  | 'return_completed'

interface Ride {
  id: string
  passengerName: string
  pickupAddress: string
  dropoffAddress: string
  pickupTime: string
  status: RideStatus
  phoneNumber: string
  startMiles?: number
  pickupMiles?: number
  endMiles?: number
  returnStartMiles?: number
  returnPickupMiles?: number
  returnEndMiles?: number
  startTime?: string
  endTime?: string
  returnStartTime?: string
  returnPickupTime?: string
  returnEndTime?: string
  scheduledPickupTime: string
  order: number
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString([], { hour: '2-digit', minute: '2-digit' })
}

function generateRandomRides(date: Date): Ride[] {
  const numRides = Math.floor(Math.random() * 5) + 1;
  const rides: Ride[] = [];
  const today = startOfDay(new Date());

  for (let i = 0; i < numRides; i++) {
    const pickupTime = new Date(date);
    pickupTime.setHours(6 + Math.floor(i * (12 / numRides)));
    pickupTime.setMinutes(Math.floor(Math.random() * 4) * 15);
    pickupTime.setSeconds(0);
    pickupTime.setMilliseconds(0);

    let status: RideStatus = 'pending';
    let startMiles, endMiles;

    if (isPast(date) && !isToday(date)) {
      status = 'completed';
      startMiles = Math.floor(Math.random() * 1000);
      endMiles = startMiles + Math.floor(Math.random() * 100) + 10;
    }

    rides.push({
      id: `ride-${date.toISOString()}-${i}`,
      passengerName: `Passenger ${i + 1}`,
      pickupAddress: `${Math.floor(Math.random() * 1000) + 1} Main St, Bloomington`,
      dropoffAddress: `${Math.floor(Math.random() * 1000) + 1} Oak St, Bloomington`,
      pickupTime: pickupTime.toISOString(),
      status: status,
      phoneNumber: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      startMiles: startMiles,
      endMiles: endMiles,
      scheduledPickupTime: pickupTime.toISOString(),
      order: i
    });
  }

  return rides.sort((a, b) => a.order - b.order);
}

export function DriverDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [rides, setRides] = useState<Ride[]>([])
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)

  useEffect(() => {
    const newRides = generateRandomRides(selectedDate);
    setRides(newRides);
  }, [selectedDate]);

  const handleRideAction = (rideId: string, action: RideStatus, miles: number) => {
    const updatedRides = rides.map(ride => {
      if (ride.id === rideId) {
        const now = new Date().toISOString()
        let updatedRide;
        switch (action) {
          case 'started':
            updatedRide = { ...ride, status: 'started', startMiles: miles, startTime: now }
            break;
          case 'picked_up':
            updatedRide = { ...ride, status: 'picked_up', pickupMiles: miles }
            break;
          case 'completed':
            updatedRide = { ...ride, status: 'return_pending', endMiles: miles, endTime: now }
            break;
          case 'return_started':
            updatedRide = { ...ride, status: 'return_started', returnStartMiles: miles, returnStartTime: now }
            break;
          case 'return_picked_up':
            updatedRide = { ...ride, status: 'return_picked_up', returnPickupMiles: miles, returnPickupTime: now }
            break;
          case 'return_completed':
            updatedRide = { ...ride, status: 'return_completed', returnEndMiles: miles, returnEndTime: now }
            break;
          default:
            return ride;
        }
        // Update the selected ride if this is the one being viewed
        if (selectedRide?.id === rideId) {
          setSelectedRide(updatedRide);
        }
        return updatedRide;
      }
      return ride;
    });
    setRides(updatedRides);
  }

  const handleBack = (rideId: string, newStatus: RideStatus) => {
    const updatedRides = rides.map(ride => {
      if (ride.id === rideId) {
        const updatedRide = { ...ride, status: newStatus };
        let finalRide;
        switch (newStatus) {
          case 'pending':
            finalRide = { ...updatedRide, startMiles: undefined, startTime: undefined };
            break;
          case 'started':
            finalRide = { ...updatedRide, pickupMiles: undefined };
            break;
          case 'picked_up':
            finalRide = { ...updatedRide, endMiles: undefined, endTime: undefined };
            break;
          case 'return_pending':
            finalRide = { ...updatedRide, returnStartMiles: undefined, returnStartTime: undefined };
            break;
          case 'return_started':
            finalRide = { ...updatedRide, returnPickupMiles: undefined, returnPickupTime: undefined };
            break;
          case 'return_picked_up':
            finalRide = { ...updatedRide, returnEndMiles: undefined, returnEndTime: undefined };
            break;
          default:
            finalRide = updatedRide;
        }
        // Update the selected ride if this is the one being viewed
        if (selectedRide?.id === rideId) {
          setSelectedRide(finalRide);
        }
        return finalRide;
      }
      return ride;
    });
    setRides(updatedRides);
  };

  const handleMilesEdit = (rideId: string, field: string, value: string) => {
    const updatedRides = rides.map(ride => {
      if (ride.id === rideId) {
        const updatedRide = { ...ride, [field]: value ? parseFloat(value) : undefined };
        // Update the selected ride if this is the one being viewed
        if (selectedRide?.id === rideId) {
          setSelectedRide(updatedRide);
        }
        return updatedRide;
      }
      return ride;
    });
    setRides(updatedRides);
  }

  const handleRideClick = (ride: Ride) => {
    setSelectedRide(ride);
  };

  const handleCloseRideDetail = () => {
    setSelectedRide(null);
  };

  const sortedRides = [...rides].sort((a, b) => a.order - b.order);

  const today = startOfDay(new Date())
  const todaysRides = rides.filter(ride => isToday(new Date(ride.pickupTime)))
  const completedRides = todaysRides.filter(ride => ride.status === 'return_completed').length
  const totalMiles = todaysRides.reduce((total, ride) => {
    if (ride.status === 'return_completed' && ride.startMiles && ride.returnEndMiles) {
      return total + (ride.returnEndMiles - ride.startMiles)
    }
    return total
  }, 0)
  const hoursWorked = todaysRides.reduce((total, ride) => {
    if (ride.startTime && ride.returnEndTime) {
      const start = new Date(ride.startTime)
      const end = new Date(ride.returnEndTime)
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }
    return total
  }, 0)

  if (selectedRide) {
    return (
      <RideDetailView
        ride={selectedRide}
        onRideAction={handleRideAction}
        onBack={handleBack}
        onMilesEdit={handleMilesEdit}
        onClose={handleCloseRideDetail}
      />
    );
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <p className="text-2xl font-bold">{rides.length}</p>
              <p className="text-sm text-muted-foreground">Trips</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rides for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRides.length === 0 ? (
            <p>No rides scheduled for this date.</p>
          ) : (
            sortedRides.map(ride => (
              <Card 
                key={ride.id} 
                className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleRideClick(ride)}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{ride.passengerName}</CardTitle>
                    <Badge variant={ride.status === 'pending' ? 'secondary' : ride.status === 'started' ? 'default' : 'outline'}>
                      {ride.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>{new Date(ride.scheduledPickupTime).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="mr-2 h-4 w-4" />
                        <span>{ride.phoneNumber}</span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MapPinIcon className="mr-2 h-4 w-4" />
                      <span>Pickup: {ride.pickupAddress.replace(', USA', '')}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="mr-2 h-4 w-4" />
                      <span>Dropoff: {ride.dropoffAddress.replace(', USA', '')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold">{completedRides}</p>
              <p className="text-sm text-muted-foreground">Completed Rides</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMiles.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Total Miles</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{hoursWorked.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Hours Worked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

