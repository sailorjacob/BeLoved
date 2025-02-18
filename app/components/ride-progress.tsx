'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type RideStatus = 
| 'pending'
| 'started'
| 'picked_up'
| 'completed'
| 'return_pending'
| 'return_started'
| 'return_picked_up'
| 'return_completed'

interface RideProgressProps {
  status: RideStatus
  onPickup: (pickupMiles: number) => void
  onComplete: (endMiles: number) => void
  onReturnStart: (returnStartMiles: number) => void
  onReturnPickup: (returnPickupMiles: number) => void
  onReturnComplete: (returnEndMiles: number) => void
  onBack: (currentStatus: RideStatus) => void
  savedMiles: {
    started?: number
    picked_up?: number
    completed?: number
    return_started?: number
    return_picked_up?: number
    return_completed?: number
  }
}

export function RideProgress({ 
  status, 
  onPickup, 
  onComplete, 
  onReturnStart, 
  onReturnPickup,
  onReturnComplete, 
  onBack,
  savedMiles
}: RideProgressProps) {
  const [miles, setMiles] = useState<string>('')

  useEffect(() => {
    const currentMiles = savedMiles[status as keyof typeof savedMiles]
    if (currentMiles !== undefined) {
      setMiles(currentMiles.toString())
    } else {
      setMiles('')
    }
  }, [status, savedMiles])

  const handleAction = (action: RideStatus) => {
    const mileage = parseFloat(miles)
    if (isNaN(mileage)) return
    if (action === 'picked_up') onPickup(mileage)
    if (action === 'completed') onComplete(mileage)
    if (action === 'return_started') onReturnStart(mileage)
    if (action === 'return_picked_up') onReturnPickup(mileage)
    if (action === 'return_completed') onReturnComplete(mileage)
    setMiles('')
  }

  const isFirstLeg = ['started', 'picked_up', 'completed'].includes(status)
  const isFirstLegCompleted = status === 'completed' || !isFirstLeg

  const handleProgressBarClick = (clickedStatus: RideStatus) => {
    if (clickedStatus !== status) {
      onBack(clickedStatus)
    }
  }

  const renderMilesInput = () => {
    if (status === 'return_completed') return null;
    return (
      <Input
        type="text"
        placeholder="Miles"
        value={miles}
        onChange={(e) => setMiles(e.target.value)}
        className="w-24"
      />
    );
  }

  const renderActionButton = () => {
    switch (status) {
      case 'started':
        return (
          <Button onClick={() => handleAction('picked_up')} className="bg-red-500 hover:bg-red-600">
            Pickup
          </Button>
        )
      case 'picked_up':
        return (
          <Button onClick={() => handleAction('completed')} className="bg-red-500 hover:bg-red-600">
            End
          </Button>
        )
      case 'return_pending':
        return (
          <Button onClick={() => handleAction('return_started')} className="bg-red-500 hover:bg-red-600">
            Start Return
          </Button>
        )
      case 'return_started':
        return (
          <Button onClick={() => handleAction('return_picked_up')} className="bg-red-500 hover:bg-red-600">
            Pickup Return
          </Button>
        )
      case 'return_picked_up':
        return (
          <Button onClick={() => handleAction('return_completed')} className="bg-red-500 hover:bg-red-600">
            End Return
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        {['started', 'picked_up', 'completed'].map((s, index) => (
          <div
            key={s}
            className={cn(
              "w-1/3 h-4 rounded-full cursor-pointer transition-colors",
              isFirstLegCompleted ? 'bg-green-500' :
              isFirstLeg ? (status === s || index < ['started', 'picked_up', 'completed'].indexOf(status) ? 'bg-red-500' : 'bg-gray-200') : 'bg-gray-200'
            )}
            onClick={() => handleProgressBarClick(s as RideStatus)}
          />
        ))}
      </div>
      {!isFirstLeg && (
        <div className="flex items-center space-x-2">
          {['return_pending', 'return_started', 'return_picked_up'].map((s, index) => (
            <div
              key={s}
              className={cn(
                "w-1/3 h-4 rounded-full cursor-pointer transition-colors",
                status === 'return_completed' ? 'bg-green-500' :
                status === s || index < ['return_pending', 'return_started', 'return_picked_up'].indexOf(status) ? 'bg-red-500' : 'bg-gray-200'
              )}
              onClick={() => handleProgressBarClick(s as RideStatus)}
            />
          ))}
        </div>
      )}
      <div className="flex items-center space-x-2">
        {renderActionButton()}
        {renderActionButton() && renderMilesInput()}
      </div>
    </div>
  )
}

