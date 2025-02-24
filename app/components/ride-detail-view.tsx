"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, PhoneIcon, ArrowLeftIcon, DownloadIcon } from 'lucide-react'
import { RideProgress } from './ride-progress'
import { Input } from "@/components/ui/input"
import { format } from 'date-fns'
import { SignaturePad } from './signature-pad'
import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import type { BadgeProps } from "@/components/ui/badge"

interface Address {
  address: string
  city: string
  state: string
  zip: string
}

interface Ride {
  id: string
  member_id: string
  driver_id: string | null
  pickup_address: Address
  dropoff_address: Address
  scheduled_pickup_time: string
  status: 'pending' | 'assigned' | 'started' | 'picked_up' | 'completed' | 'return_pending' | 'return_started' | 'return_picked_up' | 'return_completed'
  start_miles: number | null
  end_miles: number | null
  start_time: string | null
  end_time: string | null
  notes: string | null
  payment_method: string
  payment_status: 'pending' | 'paid'
  recurring: 'none' | 'daily' | 'weekly' | 'monthly'
  created_at: string
  updated_at: string
  member: {
    id: string
    full_name: string
    phone: string
  }
}

interface RideDetailViewProps {
  ride: Ride
  onRideAction: (rideId: string, newStatus: Ride['status'], milesData?: { start?: number | null; end?: number | null }) => Promise<void>
  onBack: () => void
  onMilesEdit: (rideId: string, miles: { start?: number | null; end?: number | null }) => Promise<void>
  onClose: () => void
}

const formatAddress = (address: Address) => {
  return `${address.address}, ${address.city}, ${address.state} ${address.zip}`
}

export function RideDetailView({ ride: initialRide, onRideAction, onBack, onMilesEdit, onClose }: RideDetailViewProps) {
  // Load persisted data immediately during initialization
  const loadInitialData = () => {
    try {
      const persistedData = localStorage.getItem(`ride_${initialRide.id}`)
      if (persistedData) {
        const data = JSON.parse(persistedData)
        return {
          ride: { ...initialRide, status: data.status },
          savedMiles: data.savedMiles,
          timestamps: data.timestamps,
          signature: data.signature,
          isSignatureSaved: data.isSignatureSaved
        }
      }
    } catch (error) {
      console.error('Failed to load persisted ride data:', error)
    }
    return {
      ride: initialRide,
      savedMiles: {
        started: initialRide.start_miles ?? undefined,
        picked_up: undefined,
        completed: initialRide.end_miles ?? undefined,
        return_started: undefined,
        return_picked_up: undefined,
        return_completed: undefined
      },
      timestamps: {
        ...(initialRide.start_time ? { started: initialRide.start_time } : {}),
        ...(initialRide.end_time ? { completed: initialRide.end_time } : {})
      },
      signature: null,
      isSignatureSaved: false
    }
  }

  const initialData = loadInitialData()
  const [ride, setRide] = useState<Ride>(initialData.ride)
  const [signature, setSignature] = useState<string | null>(initialData.signature)
  const [isSignatureSaved, setIsSignatureSaved] = useState(initialData.isSignatureSaved)
  const [savedMiles, setSavedMiles] = useState(initialData.savedMiles)
  const [timestamps, setTimestamps] = useState(initialData.timestamps)

  // Update state when initialRide changes (e.g., when navigating between rides)
  useEffect(() => {
    const newData = loadInitialData()
    setRide(newData.ride)
    setSavedMiles(newData.savedMiles)
    setTimestamps(newData.timestamps)
    setSignature(newData.signature)
    setIsSignatureSaved(newData.isSignatureSaved)
  }, [initialRide.id])

  // Persist ride data when component unmounts or when navigating away
  useEffect(() => {
    const persistRideData = async () => {
      try {
        // Save the current state to localStorage as backup
        const rideData = {
          id: ride.id,
          status: ride.status,
          savedMiles,
          timestamps,
          signature,
          isSignatureSaved
        }
        localStorage.setItem(`ride_${ride.id}`, JSON.stringify(rideData))
        
        // Here you would typically also make an API call to persist the data
        // await updateRideData(rideData)
      } catch (error) {
        console.error('Failed to persist ride data:', error)
      }
    }

    window.addEventListener('beforeunload', persistRideData)
    return () => {
      persistRideData()
      window.removeEventListener('beforeunload', persistRideData)
    }
  }, [ride, savedMiles, timestamps, signature, isSignatureSaved])

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData)
    setIsSignatureSaved(true)
    
    // Persist signature immediately when saved
    const persistedData = {
      id: ride.id,
      status: ride.status,
      savedMiles,
      timestamps,
      signature: signatureData,
      isSignatureSaved: true
    }
    localStorage.setItem(`ride_${ride.id}`, JSON.stringify(persistedData))
  }

  const handleSignatureClear = () => {
    setSignature(null)
    setIsSignatureSaved(false)
    
    // Update persisted data when signature is cleared
    const persistedData = {
      id: ride.id,
      status: ride.status,
      savedMiles,
      timestamps,
      signature: null,
      isSignatureSaved: false
    }
    localStorage.setItem(`ride_${ride.id}`, JSON.stringify(persistedData))
  }

  const handleRideAction = async (status: Ride['status'], miles: number) => {
    const milesData: { start?: number | null; end?: number | null } = {}
    const now = new Date().toISOString()
    
    // Update timestamps
    const newTimestamps = { ...timestamps, [status]: now }
    setTimestamps(newTimestamps)
    
    switch (status) {
      case 'started':
        milesData.start = miles
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, started: miles }))
        break
      case 'picked_up':
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, picked_up: miles }))
        break
      case 'completed':
        milesData.end = miles
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, completed: miles }))
        break
      case 'return_started':
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, return_started: miles }))
        break
      case 'return_picked_up':
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, return_picked_up: miles }))
        break
      case 'return_completed':
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, return_completed: miles }))
        break
    }
    
    try {
      await onRideAction(ride.id, status, milesData)
      
      const updatedRide = {
        ...ride,
        status,
        ...(status === 'started' ? { start_time: now, start_miles: miles } : {}),
        ...(status === 'completed' ? { end_time: now, end_miles: miles } : {})
      }
      
      // Update local ride state
      setRide(updatedRide)
      
      // Persist updated state
      const persistedData = {
        id: ride.id,
        status: updatedRide.status,
        savedMiles: {
          ...savedMiles,
          [status]: miles
        },
        timestamps: newTimestamps,
        signature,
        isSignatureSaved
      }
      localStorage.setItem(`ride_${ride.id}`, JSON.stringify(persistedData))
    } catch (error) {
      console.error('Failed to update ride:', error)
      alert('Failed to update ride status. Please try again.')
    }
  }

  const handleMilesEdit = async (status: string, miles: number) => {
    try {
      // Update local state
      const newSavedMiles = { ...savedMiles, [status]: miles }
      setSavedMiles(newSavedMiles)

      // If this is a start or end miles update, we need to call onMilesEdit
      if (status === 'started') {
        await onMilesEdit(ride.id, { start: miles })
      } else if (status === 'completed') {
        await onMilesEdit(ride.id, { end: miles })
      }

      // Update the ride object if needed
      const updatedRide = {
        ...ride,
        ...(status === 'started' ? { start_miles: miles } : {}),
        ...(status === 'completed' ? { end_miles: miles } : {})
      }
      setRide(updatedRide)

      // Persist to localStorage
      const persistedData = {
        id: ride.id,
        status: ride.status,
        savedMiles: newSavedMiles,
        timestamps,
        signature,
        isSignatureSaved
      }
      localStorage.setItem(`ride_${ride.id}`, JSON.stringify(persistedData))
    } catch (error) {
      console.error('Failed to update mileage:', error)
      alert('Failed to save mileage. Please try again.')
    }
  }

  const generatePDF = () => {
    if (!isSignatureSaved) {
      alert('Please add and save a signature before generating the PDF')
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth/2.5
    
    // Logo and header
    doc.setFontSize(24)
    doc.addImage('/bloved-2.png', 'PNG', margin, 10, 24, 12)
    doc.setFont('helvetica', 'bold')
    doc.text('BeLoved Transportation', margin + 30, 20)
    
    // Trip ID and Member Info - more compact
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Trip ID: ${ride.id}`, margin, 32)
    doc.text(`Member Name: ${ride.member.full_name}`, margin, 40)
    
    // Times and Addresses in two columns - tighter spacing
    const col1X = margin
    const col2X = pageWidth/2
    
    // Column 1 - reduced spacing
    doc.text('To Be Ready Time:', col1X, 52)
    doc.text(format(new Date(new Date(ride.scheduled_pickup_time).getTime() - 60 * 60 * 1000), 'h:mm a'), col1X, 60)
    doc.text('Pickup Address:', col1X, 68)
    doc.text(formatAddress(ride.pickup_address), col1X, 76)
    
    // Column 2 - aligned with column 1
    doc.text('Appointment Time:', col2X, 52)
    doc.text(format(new Date(ride.scheduled_pickup_time), 'h:mm a'), col2X, 60)
    doc.text('Drop-off Address:', col2X, 68)
    doc.text(formatAddress(ride.dropoff_address), col2X, 76)
    
    // Initial Trip Table
    const tableY = 90
    doc.setFont('helvetica', 'bold')
    doc.text('Initial Trip Completion Information:', margin, tableY)
    
    // Table setup - adjusted dimensions
    const rowHeight = 8 // Reduced to match header height
    const headerHeight = 8
    const labelColumnWidth = contentWidth/4 // Width for Time/Miles labels
    
    // Draw initial trip table
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, tableY + 5, contentWidth, headerHeight, 'F') // Header background
    doc.rect(margin, tableY + 5, contentWidth, rowHeight * 2 + headerHeight) // Full table
    
    // Vertical lines - including label column
    const labelCol = margin + labelColumnWidth
    const col1 = margin + labelColumnWidth + (contentWidth - labelColumnWidth) / 3
    const col2 = margin + labelColumnWidth + ((contentWidth - labelColumnWidth) * 2/3)
    doc.line(labelCol, tableY + 5, labelCol, tableY + 5 + rowHeight * 2 + headerHeight)
    doc.line(col1, tableY + 5, col1, tableY + 5 + rowHeight * 2 + headerHeight)
    doc.line(col2, tableY + 5, col2, tableY + 5 + rowHeight * 2 + headerHeight)
    
    // Horizontal lines
    doc.line(margin, tableY + 5 + headerHeight, margin + contentWidth, tableY + 5 + headerHeight) // Below header
    doc.line(margin, tableY + 5 + headerHeight + rowHeight, margin + contentWidth, tableY + 5 + headerHeight + rowHeight) // Between time and miles
    
    // Headers
    doc.setFont('helvetica', 'bold')
    doc.text('Start', labelCol + (contentWidth - labelColumnWidth)/6, tableY + 10, { align: 'center' })
    doc.text('Pickup', labelCol + (contentWidth - labelColumnWidth)/2, tableY + 10, { align: 'center' })
    doc.text('End', labelCol + (contentWidth - labelColumnWidth) * 5/6, tableY + 10, { align: 'center' })
    
    // Data rows
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Time row - center between header and middle line
    const timeY = tableY + 5 + headerHeight + (rowHeight/2)
    doc.text('Time', margin + labelColumnWidth/2, timeY, { align: 'center', baseline: 'middle' })
    doc.text(timestamps.started ? format(new Date(timestamps.started), 'h:mm a') : 'N/A', labelCol + (contentWidth - labelColumnWidth)/6, timeY, { align: 'center', baseline: 'middle' })
    doc.text(timestamps.picked_up ? format(new Date(timestamps.picked_up), 'h:mm a') : 'N/A', labelCol + (contentWidth - labelColumnWidth)/2, timeY, { align: 'center', baseline: 'middle' })
    doc.text(timestamps.completed ? format(new Date(timestamps.completed), 'h:mm a') : 'N/A', labelCol + (contentWidth - labelColumnWidth) * 5/6, timeY, { align: 'center', baseline: 'middle' })
    
    // Miles row - center between middle line and bottom
    const milesY = tableY + 5 + headerHeight + rowHeight + (rowHeight/2)
    doc.text('Mileage', margin + labelColumnWidth/2, milesY, { align: 'center', baseline: 'middle' })
    doc.text(savedMiles.started?.toString() || 'N/A', labelCol + (contentWidth - labelColumnWidth)/6, milesY, { align: 'center', baseline: 'middle' })
    doc.text(savedMiles.picked_up?.toString() || 'N/A', labelCol + (contentWidth - labelColumnWidth)/2, milesY, { align: 'center', baseline: 'middle' })
    doc.text(savedMiles.completed?.toString() || 'N/A', labelCol + (contentWidth - labelColumnWidth) * 5/6, milesY, { align: 'center', baseline: 'middle' })
    
    // Initial trip total
    const initialTripMiles = savedMiles.completed && savedMiles.started ? savedMiles.completed - savedMiles.started : 0
    doc.setFontSize(12)
    doc.text(`Initial Trip Total Mileage: ${initialTripMiles}`, margin, tableY + rowHeight * 2 + headerHeight + 10)
    
    // Return Trip Table
    const returnY = tableY + rowHeight * 2 + headerHeight + 20
    doc.setFont('helvetica', 'bold')
    doc.text('Return Trip Completion Information:', margin, returnY)
    
    // Draw return trip table
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, returnY + 5, contentWidth, headerHeight, 'F')
    doc.rect(margin, returnY + 5, contentWidth, rowHeight * 2 + headerHeight)
    
    // Return trip vertical lines
    doc.line(labelCol, returnY + 5, labelCol, returnY + 5 + rowHeight * 2 + headerHeight)
    doc.line(col1, returnY + 5, col1, returnY + 5 + rowHeight * 2 + headerHeight)
    doc.line(col2, returnY + 5, col2, returnY + 5 + rowHeight * 2 + headerHeight)
    
    // Return trip horizontal lines
    doc.line(margin, returnY + 5 + headerHeight, margin + contentWidth, returnY + 5 + headerHeight)
    doc.line(margin, returnY + 5 + headerHeight + rowHeight, margin + contentWidth, returnY + 5 + headerHeight + rowHeight)
    
    // Return trip headers
    doc.text('Start', labelCol + (contentWidth - labelColumnWidth)/6, returnY + 10, { align: 'center' })
    doc.text('Pickup', labelCol + (contentWidth - labelColumnWidth)/2, returnY + 10, { align: 'center' })
    doc.text('End', labelCol + (contentWidth - labelColumnWidth) * 5/6, returnY + 10, { align: 'center' })
    
    // Return trip data
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Return time row - center between header and middle line
    const returnTimeY = returnY + 5 + headerHeight + (rowHeight/2)
    doc.text('Time', margin + labelColumnWidth/2, returnTimeY, { align: 'center', baseline: 'middle' })
    doc.text(timestamps.return_started ? format(new Date(timestamps.return_started), 'h:mm a') : 'N/A', labelCol + (contentWidth - labelColumnWidth)/6, returnTimeY, { align: 'center', baseline: 'middle' })
    doc.text(timestamps.return_picked_up ? format(new Date(timestamps.return_picked_up), 'h:mm a') : 'N/A', labelCol + (contentWidth - labelColumnWidth)/2, returnTimeY, { align: 'center', baseline: 'middle' })
    doc.text(timestamps.return_completed ? format(new Date(timestamps.return_completed), 'h:mm a') : 'N/A', labelCol + (contentWidth - labelColumnWidth) * 5/6, returnTimeY, { align: 'center', baseline: 'middle' })
    
    // Return miles row - center between middle line and bottom
    const returnMilesY = returnY + 5 + headerHeight + rowHeight + (rowHeight/2)
    doc.text('Mileage', margin + labelColumnWidth/2, returnMilesY, { align: 'center', baseline: 'middle' })
    doc.text(savedMiles.return_started?.toString() || 'N/A', labelCol + (contentWidth - labelColumnWidth)/6, returnMilesY, { align: 'center', baseline: 'middle' })
    doc.text(savedMiles.return_picked_up?.toString() || 'N/A', labelCol + (contentWidth - labelColumnWidth)/2, returnMilesY, { align: 'center', baseline: 'middle' })
    doc.text(savedMiles.return_completed?.toString() || 'N/A', labelCol + (contentWidth - labelColumnWidth) * 5/6, returnMilesY, { align: 'center', baseline: 'middle' })
    
    // Return trip total
    const returnTripMiles = savedMiles.return_completed && savedMiles.return_started ? savedMiles.return_completed - savedMiles.return_started : 0
    doc.setFontSize(12)
    doc.text(`Return Trip Total Mileage: ${returnTripMiles}`, margin, returnY + rowHeight * 2 + headerHeight + 10)
    
    // Total trip miles
    const totalMiles = initialTripMiles + returnTripMiles
    doc.text(`Total Trip Mileage: ${totalMiles}`, margin, returnY + rowHeight * 2 + headerHeight + 20)
    
    // Member Signature
    if (signature) {
      doc.text('Member Signature:', margin, returnY + rowHeight * 2 + headerHeight + 35)
      doc.addImage(signature, 'PNG', margin, returnY + rowHeight * 2 + headerHeight + 40, 70, 25)
      doc.text(format(new Date(), 'EEEE, MMMM d, yyyy'), margin, returnY + rowHeight * 2 + headerHeight + 70)
    }
    
    doc.save(`ride-${ride.id}.pdf`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-2">
        <Badge variant={ride.status === 'completed' ? "default" : "secondary"}>
          {ride.status.replace(/_/g, ' ').toUpperCase()}
        </Badge>
          <Button variant="outline" onClick={generatePDF}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ride Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Member</div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{ride.member.full_name}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <PhoneIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-500">{ride.member.phone}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Driver Pickup Time</div>
              <div className="font-medium text-lg">
                {format(new Date(new Date(ride.scheduled_pickup_time).getTime() - 60 * 60 * 1000), 'h:mm a')}
              </div>
              <div className="text-sm text-gray-500 mt-2">Appointment Time</div>
              <div className="font-medium">
                {format(new Date(ride.scheduled_pickup_time), 'PPP p')}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Pickup Location</div>
              <div className="flex items-start gap-2">
                <MapPinIcon className="mt-1 h-4 w-4 text-gray-400" />
                <div className="font-medium">{formatAddress(ride.pickup_address)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Dropoff Location</div>
              <div className="flex items-start gap-2">
                <MapPinIcon className="mt-1 h-4 w-4 text-gray-400" />
                <div className="font-medium">{formatAddress(ride.dropoff_address)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Notes</div>
              <div className="font-medium">{ride.notes || 'No notes provided'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Payment Details</div>
              <div className="font-medium">
                Method: {ride.payment_method.toUpperCase()}
                <br />
                Status: {ride.payment_status.toUpperCase()}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Recurring Schedule</div>
              <div className="font-medium">{ride.recurring.toUpperCase()}</div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500 mb-4">Trip Progress</div>
              <RideProgress
                status={ride.status}
                onStart={(miles) => handleRideAction('started', miles)}
                onPickup={(miles) => handleRideAction('picked_up', miles)}
                onComplete={(miles) => handleRideAction('completed', miles)}
                onReturnStart={(miles) => handleRideAction('return_started', miles)}
                onReturnPickup={(miles) => handleRideAction('return_picked_up', miles)}
                onReturnComplete={(miles) => handleRideAction('return_completed', miles)}
                onBack={(status) => handleRideAction(status, 0)}
                onMilesEdit={handleMilesEdit}
                savedMiles={savedMiles}
                timestamps={timestamps}
              />
            </div>

            <div className="pt-4 border-t">
              <SignaturePad 
                onSave={handleSignatureSave} 
                onClear={handleSignatureClear}
                savedSignature={signature}
                isSignatureSaved={isSignatureSaved}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 