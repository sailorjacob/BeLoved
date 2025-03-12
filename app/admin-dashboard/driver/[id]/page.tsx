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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

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
  pickup_time?: string
  pickup_location?: string
  dropoff_location?: string
  status: string
  member_id: string
  member?: {
    full_name?: string
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
      
      // Skip fetching rides for now as they display differently in the UI
      // This avoids the "column rides.pickup_time does not exist" error
      setRides([])
      
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
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Member Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{driver.full_name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={driver.driver_profile?.status === 'active' ? 'success' : 'destructive'}>
                    {driver.driver_profile?.status?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center">
                    <Mail className="mr-1 h-4 w-4 text-muted-foreground" /> 
                    {driver.email || 'No email address'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center">
                    <Phone className="mr-1 h-4 w-4 text-muted-foreground" /> 
                    {driver.phone || 'No phone number'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">User Type</p>
                  <p className="font-medium flex items-center">
                    <User className="mr-1 h-4 w-4 text-muted-foreground" /> 
                    Driver
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" /> 
                    {format(new Date(driver.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              {driver.provider_id && (
                <div>
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
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Information</p>
                  <p className="font-medium flex items-center">
                    <Car className="mr-1 h-4 w-4 text-muted-foreground" /> 
                    {driver.driver_profile.vehicle_type}
                  </p>
                </div>
              )}
              
              {driver.driver_profile?.license_number && (
                <div>
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
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Home Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground italic">
                No address information provided
              </p>
            </CardContent>
          </Card>
          
          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Activity</CardTitle>
              <CardDescription>
                Summary of driver's recent activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span>Total Rides</span>
                    <span className="ml-auto font-bold">{driver.driver_profile?.completed_rides || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Completed Rides</span>
                    <span className="ml-auto font-bold">{driver.driver_profile?.completed_rides || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <span>Pending Rides</span>
                    <span className="ml-auto font-bold">0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                    <span>Cancelled Rides</span>
                    <span className="ml-auto font-bold">0</span>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  View All Rides
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Rides</CardTitle>
              <CardDescription>
                The driver's most recent transportation activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                No rides found for this driver.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Tabs defaultValue="recent" className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="recent">Recent Rides</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="support">Support History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <Car className="h-5 w-5" />
            <h2>Recent Rides</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            The driver's most recent transportation activities
          </p>
          
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            No rides found for this driver.
          </div>
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <Clock className="h-5 w-5" />
            <h2>Notes</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Additional information and notes about this driver
          </p>
          
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            No notes found for this driver.
          </div>
        </TabsContent>
        
        <TabsContent value="support" className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <User className="h-5 w-5" />
            <h2>Support History</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            History of support interactions with this driver
          </p>
          
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            No support history found for this driver.
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
} 