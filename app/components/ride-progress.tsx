'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format } from 'date-fns'

type RideStatus = 
| 'pending'
| 'assigned'
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
  onStart: (startMiles: number) => void
  onMilesEdit: (status: string, miles: number) => void
  savedMiles: {
    started?: number | undefined
    picked_up?: number | undefined
    completed?: number | undefined
    return_started?: number | undefined
    return_picked_up?: number | undefined
    return_completed?: number | undefined
  }
  timestamps: {[key: string]: string}
}

export function RideProgress({ 
  status, 
  onPickup, 
  onComplete, 
  onReturnStart, 
  onReturnPickup,
  onReturnComplete,
  onStart,
  onBack,
  onMilesEdit,
  savedMiles,
  timestamps
}: RideProgressProps) {
  const [miles, setMiles] = useState<string>('')
  const [currentStatus, setCurrentStatus] = useState<RideStatus>(status)
  const [editingMiles, setEditingMiles] = useState<{[key: string]: string}>(
    Object.entries(savedMiles).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value?.toString() || ''
    }), {})
  )
  const [unsavedChanges, setUnsavedChanges] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    console.log(`[RideProgress] Status updated to ${status}, savedMiles:`, savedMiles)
    setCurrentStatus(status)
    const currentMiles = savedMiles[status as keyof typeof savedMiles]
    if (currentMiles !== undefined) {
      setMiles(currentMiles.toString())
    } else {
      setMiles('')
    }
  }, [status, savedMiles])

  useEffect(() => {
    // Update editingMiles when savedMiles changes
    setEditingMiles(
      Object.entries(savedMiles).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value?.toString() || ''
      }), {})
    )
    setUnsavedChanges({})
  }, [savedMiles])

  const handleAction = async (action: RideStatus) => {
    const mileage = parseFloat(miles)
    if (isNaN(mileage)) {
      alert('Please enter a valid mileage number')
      return
    }
    
    try {
      console.log(`[RideProgress] Handling action ${action} with mileage ${mileage}`)
      setEditingMiles(prev => ({ ...prev, [action]: mileage.toString() }))
      
      const milesData: any = {}
      
      switch (action) {
        case 'started':
          milesData.start = mileage
          await onStart(mileage)
          break
        case 'picked_up':
          milesData.pickup = mileage
          await onPickup(mileage)
          break
        case 'completed':
          milesData.dropoff = mileage
          milesData.end = mileage
          await onComplete(mileage)
          break
        case 'return_started':
          milesData.return_pickup = mileage
          await onReturnStart(mileage)
          break
        case 'return_picked_up':
          milesData.return_pickup = mileage
          await onReturnPickup(mileage)
          break
        case 'return_completed':
          milesData.return_dropoff = mileage
          milesData.end = mileage
          await onReturnComplete(mileage)
          break
        default:
          console.warn(`[RideProgress] Unknown action: ${action}`)
          break
      }
      
      console.log(`[RideProgress] Setting current status from ${currentStatus} to ${action}`)
      setCurrentStatus(action)
      setMiles('')
    } catch (error) {
      console.error('[RideProgress] Failed to update ride status:', error)
      alert('Failed to update ride status. Please try again.')
    }
  }

  const handleMilesEdit = (status: string, value: string) => {
    setEditingMiles(prev => ({ ...prev, [status]: value }))
    setUnsavedChanges(prev => ({ ...prev, [status]: true }))
  }

  const handleSaveMiles = async (status: string) => {
    const mileage = parseFloat(editingMiles[status])
    if (isNaN(mileage)) {
      alert('Please enter a valid mileage number')
      return
    }

    try {
      await onMilesEdit(status, mileage)
      setUnsavedChanges(prev => ({ ...prev, [status]: false }))
    } catch (error) {
      console.error('Failed to save mileage:', error)
      alert('Failed to save mileage. Please try again.')
    }
  }

  const handleProgressBarClick = (clickedStatus: RideStatus) => {
    if (clickedStatus !== currentStatus) {
      onBack(clickedStatus)
    }
  }

  const renderMilesInput = () => {
    if (currentStatus === 'return_completed') return null;
    return (
      <Input
        type="number"
        placeholder="Mileage"
        value={miles}
        onChange={(e) => setMiles(e.target.value)}
        className="w-24"
      />
    );
  }

  const renderActionButton = () => {
    switch (currentStatus) {
      case 'pending':
      case 'assigned':
        return (
          <Button onClick={() => handleAction('started')} className="bg-blue-500 hover:bg-blue-600">
            Start
          </Button>
        )
      case 'started':
        return (
          <Button onClick={() => handleAction('picked_up')} className="bg-blue-500 hover:bg-blue-600">
            Pickup
          </Button>
        )
      case 'picked_up':
        return (
          <Button onClick={() => handleAction('completed')} className="bg-blue-500 hover:bg-blue-600">
            End
          </Button>
        )
      case 'completed':
        return (
          <Button onClick={() => handleAction('return_started')} className="bg-blue-500 hover:bg-blue-600">
            Start Return
          </Button>
        )
      case 'return_started':
        return (
          <Button onClick={() => handleAction('return_picked_up')} className="bg-blue-500 hover:bg-blue-600">
            Pickup Return
          </Button>
        )
      case 'return_picked_up':
        return (
          <Button onClick={() => handleAction('return_completed')} className="bg-blue-500 hover:bg-blue-600">
            End Return
          </Button>
        )
      default:
        return null
    }
  }

  const getProgressBarColor = (segment: string, isReturn: boolean = false) => {
    const mainStatusOrder = ['started', 'picked_up', 'completed']
    const returnStatusOrder = ['return_started', 'return_picked_up', 'return_completed']
    
    // Log to help debug status issues
    console.log(`[RideProgress] Getting color for segment ${segment}, isReturn=${isReturn}, currentStatus=${currentStatus}`)
    
    // Fix issue with pending/assigned not showing correct colors
    if (currentStatus === 'pending' || currentStatus === 'assigned') {
      return 'bg-gray-200' // All segments are gray when ride is pending/assigned
    }
    
    if (isReturn) {
      if (currentStatus === 'return_completed') {
        return 'bg-green-500' // All green when return is completed
      }
      
      // Include the case where a return trip hasn't started yet
      if (currentStatus === 'completed') {
        // Initial trip is completed but return hasn't started
        return 'bg-gray-200' 
      }
      
      const currentIndex = returnStatusOrder.indexOf(currentStatus)
      const segmentIndex = returnStatusOrder.indexOf(segment)
      
      if (currentIndex >= 0 && segmentIndex <= currentIndex) {
        return 'bg-red-500' // Red for in-progress segments
      }
      
      return 'bg-gray-200' // Gray for upcoming segments
    } else {
      if (currentStatus === 'completed' || currentStatus.startsWith('return_')) {
        return 'bg-green-500' // All green when initial trip is completed
      }
      
      const currentIndex = mainStatusOrder.indexOf(currentStatus)
      const segmentIndex = mainStatusOrder.indexOf(segment)
      
      if (currentIndex === -1) {
        console.warn(`[RideProgress] Current status ${currentStatus} not found in mainStatusOrder`)
        // Handle edge case where currentStatus might be assigned or pending
        return 'bg-gray-200'
      }
      
      if (segmentIndex <= currentIndex) {
        return 'bg-red-500' // Red for in-progress segments
      }
      
      return 'bg-gray-200' // Gray for upcoming segments
    }
  }

  const renderMilesHistory = (isReturn: boolean = false) => {
    const segments = isReturn 
      ? ['return_started', 'return_picked_up', 'return_completed']
      : ['started', 'picked_up', 'completed']
    
    return segments.map(segment => {
      const hasData = editingMiles[segment] !== undefined && editingMiles[segment] !== ''
      if (!hasData) return null
      
      return (
        <div key={segment} className="flex items-center gap-2 mt-1">
          <div className="text-sm text-gray-500">
            {segment.replace(/_/g, ' ')}:
          </div>
          <Input
            type="number"
            value={editingMiles[segment] || ''}
            onChange={(e) => handleMilesEdit(segment, e.target.value)}
            className="w-24 h-6 text-sm"
            placeholder="Mileage"
          />
          {timestamps[segment] && (
            <div className="text-sm text-gray-500">
              {format(new Date(timestamps[segment]), 'h:mm a')}
            </div>
          )}
          {unsavedChanges[segment] && (
            <Button
              onClick={() => handleSaveMiles(segment)}
              size="sm"
              className="h-6 px-2 bg-green-500 hover:bg-green-600 text-white text-xs"
            >
              Save
            </Button>
          )}
        </div>
      )
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-500">Initial Trip</div>
        <div className="flex items-center space-x-2">
          {['started', 'picked_up', 'completed'].map((s) => (
            <div
              key={s}
              className={cn(
                "w-1/3 h-4 rounded-full cursor-pointer transition-colors",
                getProgressBarColor(s)
              )}
              onClick={() => handleProgressBarClick(s as RideStatus)}
            />
          ))}
        </div>
        {renderMilesHistory()}
      </div>
      
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-500">Return Trip</div>
        <div className="flex items-center space-x-2">
          {['return_started', 'return_picked_up', 'return_completed'].map((s) => (
            <div
              key={s}
              className={cn(
                "w-1/3 h-4 rounded-full cursor-pointer transition-colors",
                getProgressBarColor(s, true)
              )}
              onClick={() => handleProgressBarClick(s as RideStatus)}
            />
          ))}
        </div>
        {renderMilesHistory(true)}
      </div>
      
      <div className="flex items-center space-x-2">
        {renderActionButton()}
        {renderActionButton() && renderMilesInput()}
      </div>
    </div>
  )
}

