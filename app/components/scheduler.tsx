'use client'

import { useState } from 'react'
import { Calendar } from './calendar'
import { RideForm } from './ride-form'
import { startOfDay } from 'date-fns'

export function Scheduler() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()))

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const today = startOfDay(new Date())
      if (date >= today) {
        setSelectedDate(date)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <RideForm selectedDate={selectedDate} />
      <Calendar selectedDate={selectedDate} onSelect={handleDateSelect} />
    </div>
  )
}

