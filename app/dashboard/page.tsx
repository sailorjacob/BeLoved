'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { StatsCards } from '@/app/dashboard/components/stats-cards'
import { RideTrendsChart } from '@/app/dashboard/components/ride-trends-chart'
import { useAuth } from '@/app/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PlusCircle, Calendar, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { UserNav } from '@/app/components/user-nav'

type Ride = Database['public']['Tables']['rides']['Row']
type Driver = Database['public']['Tables']['profiles']['Row'] & {
  driver_profile: Database['public']['Tables']['driver_profiles']['Row']
}

// Extended ride type with driver info for member dashboard
interface MemberRide extends Ride {
  driver?: {
    id: string;
    full_name: string;
    phone?: string;
  };
}

export default function DashboardPage() {
  const { isLoggedIn, role, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [upcomingRides, setUpcomingRides] = useState<MemberRide[]>([])
  const [pastRides, setPastRides] = useState<MemberRide[]>([])
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData()
    }
  }, [isLoggedIn])

  async function fetchDashboardData() {
    setIsLoading(true)
    try {
      if (role === 'member') {
        await fetchMemberDashboard()
      } else {
        await fetchAdminDashboard()
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchMemberDashboard() {
    if (!profile?.id) return

    console.log('[DashboardPage] Fetching member dashboard for ID:', profile.id)

    // Fetch upcoming rides for this member
    const { data: upcomingRidesData, error: upcomingError } = await supabase
      .from('rides')
      .select(`
        *,
        driver:profiles!rides_driver_id_fkey(id, full_name, phone)
      `)
      .eq('member_id', profile.id)
      .gte('scheduled_pickup_time', new Date().toISOString())
      .order('scheduled_pickup_time', { ascending: true })

    if (upcomingError) {
      console.error('Error fetching upcoming rides:', upcomingError)
    } else {
      console.log('[DashboardPage] Upcoming rides:', upcomingRidesData)
      setUpcomingRides(upcomingRidesData as MemberRide[] || [])
    }

    // Fetch past rides for this member
    const { data: pastRidesData, error: pastError } = await supabase
      .from('rides')
      .select(`
        *,
        driver:profiles!rides_driver_id_fkey(id, full_name, phone)
      `)
      .eq('member_id', profile.id)
      .lt('scheduled_pickup_time', new Date().toISOString())
      .order('scheduled_pickup_time', { ascending: false })
      .limit(10)

    if (pastError) {
      console.error('Error fetching past rides:', pastError)
    } else {
      console.log('[DashboardPage] Past rides:', pastRidesData)
      setPastRides(pastRidesData as MemberRide[] || [])
    }

    // Calculate some basic stats
    setStats({
      total_rides: (upcomingRidesData?.length || 0) + (pastRidesData?.length || 0),
      upcoming_rides: upcomingRidesData?.length || 0,
      completed_rides: pastRidesData?.filter(r => r.status === 'completed')?.length || 0
    })
  }

  async function fetchAdminDashboard() {
    try {
      // Fetch rides
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .order('scheduled_pickup_time', { ascending: false })

      if (ridesError) throw ridesError
      setRides(ridesData || [])

      // Fetch drivers for driver options
      const { data: drivers } = await supabase
        .from('profiles')
        .select(`
          *,
          driver_profile:driver_profiles(*)
        `)
        .eq('user_role', 'driver')

      setStats({
        rides: ridesData || [],
        drivers: drivers || []
      })
    } catch (error) {
      console.error('Error fetching admin dashboard:', error)
    }
  }

  function formatAddress(address: any) {
    if (!address) return 'No address provided';
    return `${address.address}, ${address.city}, ${address.state} ${address.zip}`;
  }

  function getRideStatusBadge(status: string) {
    const statusMap: Record<string, { color: string, text: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'assigned': { color: 'bg-blue-100 text-blue-800', text: 'Assigned' },
      'started': { color: 'bg-purple-100 text-purple-800', text: 'En Route' },
      'picked_up': { color: 'bg-indigo-100 text-indigo-800', text: 'In Progress' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };

    const defaultBadge = { color: 'bg-gray-100 text-gray-800', text: status };
    const badge = statusMap[status] || defaultBadge;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Member Dashboard UI
  if (role === 'member') {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/schedule-ride">
              <Button className="flex items-center gap-2">
                <PlusCircle size={18} />
                Schedule a Ride
              </Button>
            </Link>
            <UserNav />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Total Rides</h2>
            <p className="text-4xl font-bold">{stats?.total_rides || 0}</p>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Upcoming Rides</h2>
            <p className="text-4xl font-bold">{stats?.upcoming_rides || 0}</p>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Completed Rides</h2>
            <p className="text-4xl font-bold">{stats?.completed_rides || 0}</p>
          </Card>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">Upcoming Rides</TabsTrigger>
            <TabsTrigger value="past">Past Rides</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingRides.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg text-gray-500">You don't have any upcoming rides.</p>
                <Link href="/schedule-ride">
                  <Button className="mt-4">Schedule a Ride</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingRides.map((ride) => (
                      <TableRow key={ride.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center">
                              <Calendar size={14} className="mr-1" />
                              {format(new Date(ride.scheduled_pickup_time), 'MMM d, yyyy')}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Clock size={14} className="mr-1" />
                              {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start">
                            <MapPin size={16} className="mr-1 mt-0.5 shrink-0 text-gray-400" />
                            <span className="text-sm">{formatAddress(ride.pickup_address)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start">
                            <MapPin size={16} className="mr-1 mt-0.5 shrink-0 text-gray-400" />
                            <span className="text-sm">{formatAddress(ride.dropoff_address)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRideStatusBadge(ride.status)}</TableCell>
                        <TableCell>
                          {ride.driver ? (
                            <span className="text-sm">{ride.driver.full_name}</span>
                          ) : (
                            <span className="text-sm text-gray-500">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/member-dashboard/rides/${ride.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastRides.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg text-gray-500">You don't have any past rides.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastRides.map((ride) => (
                      <TableRow key={ride.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center">
                              <Calendar size={14} className="mr-1" />
                              {format(new Date(ride.scheduled_pickup_time), 'MMM d, yyyy')}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Clock size={14} className="mr-1" />
                              {format(new Date(ride.scheduled_pickup_time), 'h:mm a')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start">
                            <MapPin size={16} className="mr-1 mt-0.5 shrink-0 text-gray-400" />
                            <span className="text-sm">{formatAddress(ride.pickup_address)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start">
                            <MapPin size={16} className="mr-1 mt-0.5 shrink-0 text-gray-400" />
                            <span className="text-sm">{formatAddress(ride.dropoff_address)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRideStatusBadge(ride.status)}</TableCell>
                        <TableCell>
                          {ride.driver ? (
                            <span className="text-sm">{ride.driver.full_name}</span>
                          ) : (
                            <span className="text-sm text-gray-500">No driver</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/member-dashboard/rides/${ride.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Admin Dashboard UI (original)
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <UserNav />
      </div>
      <StatsCards rides={stats?.rides || []} drivers={stats?.drivers || []} />
      <RideTrendsChart rides={stats?.rides || []} />
    </div>
  )
} 