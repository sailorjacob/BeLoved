'use client'

import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { addDays } from "date-fns"

interface CalendarProps {
  selectedDate: Date | undefined
  onSelect: (date: Date | undefined) => void
}

export function Calendar({ selectedDate, onSelect }: CalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-2xl font-semibold mb-4">Select Appointment Date</h2>
      <CalendarComponent
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        className="rounded-md border"
        disabled={(date) => date < today}
        defaultMonth={today}
        fromDate={today}
        toDate={addDays(today, 365)} // Allow booking up to a year in advance
      />
    </div>
  )
}

