'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Image from 'next/image'
import { UserNav } from '@/app/components/user-nav'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  CarIcon, 
  PhoneIcon,
  CreditCardIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
  appointment_time: string
  notes: string
  status: string
  payment_method: string
  payment_status: string
  created_at: string
  updated_at: string
  is_return_trip: boolean
  return_pickup_tba: boolean
  driver: {
    id: string
    full_name: string
    phone: string
    email: string
  } | null
  provider: {
    id: string
    name: string
    phone: string
  } | null
  trip_id: string
  recurring: string
}

// Helper function to format address
function formatAddress(address: Address | null): string {
  if (!address) return 'Address not available';
  return `${address.address}, ${address.city}, ${address.state} ${address.zip}`;
}

// Helper function to get status display
function getStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'approved': 'Approved',
    'assigned': 'Driver Assigned',
    'started': 'Driver En Route',
    'picked_up': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'return_started': 'Return Trip: Driver En Route',
    'return_picked_up': 'Return Trip: In Progress',
    'return_completed': 'Return Trip: Completed'
  };
  
  return statusMap[status] || status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.replace(/_/g, ' ').slice(1);
}

// Helper function to get status color
function getStatusColor(status: string): string {
  const statusColorMap: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-blue-100 text-blue-800',
    'assigned': 'bg-purple-100 text-purple-800',
    'started': 'bg-indigo-100 text-indigo-800',
    'picked_up': 'bg-cyan-100 text-cyan-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'return_started': 'bg-indigo-100 text-indigo-800',
    'return_picked_up': 'bg-cyan-100 text-cyan-800',
    'return_completed': 'bg-green-100 text-green-800'
  };
  
  return statusColorMap[status] || 'bg-gray-100 text-gray-800';
}

export default function RideDetailsPage({ params }: { params: { id: string } }) {
  const { isLoggedIn, isLoading: authLoading, role, profile } = useAuth()
  const router = useRouter()
  const [ride, setRide] = useState<Ride | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/')
        return
      }
      
      if (role !== 'member') {
        const dashboardPath = role === 'super_admin' 
          ? '/super-admin-dashboard'
          : role === 'admin'
            ? '/admin-dashboard'
            : '/driver-dashboard'
        router.push(dashboardPath)
        return
      }
      
      fetchRideDetails()
    }
  }, [isLoggedIn, role, router, authLoading, params.id])
  
  const fetchRideDetails = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!rides_driver_id_fkey(id, full_name, phone, email),
          provider:transportation_providers!rides_provider_id_fkey(id, name, phone)
        `)
        .eq('id', params.id)
        .single()
      
      if (error) {
        throw error
      }
      
      if (data) {
        // Verify the ride belongs to the logged-in member
        if (data.member_id !== profile?.id) {
          setError('You do not have permission to view this ride')
          setIsLoading(false)
          return
        }
        
        setRide(data as Ride)
      } else {
        setError('Ride not found')
      }
    } catch (err: any) {
      console.error('Error fetching ride details:', err)
      setError(err.message || 'An error occurred while fetching ride details')
    } finally {
      setIsLoading(false)
    }
  }
  
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/member-dashboard/rides')}>
            Back to Rides
          </Button>
        </div>
      </div>
    )
  }
  
  if (!ride) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <p className="text-lg text-gray-600 mb-4">Ride not found</p>
          <Button onClick={() => router.push('/member-dashboard/rides')}>
            Back to Rides
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
          <h1 className="text-4xl font-bold">Member Dashboard</h1>
        </div>
        <UserNav />
      </div>
      
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Ride Details</h2>
          <Badge className={getStatusColor(ride.status)}>
            {getStatusDisplay(ride.status)}
          </Badge>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Trip Information
            </CardTitle>
            <CardDescription>
              Trip ID: {ride.trip_id || 'Not available'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Appointment Date & Time</h3>
                <p className="text-lg">
                  {format(new Date(ride.appointment_time), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-lg font-bold">
                  {format(new Date(ride.appointment_time), 'h:mm a')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Scheduled Pickup Time</h3>
                <p className="text-lg font-bold">
                  {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
                </p>
                {ride.is_return_trip && (
                  <Badge variant="outline" className="mt-1">Return Trip</Badge>
                )}
                {ride.return_pickup_tba && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 mt-1 ml-2">
                    Pickup Time TBA
                  </Badge>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pickup Location</h3>
              <div className="flex items-start gap-2 mt-1">
                <MapPinIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-lg">{formatAddress(ride.pickup_address)}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Destination</h3>
              <div className="flex items-start gap-2 mt-1">
                <MapPinIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-lg">{formatAddress(ride.dropoff_address)}</p>
              </div>
            </div>
            
            {ride.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1">{ride.notes}</p>
              </div>
            )}
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCardIcon className="h-5 w-5 text-gray-400" />
                  <p className="capitalize">{ride.payment_method}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
                <Badge variant={ride.payment_status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                  {ride.payment_status.toUpperCase()}
                </Badge>
              </div>
              
              {ride.recurring && ride.recurring !== 'none' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Recurring Schedule</h3>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {ride.recurring}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {ride.driver && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Driver Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 rounded-full p-4">
                  <UserIcon className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{ride.driver.full_name}</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <PhoneIcon className="h-4 w-4" />
                    <p>{ride.driver.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {ride.provider && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CarIcon className="h-5 w-5" />
                Transportation Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 rounded-full p-4">
                  <CarIcon className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{ride.provider.name}</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <PhoneIcon className="h-4 w-4" />
                    <p>{ride.provider.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
} 