'use client'

import { useState } from 'react'
import { Calendar } from './calendar'
import { AdminRideForm } from './admin-ride-form'

export function AdminScheduler({ onClose }: { onClose: () => void }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed inset-x-4 top-8 bottom-8 bg-white rounded-lg shadow-xl overflow-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Create New Ride</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AdminRideForm selectedDate={selectedDate} onClose={onClose} />
            <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
          </div>
        </div>
      </div>
    </div>
  )
}

