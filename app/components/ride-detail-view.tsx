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
import { useState, useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import type { BadgeProps } from "@/components/ui/badge"
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeftRight, ExternalLink } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from '@/components/ui/separator'
import { Link } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
    email: string
  }
  trip_id?: string
  is_return_trip?: boolean
}

interface RelatedRide {
  id: string
  status: string
  scheduled_pickup_time: string
  is_return_trip: boolean
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
  const [relatedRides, setRelatedRides] = useState<RelatedRide[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

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

  // Fetch related rides
  useEffect(() => {
    if (ride.trip_id) {
      fetchRelatedRides(ride.trip_id);
    }
  }, [ride.trip_id, ride.id]);

  const fetchRelatedRides = async (tripId: string) => {
    if (!tripId) return;
    
    setIsLoadingRelated(true);
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('id, status, scheduled_pickup_time, is_return_trip')
        .eq('trip_id', tripId)
        .neq('id', ride.id); // Don't include the current ride
      
      if (error) throw error;
      
      console.log(`[RideDetailView] Found ${data?.length || 0} related rides for trip ID ${tripId}`);
      setRelatedRides(data || []);
    } catch (err) {
      console.error('Error fetching related rides:', err);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const navigateToRelatedRide = (rideId: string) => {
    // For now we'll use a page reload approach since we don't have a direct way to 
    // update the selected ride in the parent component
    router.push(`/driver-dashboard/rides/${rideId}`);
  };

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
    console.log(`[RideDetailView] handleRideAction called with status: ${status}, miles: ${miles}`)
    
    // Create an extended milesData object that includes all our tracking points
    const milesData: { 
      start?: number | null
      end?: number | null
      pickup?: number | null 
      dropoff?: number | null
      return_pickup?: number | null
      return_dropoff?: number | null
    } = {}
    
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
        milesData.pickup = miles
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, picked_up: miles }))
        break
      case 'completed':
        milesData.dropoff = miles
        milesData.end = miles
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, completed: miles }))
        break
      case 'return_started':
        milesData.return_pickup = miles
        milesData.start = miles // Also update start miles for legacy support
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, return_started: miles }))
        break
      case 'return_picked_up':
        milesData.return_pickup = miles
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, return_picked_up: miles }))
        break
      case 'return_completed':
        milesData.return_dropoff = miles
        milesData.end = miles // Also update end miles for legacy support
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, return_completed: miles }))
        break
    }
    
    try {
      console.log(`[RideDetailView] Updating ride ${ride.id} to status ${status} with miles data:`, milesData)
      
      // Attempt to use the parent component's callback
      await onRideAction(ride.id, status, milesData)
      
      // Also directly update to Supabase as a fallback
      try {
        // Create an update object with the fields to update
        const updateObject: any = {
          status: status,
          updated_at: now
        }
        
        // Add mileage data for all supported fields
        if (milesData.start !== undefined) updateObject.start_miles = milesData.start
        if (milesData.pickup !== undefined) updateObject.pickup_miles = milesData.pickup
        if (milesData.dropoff !== undefined) updateObject.dropoff_miles = milesData.dropoff
        if (milesData.return_pickup !== undefined) updateObject.return_pickup_miles = milesData.return_pickup
        if (milesData.return_dropoff !== undefined) updateObject.return_dropoff_miles = milesData.return_dropoff
        if (milesData.end !== undefined) updateObject.end_miles = milesData.end
        
        // Add timestamps for all status changes
        switch (status) {
          case 'started':
            updateObject.start_time = now
            break
          case 'picked_up':
            updateObject.pickup_time = now
            break
          case 'completed':
            updateObject.dropoff_time = now
            updateObject.end_time = now
            break
          case 'return_started':
            updateObject.return_pickup_time = now
            break
          case 'return_picked_up':
            updateObject.return_pickup_time = now
            break
          case 'return_completed':
            updateObject.return_dropoff_time = now
            updateObject.end_time = now
            break
        }
        
        console.log(`[RideDetailView] Direct Supabase update for ride ${ride.id}:`, updateObject)
        
        // Update ride directly in Supabase
        const { error } = await supabase
          .from('rides')
          .update(updateObject)
          .eq('id', ride.id)
        
        if (error) {
          console.error(`[RideDetailView] Supabase update error:`, error)
          toast({
            title: "Warning",
            description: "Ride data saved locally but database update may have failed. Your changes will sync when connection is restored.",
            variant: "destructive"
          })
        } else {
          console.log(`[RideDetailView] Supabase update successful`)
          toast({
            title: "Success",
            description: `Ride status updated to ${status.replace('_', ' ')}`,
          })
        }
      } catch (supabaseError) {
        console.error(`[RideDetailView] Supabase error:`, supabaseError)
      }
      
      // Update local ride state with all properties
      setRide((prev) => ({
        ...prev,
        status: status,
        ...(milesData.start !== undefined && { start_miles: milesData.start }),
        ...(milesData.pickup !== undefined && { pickup_miles: milesData.pickup }),
        ...(milesData.dropoff !== undefined && { dropoff_miles: milesData.dropoff }),
        ...(milesData.return_pickup !== undefined && { return_pickup_miles: milesData.return_pickup }),
        ...(milesData.return_dropoff !== undefined && { return_dropoff_miles: milesData.return_dropoff }),
        ...(milesData.end !== undefined && { end_miles: milesData.end })
      }))
      
    } catch (error) {
      console.error(`[RideDetailView] Error in handleRideAction:`, error)
      toast({
        title: "Error",
        description: "Failed to update ride status. Your changes are saved locally and will sync when connection is restored.",
        variant: "destructive"
      })
      
      // Continue with local update even if callback failed
      setRide((prev) => ({
        ...prev,
        status: status,
        ...(milesData.start !== undefined && { start_miles: milesData.start }),
        ...(milesData.pickup !== undefined && { pickup_miles: milesData.pickup }),
        ...(milesData.dropoff !== undefined && { dropoff_miles: milesData.dropoff }),
        ...(milesData.return_pickup !== undefined && { return_pickup_miles: milesData.return_pickup }),
        ...(milesData.return_dropoff !== undefined && { return_dropoff_miles: milesData.return_dropoff }),
        ...(milesData.end !== undefined && { end_miles: milesData.end })
      }))
    }
    
    // Persist data to localStorage
    const persistedData = {
      id: ride.id,
      status: status,
      savedMiles: {
        ...savedMiles,
        ...(status === 'started' && { started: miles }),
        ...(status === 'picked_up' && { picked_up: miles }),
        ...(status === 'completed' && { completed: miles }),
        ...(status === 'return_started' && { return_started: miles }),
        ...(status === 'return_picked_up' && { return_picked_up: miles }),
        ...(status === 'return_completed' && { return_completed: miles }),
      },
      timestamps: newTimestamps,
      signature,
      isSignatureSaved
    }
    
    localStorage.setItem(`ride_${ride.id}`, JSON.stringify(persistedData))
  }

  const handleMilesEdit = async (rideId: string, milesData: { start?: number | null; end?: number | null }) => {
    console.log(`[RideDetailView] Editing miles for ride ${rideId}:`, milesData)
    
    // Update local state
    if (milesData.start !== undefined) {
      if (ride.status === 'started') {
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, started: milesData.start }))
      } else if (ride.status === 'return_started') {
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, return_started: milesData.start }))
      }
    }
    
    if (milesData.end !== undefined) {
      if (ride.status === 'completed') {
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, completed: milesData.end }))
      } else if (ride.status === 'return_completed') {
        setSavedMiles((prev: typeof savedMiles) => ({ ...prev, return_completed: milesData.end }))
      }
    }
    
    try {
      // Attempt to use the parent component's callback
      await onMilesEdit(rideId, milesData)
      
      // Also directly update to Supabase as a fallback
      try {
        console.log(`[RideDetailView] Direct Supabase miles update for ride ${rideId}:`, milesData)
        
        // Update ride directly in Supabase
        const { error } = await supabase
          .from('rides')
          .update({
            ...(milesData.start !== undefined && { start_miles: milesData.start }),
            ...(milesData.end !== undefined && { end_miles: milesData.end }),
            updated_at: new Date().toISOString()
          })
          .eq('id', rideId)
        
        if (error) {
          console.error(`[RideDetailView] Supabase miles update error:`, error)
          toast({
            title: "Warning",
            description: "Mileage saved locally but database update may have failed. Your changes will sync when connection is restored.",
            variant: "destructive"
          })
        } else {
          console.log(`[RideDetailView] Supabase miles update successful`)
          toast({
            title: "Success",
            description: "Mileage updated successfully",
          })
        }
      } catch (supabaseError) {
        console.error(`[RideDetailView] Supabase miles error:`, supabaseError)
      }
      
      // Update local ride state
      setRide((prev) => ({
        ...prev,
        ...(milesData.start !== undefined && { start_miles: milesData.start }),
        ...(milesData.end !== undefined && { end_miles: milesData.end }),
      }))
      
    } catch (error) {
      console.error(`[RideDetailView] Error in handleMilesEdit:`, error)
      toast({
        title: "Error",
        description: "Failed to update mileage. Your changes are saved locally and will sync when connection is restored.",
        variant: "destructive"
      })
      
      // Update local ride state even if callback failed
      setRide((prev) => ({
        ...prev,
        ...(milesData.start !== undefined && { start_miles: milesData.start }),
        ...(milesData.end !== undefined && { end_miles: milesData.end }),
      }))
    }
    
    // Update persisted data
    const persistedData = {
      id: ride.id,
      status: ride.status,
      savedMiles: {
        ...savedMiles,
        ...(milesData.start !== undefined && 
           ((ride.status === 'started' && { started: milesData.start }) || 
            (ride.status === 'return_started' && { return_started: milesData.start }))),
        ...(milesData.end !== undefined && 
           ((ride.status === 'completed' && { completed: milesData.end }) || 
            (ride.status === 'return_completed' && { return_completed: milesData.end }))),
      },
      timestamps,
      signature,
      isSignatureSaved
    }
    
    localStorage.setItem(`ride_${ride.id}`, JSON.stringify(persistedData))
  }

  const generatePDF = () => {
    if (!isSignatureSaved) {
      toast({
        title: "Signature Required",
        description: "Please save the signature before generating the PDF.",
        variant: "destructive"
      })
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
          {ride.trip_id && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-gray-100">
                    Trip ID: {ride.trip_id}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This identifier connects related trips</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {ride.is_return_trip ? (
            <Badge className="bg-pink-100 text-pink-800">Return Trip</Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800">Initial Trip</Badge>
          )}
          <Badge variant={ride.status === 'completed' ? "default" : "secondary"}>
            {ride.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
          <Button variant="outline" onClick={generatePDF}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
      
      {/* Related trips section */}
      {relatedRides.length > 0 && (
        <Card className="border-dashed border-blue-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link className="h-4 w-4" />
              Related Trip
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {relatedRides[0].is_return_trip ? 'Return Trip' : 'Initial Trip'} • {' '}
                  {format(new Date(relatedRides[0].scheduled_pickup_time), 'MMM d, h:mm a')}
                </p>
                <Badge className="mt-1" variant="outline">
                  Status: {relatedRides[0].status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateToRelatedRide(relatedRides[0].id)}
                className="flex items-center gap-1"
              >
                <ArrowLeftRight className="h-3 w-3" />
                Switch to {relatedRides[0].is_return_trip ? 'Return' : 'Initial'} Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
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
                onMilesEdit={(status, miles) => {
                  if (status === 'started' || status === 'return_started') {
                    handleMilesEdit(ride.id, { start: miles });
                  } else if (status === 'completed' || status === 'return_completed') {
                    handleMilesEdit(ride.id, { end: miles });
                  } else {
                    // For intermediate statuses just update the local state
                    setSavedMiles((prev: typeof savedMiles) => ({ ...prev, [status]: miles }));
                  }
                }}
                savedMiles={savedMiles}
                timestamps={timestamps}
              />
            </div>

            {/* E-Signature Section */}
            <div className="pt-4 border-t mt-6">
              <div className="text-sm text-gray-500 mb-4">Member Signature</div>
              <div className="border rounded-md p-4">
                {signature ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Signature Collected:</p>
                      <div className="border p-2 bg-white">
                        <img src={signature} alt="Member Signature" className="max-h-24" />
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleSignatureClear}>Clear Signature</Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please have the member sign below to confirm this trip:
                    </p>
                    <SignaturePad onSave={handleSignatureSave} onClear={handleSignatureClear} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 