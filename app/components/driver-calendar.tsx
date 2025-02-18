'use client'

import { useState } from 'react'
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ScheduledRide {
  date: Date
  startTime: string
  numberOfTrips: number
}

export function DriverCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  
  // This is mock data. In a real application, you would fetch this data from your backend.
  const scheduledRides: ScheduledRide[] = [
    { date: new Date(2023, 5, 15), startTime: "09:00", numberOfTrips: 3 },
    { date: new Date(2023, 5, 16), startTime: "08:30", numberOfTrips: 2 },
    { date: new Date(2023, 5, 18), startTime: "10:00", numberOfTrips: 4 },
  ]

  const daysOff = [new Date(2023, 5, 20), new Date(2023, 5, 21)]

  const isScheduledDay = (day: Date) => 
    scheduledRides.some(ride => ride.date.toDateString() === day.toDateString())

  const isDayOff = (day: Date) =>
    daysOff.some(offDay => offDay.toDateString() === day.toDateString())

  const getScheduleInfo = (day: Date) =>
    scheduledRides.find(ride => ride.date.toDateString() === day.toDateString())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          components={{
            DayContent: (props) => {
              const scheduleInfo = getScheduleInfo(props.date)
              return (
                <div className="relative w-full h-full flex items-center justify-center">
                  {props.date.getDate()}
                  {isScheduledDay(props.date) && (
                    <Badge className="absolute bottom-0 left-0 right-0 text-[0.6rem]" variant="secondary">
                      {scheduleInfo?.startTime}
                    </Badge>
                  )}
                  {isDayOff(props.date) && (
                    <Badge className="absolute bottom-0 left-0 right-0 text-[0.6rem]" variant="destructive">
                      Off
                    </Badge>
                  )}
                </div>
              )
            }
          }}
        />
      </CardContent>
    </Card>
  )
}

