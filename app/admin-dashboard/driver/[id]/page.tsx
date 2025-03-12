'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/app/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserNav } from '@/app/components/user-nav'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { User, Calendar, Building, Phone, Mail, MapPin, Car, Clock } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Member {
  id: string
  full_name: string
  email: string
  phone: string
  user_role: string
  member_id?: string
  created_at: string
  provider_id?: string
  provider?: {
    name: string
    organization_code?: string
  }
  organization_code?: string
  driver_profile?: {
    status: string
    completed_rides: number
    vehicle_type?: string
    license_number?: string
    license_expiry?: string
  }
}

interface Ride {
  id: string
  pickup_time: string
  pickup_location: string
  dropoff_location: string
  status: string
  member_id: string
  member?: {
    full_name: string
  }
}

export default function DriverProfilePage({ params }: { params: { id: string } }) {
  const { isLoggedIn, isLoading: authLoading, role } = useAuth()
  const router = useRouter()
  const [driver, setDriver] = useState<Member | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/')
        return
      }
      
      if (role !== 'admin') {
        router.push('/')
        return
      }
      
      // If we got here, user is logged in as admin
      fetchDriverData(params.id)
    }
  }, [isLoggedIn, role, router, authLoading, params.id])

  const fetchDriverData = async (driverId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch driver profile
      const { data: driverData, error: driverError } = await supabase
        .from('profiles')
        .select(`
          *,
          provider:transportation_providers(name, organization_code),
          driver_profile:driver_profiles(*)
        `)
        .eq('id', driverId)
        .eq('user_role', 'driver')
        .single()
      
      if (driverError) throw driverError
      
      setDriver(driverData as Member)
      
      // Fetch recent rides
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select(`
          *,
          member:profiles!rides_member_id_fkey(full_name)
        `)
        .eq('driver_id', driverId)
        .order('pickup_time', { ascending: false })
        .limit(10)
      
      if (ridesError) throw ridesError
      
      setRides(ridesData as Ride[])
    } catch (error: any) {
      console.error('Error fetching driver data:', error)
      setError(`Failed to load driver data: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading driver profile...</p>
        </div>
      </div>
    )
  }

  if (error || !driver) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p>{error || "Driver not found"}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/admin-dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"
              alt="BeLoved Transportation Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{driver.full_name}</h1>
            <p className="text-muted-foreground">
              {driver.member_id && <span className="font-mono">{driver.member_id}</span>} • 
              <span className="ml-1">Driver</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin-dashboard">
              Back to Dashboard
            </Link>
          </Button>
          <UserNav />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Driver Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={driver.driver_profile?.status === 'active' ? 'success' : 'destructive'}>
                  {driver.driver_profile?.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contact Information</p>
                <p className="font-medium flex items-center">
                  <Phone className="mr-1 h-4 w-4 text-muted-foreground" /> 
                  {driver.phone || 'No phone number'}
                </p>
                <p className="font-medium flex items-center">
                  <Mail className="mr-1 h-4 w-4 text-muted-foreground" /> 
                  {driver.email || 'No email address'}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">User Type</p>
                <p className="font-medium flex items-center">
                  <User className="mr-1 h-4 w-4 text-muted-foreground" /> 
                  Driver
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium flex items-center">
                  <Calendar className="mr-1 h-4 w-4 text-muted-foreground" /> 
                  {format(new Date(driver.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              
              {driver.provider_id && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium flex items-center">
                    <Building className="mr-1 h-4 w-4 text-muted-foreground" /> 
                    {driver.provider?.name || 'Unknown Provider'}
                  </p>
                  {(driver.provider?.organization_code || driver.organization_code) && (
                    <p className="text-sm font-mono text-muted-foreground">
                      Organization Code: {driver.provider?.organization_code || driver.organization_code}
                    </p>
                  )}
                </div>
              )}
              
              {driver.driver_profile?.vehicle_type && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vehicle Information</p>
                  <p className="font-medium flex items-center">
                    <Car className="mr-1 h-4 w-4 text-muted-foreground" /> 
                    {driver.driver_profile.vehicle_type}
                  </p>
                </div>
              )}
              
              {driver.driver_profile?.license_number && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">License</p>
                  <p className="font-medium">
                    {driver.driver_profile.license_number}
                    {driver.driver_profile.license_expiry && (
                      <span className="block text-sm text-muted-foreground">
                        Expires: {format(new Date(driver.driver_profile.license_expiry), 'MMM d, yyyy')}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Rides</CardTitle>
              <CardDescription>
                Completed Rides: {driver.driver_profile?.completed_rides || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rides.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Dropoff</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rides.map((ride) => (
                      <TableRow key={ride.id}>
                        <TableCell>
                          {format(new Date(ride.pickup_time), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>{ride.member?.full_name || 'Unknown'}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={ride.pickup_location}>
                          {ride.pickup_location}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={ride.dropoff_location}>
                          {ride.dropoff_location}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            ride.status === 'completed' ? 'success' : 
                            ride.status === 'cancelled' ? 'destructive' : 
                            'secondary'
                          }>
                            {ride.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No rides found for this driver.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 