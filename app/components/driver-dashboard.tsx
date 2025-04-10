'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, PhoneIcon, RefreshCw } from 'lucide-react'
import { RideProgress } from './ride-progress'
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isToday, compareAsc, startOfDay, addDays } from 'date-fns'
import { RideDetailView } from './ride-detail-view'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/auth-context'
import type { Database } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { formatAddress } from "@/lib/utils"

interface Address {
  address: string
  city: string
  state: string
  zip: string
}

type Ride = Database['public']['Tables']['rides']['Row']

// Extended ride type with member info for driver dashboard (similar to MemberRide in dashboard/page.tsx)
interface DriverRide extends Omit<Ride, 'member'> {
  member?: {
    id: string
    full_name: string
    phone?: string
    email?: string
  }
  is_return_trip?: boolean
  return_pickup_tba?: boolean
  trip_id?: string
  pickup_miles?: number | null
  dropoff_miles?: number | null
  return_pickup_miles?: number | null
  return_dropoff_miles?: number | null
  pickup_time?: string | null
  dropoff_time?: string | null
  return_pickup_time?: string | null
  return_dropoff_time?: string | null
}

interface DriverStats {
  completed_rides: number
  total_miles: number
}

export function DriverDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [rides, setRides] = useState<DriverRide[]>([])
  const [selectedRide, setSelectedRide] = useState<DriverRide | null>(null)
  const [driverStats, setDriverStats] = useState<DriverStats>({ completed_rides: 0, total_miles: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [activeRides, setActiveRides] = useState<DriverRide[]>([])
  const [upcomingRides, setUpcomingRides] = useState<DriverRide[]>([])
  const [completedRides, setCompletedRides] = useState<DriverRide[]>([])
  const [todayRides, setTodayRides] = useState<DriverRide[]>([])
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [debugData, setDebugData] = useState<{
    allRides: Array<{
      id: string;
      driver_id: string | null;
      member_id: string | null;
      status: string | null;
      is_return_trip: boolean | null;
      trip_id: string | null;
      scheduled_pickup_time: string | null;
    }>;
    ridesWithDrivers: number;
    ridesWithMissingFields: number;
  }>({
    allRides: [],
    ridesWithDrivers: 0,
    ridesWithMissingFields: 0
  });

  useEffect(() => {
    if (!user) return

    fetchRides()
    fetchStats()

    // Set up real-time subscription for rides
    const ridesSubscription = supabase
      .channel('rides_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${user.id}`
        },
        () => {
          // Refresh rides when changes occur
          fetchRides()
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      ridesSubscription.unsubscribe()
    }
  }, [user])
  
  useEffect(() => {
    if (rides.length > 0) {
      categorizeRides()
    }
  }, [rides, selectedDate])

  const fetchRides = async () => {
    if (!user?.id) {
      console.error('[DriverDashboard] No user ID available for fetching rides')
      return
    }
    
    setIsLoading(true)
    try {
      console.log('[DriverDashboard] Fetching assigned rides for driver:', user.id)
      
      // Get the current session to ensure we have a fresh token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('[DriverDashboard] Error getting session:', sessionError)
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please try logging out and back in.",
          variant: "destructive"
        })
        return
      }
      
      if (!session) {
        console.error('[DriverDashboard] No active session found')
        toast({
          title: "Authentication Error",
          description: "No active session found. Please login again.",
          variant: "destructive"
        })
        return
      }
      
      console.log('[DriverDashboard] Session active, access token available:', !!session.access_token)
      
      // First, try with full explicit selection to avoid join issues
      const { data, error } = await supabase
          .from('rides')
          .select(`
            id, 
            member_id,
            driver_id,
            pickup_address,
            dropoff_address,
            scheduled_pickup_time,
            status,
          start_miles,
          end_miles,
          start_time,
          end_time,
            notes,
            payment_method,
            payment_status,
          recurring,
          created_at,
          updated_at,
          is_return_trip,
          trip_id,
          member:profiles!rides_member_id_fkey(id, full_name, phone, email)
        `)
        .eq('driver_id', user.id)
        .order('scheduled_pickup_time', { ascending: true })
      
      if (error) {
        console.error('[DriverDashboard] Error fetching assigned rides:', error)
        
        // If the regular query fails, try a different approach - use a direct query
        // This can bypass some RLS issues in case there's a problem with the policy
        console.log('[DriverDashboard] Attempting alternative fetch method...')
        
        const { data: alternativeData, error: alternativeError } = await supabase
          .rpc('get_driver_rides', { driver_id_param: user.id })
        
        if (alternativeError) {
          console.error('[DriverDashboard] Alternative fetch also failed:', alternativeError)
          toast({
            title: "Error",
            description: "Failed to load assigned rides. Please try again later.",
            variant: "destructive"
          })
          return
        }
        
        if (alternativeData && alternativeData.length > 0) {
          console.log(`[DriverDashboard] Found ${alternativeData.length} rides using alternative method`)
          setRides(alternativeData as unknown as DriverRide[])
          setIsLoading(false)
          return
        } else {
          console.log('[DriverDashboard] No rides found using alternative method either')
          toast({
            title: "No Rides Found",
            description: "You don't have any rides assigned to you yet.",
          })
          setRides([])
          setIsLoading(false)
          return
        }
      }
      
      console.log(`[DriverDashboard] Found ${data?.length || 0} rides`)
      
      // Check if rides have member data
      const hasMemberData = data && data.length > 0 && data.some(ride => ride.member && typeof ride.member === 'object')
      console.log(`[DriverDashboard] Member data present: ${hasMemberData ? 'Yes' : 'No'}`)
      
      // If we got rides but member data is missing, try to get it separately
      if (data && data.length > 0 && (!hasMemberData || data.some(ride => !ride.member || typeof ride.member !== 'object'))) {
        console.log('[DriverDashboard] Member data is missing or malformed, fetching member info separately')
        
        // Map to store member info
        const memberInfo = new Map()
        
        // Get all unique member IDs
        const memberIds = [...new Set(data.map(ride => ride.member_id).filter(Boolean))]
        console.log(`[DriverDashboard] Fetching data for ${memberIds.length} members:`, memberIds)
        
        if (memberIds.length > 0) {
          try {
            // Try first with the standard join approach
            const { data: membersData, error: membersError } = await supabase
              .from('profiles')
              .select('id, full_name, phone, email')
              .in('id', memberIds)
            
            if (membersError) {
              console.error('[DriverDashboard] Error fetching member data:', membersError)
              
              // If that fails, try fetching each member individually
              console.log('[DriverDashboard] Attempting to fetch members individually...')
              
              for (const memberId of memberIds) {
                if (!memberId) continue;
                
                const { data: singleMember, error: singleMemberError } = await supabase
                  .from('profiles')
                  .select('id, full_name, phone, email')
                  .eq('id', memberId)
                  .single()
                
                if (singleMemberError) {
                  console.error(`[DriverDashboard] Error fetching member ${memberId}:`, singleMemberError)
                } else if (singleMember) {
                  memberInfo.set(singleMember.id, singleMember)
                  console.log(`[DriverDashboard] Added member ${singleMember.id} (${singleMember.full_name}) individually`)
                }
              }
            } else if (membersData) {
              console.log(`[DriverDashboard] Successfully fetched ${membersData.length} member profiles`)
              
              // Create a lookup map
              membersData.forEach(member => memberInfo.set(member.id, member))
            }
            
            // Update the ride data with member info
            data.forEach(ride => {
              if (ride.member_id) {
                const member = memberInfo.get(ride.member_id)
                if (member) {
                  ride.member = member
                  console.log(`[DriverDashboard] Added member info for ride ${ride.id}: ${member.full_name}`)
                } else {
                  // Create placeholder member data if not found
                  console.log(`[DriverDashboard] No member data found for ID ${ride.member_id}, creating placeholder`)
                  // Cast to the correct member type
                  ride.member = {
                    id: ride.member_id,
                    full_name: 'Member ' + ride.member_id.substring(0, 6),
                    phone: 'No phone available',
                    email: 'No email available'
                  } as any; // Use as any to bypass type checking temporarily
                }
              } else if (!ride.member) {
                // If no member_id at all, still create a placeholder
                console.log(`[DriverDashboard] Ride ${ride.id} has no member_id, creating placeholder`)
                // Cast to the correct member type
                ride.member = {
                  id: 'unknown',
                  full_name: 'Unknown Member',
                  phone: 'No phone available',
                  email: 'No email available'
                } as any; // Use as any to bypass type checking temporarily
              }
            })
          } catch (memberErr) {
            console.error('[DriverDashboard] Exception fetching member data:', memberErr)
            
            // Add placeholder data even if all member fetching fails
            data.forEach(ride => {
              if (!ride.member || typeof ride.member !== 'object') {
                // Cast to the correct member type
                ride.member = {
                  id: ride.member_id || 'unknown',
                  full_name: 'Member ' + (ride.member_id ? ride.member_id.substring(0, 6) : 'Unknown'),
                  phone: 'No phone available',
                  email: 'No email available'
                } as any; // Use as any to bypass type checking temporarily
              }
            })
          }
        } else {
          // If no member IDs at all, add placeholder data
          data.forEach(ride => {
            if (!ride.member || typeof ride.member !== 'object') {
              // Cast to the correct member type
              ride.member = {
                id: 'unknown',
                full_name: 'Unknown Member',
                phone: 'No phone available',
                email: 'No email available'
              } as any; // Use as any to bypass type checking temporarily
            }
          })
        }
      }
      
      // Set debug data to help troubleshoot
      if (process.env.NODE_ENV === 'development') {
        try {
          // Get all recent rides for debugging (only in development)
          const { data: allRidesData } = await supabase
            .from('rides')
            .select('id, driver_id, member_id, status, scheduled_pickup_time, is_return_trip, trip_id')
            .order('scheduled_pickup_time', { ascending: false })
            .limit(20)
          
          setDebugData({
            allRides: allRidesData || [],
            ridesWithDrivers: (allRidesData || []).filter(r => r.driver_id).length,
            ridesWithMissingFields: (allRidesData || []).filter(r => !r.scheduled_pickup_time || !r.status).length
          })
        } catch (debugErr) {
          console.error('[DriverDashboard] Error fetching debug data:', debugErr)
        }
      }
      
      setRides(data as unknown as DriverRide[] || [])

      // Use our custom functions to get details about specifically trip T174207
      try {
        // Get details about specifically trip T174207
        console.log('[DriverDashboard] Fetching details about T174207 directly...');
        const { data: tripData, error: tripError } = await supabase
          .rpc('get_trip_details', { trip_id_param: 'T174207' });
          
        if (tripError) {
          console.error('[DriverDashboard] Error fetching T174207 details:', tripError);
        } else {
          console.log('[DriverDashboard] T174207 details from direct query:', tripData);
        }
        
        // Get a summary of all trips assigned to this driver
        const { data: allTrips, error: tripsError } = await supabase
          .rpc('get_all_driver_trips', { driver_id_param: user.id });
          
        if (tripsError) {
          console.error('[DriverDashboard] Error fetching all driver trips:', tripsError);
        } else {
          console.log('[DriverDashboard] All driver trips summary:', allTrips);
        }
      } catch (err) {
        console.error('[DriverDashboard] Error with direct trip queries:', err);
      }
      
    } catch (err) {
      console.error('[DriverDashboard] Exception fetching rides:', err)
      toast({
        title: "Error",
        description: "Failed to load assigned rides",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!user?.id) return
    
    try {
      // First try to see if driver profile exists
      const { data: profileCheck, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('id', user.id)
      
      if (profileError) {
        console.error('[DriverDashboard] Error checking driver profile:', profileError)
        setStatsError('Could not verify driver profile')
        return
      }

      // If profile doesn't exist, create default stats
      if (!profileCheck || profileCheck.length === 0) {
        console.log('[DriverDashboard] No driver profile found, using default stats')
        setDriverStats({ completed_rides: 0, total_miles: 0 })
        return
      }

      // If profile exists, fetch the stats
      const { data: stats, error } = await supabase
        .from('driver_profiles')
        .select('completed_rides, total_miles')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('[DriverDashboard] Error fetching driver stats:', error)
        setStatsError('Could not load driver statistics')
        return
      }

      setDriverStats(stats)
    } catch (err) {
      console.error('[DriverDashboard] Error fetching driver stats:', err)
      setStatsError('Error retrieving statistics')
    }
  }

  const categorizeRides = () => {
    const now = new Date()
    const today = startOfDay(now)
    
    // Debug info
    console.log('[DriverDashboard] Categorizing rides, total:', rides.length)
    
    // Log status of all rides to help debug
    if (rides.length > 0) {
      rides.forEach(ride => {
        console.log(`[DriverDashboard] Ride ${ride.id} status: ${ride.status}, trip_id: ${ride.trip_id}, date: ${format(new Date(ride.scheduled_pickup_time || ''), 'yyyy-MM-dd')}, member: ${ride.member?.full_name || 'Unknown'}`);
      });
    }
    
    if (rides.length > 0) {
      console.log('[DriverDashboard] First ride details:', {
        id: rides[0].id,
        status: rides[0].status,
        pickup_time: rides[0].scheduled_pickup_time,
        is_return_trip: rides[0].is_return_trip,
        member: rides[0].member?.full_name || 'Unknown member'
      })
      
      // Log full ride object for debugging
      console.log('[DriverDashboard] Full ride object:', rides[0])
    }
    
    // Define helper to normalize status text for better matching
    const normalizeStatus = (status: string | null | undefined): string => {
      return (status || '').toLowerCase().trim();
    };
    
    // Expand the active status list to include more possibilities
    const activeStatusValues = [
      'started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up', 
      'active', 'en_route', 'en route', 'driver_en_route', 'pickup', 
      'passenger_onboard', 'in progress'
    ];
    
    const active = rides.filter(ride => 
      activeStatusValues.includes(normalizeStatus(ride.status))
    );
    console.log('[DriverDashboard] Active rides count:', active.length)
    
    // Expand the upcoming status list to include more possibilities
    const upcomingStatusValues = [
      'pending', 'assigned', 'scheduled', 'return_pending', 'driver_assigned'
    ];
    
    const upcoming = rides.filter(ride => 
      upcomingStatusValues.includes(normalizeStatus(ride.status))
    );
    console.log('[DriverDashboard] Upcoming rides count:', upcoming.length)
    if (upcoming.length > 0) {
      console.log('[DriverDashboard] Upcoming rides:', upcoming.map(r => ({
        id: r.id,
        status: r.status,
        trip_id: r.trip_id,
        date: format(new Date(r.scheduled_pickup_time || ''), 'yyyy-MM-dd'),
        member: r.member?.full_name || 'Unknown'
      })))
    }
    
    // Expand the completed status list to include more possibilities
    const completedStatusValues = [
      'completed', 'return_completed', 'done', 'finished', 'return done', 
      'return completed', 'canceled', 'cancelled'
    ];
    
    const completed = rides.filter(ride => 
      completedStatusValues.includes(normalizeStatus(ride.status))
    );
    console.log('[DriverDashboard] Completed rides count:', completed.length)
    
    // Important: If a ride doesn't fit in any other category, force it into the upcoming category
    // This ensures all rides appear somewhere
    const uncategorized = rides.filter(ride => 
      !active.includes(ride) && 
      !upcoming.includes(ride) && 
      !completed.includes(ride)
    )
    
    if (uncategorized.length > 0) {
      console.log('[DriverDashboard] Found uncategorized rides, adding to upcoming:', uncategorized.length)
      console.log('[DriverDashboard] Uncategorized ride details:', uncategorized.map(r => ({
        id: r.id,
        trip_id: r.trip_id,
        status: r.status,
        pickup_time: r.scheduled_pickup_time
      })))
      
      // Add uncategorized rides to the upcoming category so they're visible
      upcoming.push(...uncategorized)
    }
    
    // Today's rides - match the date regardless of whether it's a return trip or not
    const todayRides = rides.filter(ride => {
      if (!ride.scheduled_pickup_time) {
        console.warn('[DriverDashboard] Ride missing scheduled_pickup_time:', ride.id)
        // If scheduled time is missing, it's better to include it in today's rides than to hide it
        return true
      }
      
      try {
      const rideDate = new Date(ride.scheduled_pickup_time)
      const sameDay = (
        rideDate.getFullYear() === selectedDate.getFullYear() &&
        rideDate.getMonth() === selectedDate.getMonth() &&
        rideDate.getDate() === selectedDate.getDate()
      )
      
      return sameDay
      } catch (err) {
        console.error(`[DriverDashboard] Error parsing date for ride ${ride.id}:`, err)
        // If there's an error parsing the date, it's better to include it in today's rides
        return true
      }
    })
    console.log('[DriverDashboard] Today rides count:', todayRides.length)
    
    setActiveRides(active)
    setUpcomingRides(upcoming)
    setCompletedRides(completed)
    setTodayRides(todayRides)
  }

  const renderStatusBadge = (status: string) => {
    let color = ""
    let label = ""
    
    // Normalize status - handle case sensitivity, null, undefined, and whitespace issues
    const normalizedStatus = (status || '').toLowerCase().trim()
    
    switch(normalizedStatus) {
      case 'pending':
      case 'scheduled':
        color = "bg-yellow-200 text-yellow-800"
        label = "Pending"
        break
      case 'assigned':
      case 'driver_assigned':
        color = "bg-blue-200 text-blue-800"
        label = "Assigned"
        break
      case 'started':
      case 'en route':
      case 'en_route':
      case 'driver_en_route':
        color = "bg-indigo-200 text-indigo-800"
        label = "En Route to Pickup"
        break
      case 'picked_up':
      case 'pickup':
      case 'passenger_onboard':
        color = "bg-purple-200 text-purple-800"
        label = "Passenger On Board"
        break
      case 'completed':
      case 'done':
      case 'finished':
        color = "bg-green-200 text-green-800"
        label = "Completed"
        break
      case 'in_progress':
      case 'in progress':
      case 'active':
        color = "bg-orange-200 text-orange-800"
        label = "In Progress"
        break
      case 'return_started':
      case 'return started':
        color = "bg-pink-200 text-pink-800"
        label = "Return Trip Started"
        break
      case 'return_picked_up':
      case 'return pickup':
      case 'return passenger onboard':
        color = "bg-purple-200 text-purple-800"
        label = "Return With Passenger"
        break
      case 'return_completed':
      case 'return completed':
      case 'return done':
        color = "bg-green-200 text-green-800"
        label = "Return Trip Completed"
        break
      case 'cancelled':
      case 'canceled':
        color = "bg-red-200 text-red-800"
        label = "Cancelled"
        break
      default:
        // For unknown status values, try to make a reasonable guess based on the content
        if (normalizedStatus.includes('return') && normalizedStatus.includes('complet')) {
          color = "bg-green-200 text-green-800"
          label = "Return Completed"
        } 
        else if (normalizedStatus.includes('complet') || normalizedStatus.includes('done') || normalizedStatus.includes('finish')) {
          color = "bg-green-200 text-green-800" 
          label = "Completed"
        }
        else if (normalizedStatus.includes('return') && normalizedStatus.includes('pick')) {
          color = "bg-purple-200 text-purple-800"
          label = "Return With Passenger"
        }
        else if (normalizedStatus.includes('pick') || normalizedStatus.includes('board')) {
          color = "bg-purple-200 text-purple-800"
          label = "Passenger On Board"
        }
        else if (normalizedStatus.includes('return') && normalizedStatus.includes('start')) {
          color = "bg-pink-200 text-pink-800"
          label = "Return Started"
        }
        else if (normalizedStatus.includes('en route') || normalizedStatus.includes('start')) {
          color = "bg-indigo-200 text-indigo-800"
          label = "En Route"
        }
        else if (normalizedStatus.includes('assign')) {
          color = "bg-blue-200 text-blue-800"
          label = "Assigned"
        }
        else if (normalizedStatus.includes('pend') || normalizedStatus.includes('schedul')) {
          color = "bg-yellow-200 text-yellow-800" 
          label = "Pending"
        }
        else if (normalizedStatus.includes('cancel')) {
          color = "bg-red-200 text-red-800"
          label = "Cancelled"
        }
        else if (normalizedStatus.includes('progress') || normalizedStatus.includes('active')) {
          color = "bg-orange-200 text-orange-800"
          label = "In Progress"
        }
        else {
          // Last resort fallback
        color = "bg-gray-200 text-gray-800"
          label = status ? status.replace(/_/g, ' ') : 'Unknown'
        }
    }
    
    return (
      <Badge className={`${color} font-normal`}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Badge>
    )
  }

  const sortAndGroupRidesByDate = (rides: DriverRide[]) => {
    // Sort rides by date ascending
    const sortedRides = [...rides].sort((a, b) => 
      compareAsc(new Date(a.scheduled_pickup_time), new Date(b.scheduled_pickup_time))
    )
    
    // Group rides by date
    const groupedRides: { [key: string]: DriverRide[] } = {}
    
    sortedRides.forEach(ride => {
      const date = format(new Date(ride.scheduled_pickup_time), 'yyyy-MM-dd')
      if (!groupedRides[date]) {
        groupedRides[date] = []
      }
      groupedRides[date].push(ride)
    })
    
    return groupedRides
  }
  
  // Group rides by trip_id to connect initial and return trips
  const groupRelatedRides = (rides: DriverRide[]) => {
    const tripGroups: { [tripId: string]: DriverRide[] } = {};
    
    // First, group all rides by trip_id
    rides.forEach(ride => {
      if (ride.trip_id) {
        if (!tripGroups[ride.trip_id]) {
          tripGroups[ride.trip_id] = [];
        }
        tripGroups[ride.trip_id].push(ride);
      }
    });
    
    // Only return groups that have more than one ride (initial + return)
    return Object.entries(tripGroups)
      .filter(([_, rides]) => rides.length > 1)
      .map(([tripId, rides]) => ({
        tripId,
        rides: rides.sort((a, b) => a.is_return_trip ? 1 : -1) // Sort so initial trip is first
      }));
  };

  const handleRideClick = (ride: DriverRide) => {
    setSelectedRide(ride)
  }

  const handleBack = () => {
    setSelectedRide(null)
  }

  const handleRideAction = async (rideId: string, newStatus: DriverRide['status'], milesData?: { 
    start?: number | null
    end?: number | null
    pickup?: number | null
    dropoff?: number | null
    return_pickup?: number | null
    return_dropoff?: number | null
  }) => {
    const updatedRide = rides.find(r => r.id === rideId)
    if (!updatedRide) return

    let finalRide = { ...updatedRide }
    const now = new Date().toISOString()

    // Update mileage and timestamps based on status
    if (milesData) {
      // Create an object to hold all mileage updates
      const mileageUpdates: any = {}

      switch (newStatus) {
        case 'started':
          mileageUpdates.start_miles = milesData.start
          mileageUpdates.start_time = now
          break
        case 'picked_up':
          mileageUpdates.pickup_miles = milesData.pickup
          mileageUpdates.pickup_time = now
          break
        case 'completed':
          mileageUpdates.dropoff_miles = milesData.dropoff
          mileageUpdates.end_miles = milesData.end
          mileageUpdates.dropoff_time = now
          mileageUpdates.end_time = now
          break
        case 'return_started':
          mileageUpdates.return_pickup_miles = milesData.return_pickup
          mileageUpdates.return_pickup_time = now
          break
        case 'return_picked_up':
          mileageUpdates.return_pickup_miles = milesData.return_pickup
          mileageUpdates.return_pickup_time = now
          break
        case 'return_completed':
          mileageUpdates.return_dropoff_miles = milesData.return_dropoff
          mileageUpdates.end_miles = milesData.end
          mileageUpdates.return_dropoff_time = now
          mileageUpdates.end_time = now
          break
      }

      finalRide = {
        ...finalRide,
        ...mileageUpdates
      }
    }

    finalRide.status = newStatus

    const { error } = await supabase
      .from('rides')
      .update(finalRide)
      .eq('id', rideId)

    if (error) {
      console.error('[DriverDashboard] Error updating ride:', error)
      toast({
        title: "Error",
        description: "Failed to update ride status",
        variant: "destructive"
      })
      return
    }

    // Update local state
    setSelectedRide(finalRide)
    setRides(rides.map(r => r.id === rideId ? finalRide : r))
    toast({
      title: "Success",
      description: "Ride status and mileage updated successfully",
    })
  }

  const handleMilesEdit = async (rideId: string, miles: { start?: number | null; end?: number | null }) => {
    await handleRideAction(rideId, selectedRide?.status || 'pending', miles)
  }

  const renderRideCard = (ride: DriverRide, showLinkedTrip = false) => {
    // Safety checks for possible null/undefined values
    const rideTime = ride.scheduled_pickup_time ? 
      format(new Date(ride.scheduled_pickup_time), 'h:mm a') : 
      'No time set'
    
    // Make sure we always have usable member data, even if missing
    let memberName = 'Unknown Member';
    let memberPhone = 'No phone';
    
    if (ride.member && typeof ride.member === 'object') {
      memberName = ride.member.full_name || 'Unknown Member';
      memberPhone = ride.member.phone || 'No phone';
    } else if (ride.member_id) {
      memberName = `Member ${ride.member_id.substring(0, 6)}`;
    }
    
    const pickupAddress = ride.pickup_address ? formatAddress(ride.pickup_address) : 'No pickup address'
    const dropoffAddress = ride.dropoff_address ? formatAddress(ride.dropoff_address) : 'No dropoff address'
    
    // Find linked trip if it exists
    const hasLinkedTrip = ride.trip_id && rides.some(r => 
      r.trip_id === ride.trip_id && 
      r.id !== ride.id && 
      r.is_return_trip !== ride.is_return_trip
    );
    
    const linkedTrip = hasLinkedTrip ? rides.find(r => 
      r.trip_id === ride.trip_id && 
      r.id !== ride.id && 
      r.is_return_trip !== ride.is_return_trip
    ) : null;
    
    return (
      <Card key={ride.id} className={`hover:shadow-md transition-shadow ${ride.is_return_trip ? 'border-pink-200' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center">
                {rideTime}
                {ride.is_return_trip && (
                  <Badge variant="outline" className="ml-2 bg-pink-100 text-pink-800 text-xs">
                    Return Trip
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {memberName}
                <div className="text-xs flex items-center mt-1">
                  <PhoneIcon className="w-3 h-3 mr-1" />
                  {memberPhone}
                </div>
              </CardDescription>
            </div>
            {renderStatusBadge(ride.status || 'unknown')}
          </div>
        </CardHeader>
        <CardContent className="py-2">
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="font-medium">From:</span>
              <span className="flex-1">{pickupAddress}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">To:</span>
              <span className="flex-1">{dropoffAddress}</span>
            </div>
            {ride.notes && (
              <div className="flex gap-2">
                <span className="font-medium">Notes:</span>
                <span className="flex-1">{ride.notes}</span>
              </div>
            )}
            {hasLinkedTrip && linkedTrip && showLinkedTrip && (
              <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                <span className="text-xs font-medium text-gray-500 block mb-1">
                  {linkedTrip.is_return_trip ? 'Return Trip' : 'Initial Trip'}: {' '}
                  {linkedTrip.scheduled_pickup_time ? 
                    format(new Date(linkedTrip.scheduled_pickup_time), 'h:mm a') : 
                    'No time set'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {linkedTrip.status?.replace(/_/g, ' ') || 'No status'}
                </Badge>
              </div>
            )}
            {ride.trip_id && (
              <div className="text-xs text-muted-foreground">
                Trip ID: {ride.trip_id}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            className="w-full"
            onClick={() => handleRideClick(ride)}
          >
            {
              ['started', 'picked_up', 'in_progress', 'return_started', 'return_picked_up'].includes(ride.status || '')
                ? 'Continue Ride'
                : ['completed', 'return_completed'].includes(ride.status || '')
                  ? 'View Details'
                  : 'Manage Ride'
            }
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // DEBUG function for admins to assign rides to the current driver
  const assignRideToDriver = async (rideId: string) => {
    if (!user?.id) return;
    
    try {
      console.log('[DriverDashboard] Attempting to assign ride to current driver:', rideId);
      
      const { data, error } = await supabase
        .from('rides')
        .update({ 
          driver_id: user.id,
          status: 'assigned'
        })
        .eq('id', rideId)
        .select();
      
      if (error) {
        console.error('[DriverDashboard] Error assigning ride:', error);
        toast({
          title: "Error",
          description: "Failed to assign ride: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('[DriverDashboard] Successfully assigned ride to driver:', data);
      toast({
        title: "Success",
        description: "Ride assigned to current driver",
      });
      
      // Refresh rides list
      fetchRides();
    } catch (err) {
      console.error('[DriverDashboard] Exception assigning ride:', err);
      toast({
        title: "Error",
        description: "Failed to assign ride",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4 mx-auto"></div>
          <p className="text-lg font-medium">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your assigned rides</p>
        </div>
      </div>
    )
  }

  if (selectedRide) {
    // Extract member data properly
    let memberData = {
      id: selectedRide.member_id || 'unknown',
      full_name: 'Unknown Member',
      phone: 'No phone available',
      email: 'No email available'
    };
    
    // If member data exists and is an object, extract its properties
    if (selectedRide.member && typeof selectedRide.member === 'object') {
      memberData = {
        id: selectedRide.member.id || selectedRide.member_id || 'unknown',
        full_name: selectedRide.member.full_name || 'Unknown Member',
        phone: selectedRide.member.phone || 'No phone available',
        email: selectedRide.member.email || 'No email available'
      };
    }
    
    // Create a correctly typed ride object for RideDetailView
    const rideForDetailView = {
      ...selectedRide,
      member: memberData
    };
        
    return (
      <RideDetailView
        ride={rideForDetailView}
        onRideAction={handleRideAction}
        onBack={handleBack}
        onMilesEdit={handleMilesEdit}
        onClose={handleBack}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Driver Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
          <CardTitle>Driver Overview</CardTitle>
              {!isToday(selectedDate) && (
                <CardDescription className="text-blue-500 font-medium">
                  Viewing rides for {format(selectedDate, 'MMMM d, yyyy')}
                </CardDescription>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={fetchRides} className="gap-2">
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={!isToday(selectedDate) ? "text-blue-500" : ""}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                    {!isToday(selectedDate) && " (Selected)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        // Switch to the "Selected Date" tab when a date is chosen
                        setActiveTab('today');
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-sm text-gray-500">Completed Rides</div>
                <div className="text-2xl font-bold">{driverStats.completed_rides}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Miles</div>
                <div className="text-2xl font-bold">{driverStats.total_miles}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug UI - Only visible to admins */}
      {user?.id && process.env.NODE_ENV === 'development' && (
        <Card className="border-red-300 bg-red-50">
        <CardHeader>
            <CardTitle className="text-red-700">Debug Tools (Development Only)</CardTitle>
            <CardDescription className="text-red-600">
              These tools are only available in development mode for testing purposes.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Driver Info</h3>
                <p className="text-sm">Current driver ID: <code className="bg-gray-100 p-1 rounded">{user.id}</code></p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Manual Assignment</h3>
                <div className="flex gap-2">
                  <Input 
                    id="ride-id" 
                    placeholder="Enter Ride ID to assign to current driver"
                    className="flex-1"
                  />
                  <Button onClick={() => {
                    const rideId = (document.getElementById('ride-id') as HTMLInputElement).value;
                    if (rideId) assignRideToDriver(rideId);
                  }}>
                    Assign
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Paste a ride ID from the list below to assign it to the current driver
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Check Specific Trip</h3>
                <div className="flex gap-2">
                  <Input 
                    id="trip-id" 
                    placeholder="Enter Trip ID to check"
                    className="flex-1"
                    defaultValue="T174207"
                  />
                  <Button onClick={async () => {
                    const tripId = (document.getElementById('trip-id') as HTMLInputElement).value;
                    if (!tripId) return;
                    
                    try {
                      const { data, error } = await supabase
                        .rpc('get_trip_details', { trip_id_param: tripId });
                        
                      if (error) {
                        console.error(`[DriverDashboard] Error checking trip ${tripId}:`, error);
                        toast({
                          title: "Error",
                          description: `Failed to check trip ${tripId}: ${error.message}`,
                          variant: "destructive"
                        });
                      } else {
                        console.log(`[DriverDashboard] Trip ${tripId} details:`, data);
                        toast({
                          title: `Trip ${tripId} Details`,
                          description: `Found ${data.length} rides with this trip ID`
                        });
                      }
                    } catch (err) {
                      console.error(`[DriverDashboard] Exception checking trip ${tripId}:`, err);
                    }
                  }}>
                    Check
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get details about a specific trip ID directly from the database
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Recent Rides in Database</h3>
                <div className="bg-white p-2 rounded border text-xs overflow-auto max-h-60">
                  <p className="mb-2">
                    Found {debugData.allRides.length} recent rides
                    ({debugData.ridesWithDrivers} with drivers assigned, 
                    {debugData.ridesWithMissingFields} with missing fields)
                  </p>
                  
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-1">ID</th>
                        <th className="p-1">Driver</th>
                        <th className="p-1">Status</th>
                        <th className="p-1">Date</th>
                        <th className="p-1">Return?</th>
                        <th className="p-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugData.allRides.map(ride => (
                        <tr key={ride.id} className="border-b">
                          <td className="p-1 font-mono">
                            {ride.id?.substring(0, 8)}...
                          </td>
                          <td className="p-1">
                            {ride.driver_id ? (
                              ride.driver_id === user.id ? 
                                <span className="text-green-600 font-medium">This Driver</span> : 
                                <span className="text-red-600">Other Driver</span>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="p-1">
                            {ride.status || 'Missing'}
                          </td>
                          <td className="p-1">
                            {ride.scheduled_pickup_time ? 
                              format(new Date(ride.scheduled_pickup_time), 'MM/dd/yy h:mm a') : 
                              'Missing'
                            }
                          </td>
                          <td className="p-1 text-center">
                            {ride.is_return_trip ? '✅' : '❌'}
                          </td>
                          <td className="p-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 text-xs"
                              onClick={() => assignRideToDriver(ride.id)}
                              disabled={ride.driver_id === user.id}
                            >
                              Assign
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug message when assigned rides aren't displaying properly */}
      {rides.length > 0 && upcomingRides.length === 0 && process.env.NODE_ENV === 'development' && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700">Assigned Rides Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700">
            <p className="mb-3">You have {rides.length} rides, but none are showing in the "Upcoming" category where assigned rides would appear.</p>
            <p className="font-semibold mb-2">Ride Status Breakdown:</p>
            <ul className="list-disc pl-5 mb-3">
              {rides.map(ride => (
                <li key={ride.id}>
                  Ride {ride.id.substring(0, 8)}: status="{ride.status}", time={ride.scheduled_pickup_time ? format(new Date(ride.scheduled_pickup_time), 'MMM d, h:mm a') : 'unknown'}, 
                  member={ride.member?.full_name || 'unknown'}
                </li>
              ))}
            </ul>
            <p className="font-semibold mb-2">Possible Issues:</p>
            <ul className="list-disc pl-5">
              <li>Rides might have incorrect status values (should be "assigned" for upcoming rides)</li>
              <li>There might be a problem with date formatting or timezone issues</li>
              <li>Rides might be missing required fields (check status and scheduled_pickup_time)</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* If there are rides but none in the today tab on today's date */}
      {rides.length > 0 && todayRides.length === 0 && isToday(selectedDate) && process.env.NODE_ENV === 'development' && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700">Today's Rides Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <p className="mb-3">You have {rides.length} rides, but none are showing for today ({format(selectedDate, 'MMM d, yyyy')})</p>
            <p className="font-semibold mb-2">Your Rides' Dates:</p>
            <ul className="list-disc pl-5 mb-3">
              {rides.map(ride => (
                <li key={ride.id}>
                  Ride {ride.id.substring(0, 8)}: {ride.scheduled_pickup_time ? format(new Date(ride.scheduled_pickup_time), 'MMM d, yyyy') : 'unknown date'}
                </li>
              ))}
            </ul>
            <p className="text-sm">The "Today" tab only shows rides scheduled specifically for today's date.</p>
          </CardContent>
        </Card>
      )}

      {/* Debug info if rides were fetched but not showing up */}
      {rides.length > 0 && todayRides.length === 0 && activeRides.length === 0 && upcomingRides.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Debug Info: Rides Fetched but Not Displaying</h3>
            <p className="text-sm text-yellow-700 mb-4">
              {rides.length} ride(s) were fetched but aren't showing in any category. Check that:
            </p>
            <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1 mb-4">
              <li>The ride has a valid status (found: {rides[0]?.status || 'unknown'})</li>
              <li>The ride has a valid date (found: {rides[0]?.scheduled_pickup_time || 'unknown'})</li>
              <li>The selected date matches the ride date</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tabs for All Rides */}
      <Tabs value={activeTab} defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All Rides
            {rides.length > 0 && (
              <Badge variant="secondary" className="ml-2">{rides.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="today" className={!isToday(selectedDate) ? "text-blue-500" : ""}>
            {isToday(selectedDate) ? "Today" : "Selected Date"}
            {todayRides.length > 0 && (
              <Badge variant="secondary" className="ml-2">{todayRides.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            {activeRides.length > 0 && (
              <Badge className="ml-2 bg-red-500">{activeRides.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming
            {upcomingRides.length > 0 && (
              <Badge className="ml-2">{upcomingRides.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
          </TabsTrigger>
        </TabsList>
        
        {/* All Rides Tab */}
        <TabsContent value="all" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Assigned Rides ({rides.length})</h2>
            <Button variant="outline" size="sm" onClick={fetchRides} className="gap-2">
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
          
          {rides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No rides assigned</p>
                <p className="text-muted-foreground mb-4">You don't have any rides assigned to you yet</p>
                <Button variant="outline" onClick={fetchRides}>
                  Check Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* First show groups of related trips */}
              {groupRelatedRides(rides).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-muted-foreground">Connected Trips</h3>
                  {groupRelatedRides(rides).map(group => (
                    <div key={group.tripId} className="space-y-2">
                      <div className="text-sm font-medium text-primary-foreground bg-primary/10 px-2 py-1 rounded-sm">
                        Trip ID: {group.tripId} ({group.rides.length} connected rides)
                      </div>
                      <div className="space-y-4">
                        {group.rides.map(ride => renderRideCard(ride, true))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show Debug Info - rides with unusual statuses */}
              {rides.some(ride => !['started', 'picked_up', 'in_progress', 'pending', 'assigned', 'completed', 'return_started', 'return_picked_up', 'return_pending', 'return_completed'].includes(ride.status || '')) && (
              <div className="space-y-4">
                  <h3 className="text-md font-medium text-orange-700 bg-orange-50 p-2 rounded">
                    Rides with Unusual Status Values
                  </h3>
                  <div className="space-y-4">
                    {rides
                      .filter(ride => !['started', 'picked_up', 'in_progress', 'pending', 'assigned', 'completed', 'return_started', 'return_picked_up', 'return_pending', 'return_completed'].includes(ride.status || ''))
                      .map(ride => (
                        <div key={ride.id} className="border border-orange-200 rounded-md p-2">
                          <p className="text-sm text-orange-700 mb-2">
                            This ride has an unusual status value: <span className="font-bold">{ride.status || 'undefined'}</span>
                          </p>
                          {renderRideCard(ride)}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
              
              {/* Then show individual rides that don't have related trips and aren't the known working trip */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-muted-foreground">Individual Rides</h3>
                {rides
                  .filter(ride => 
                    // Not in a related trip
                    !rides.some(r => 
                      r.id !== ride.id && 
                      r.trip_id === ride.trip_id && 
                      r.is_return_trip !== ride.is_return_trip
                    ) && 
                    // Has a standard status we recognize
                    ['started', 'picked_up', 'in_progress', 'pending', 'assigned', 'completed', 'return_started', 'return_picked_up', 'return_pending', 'return_completed'].includes(ride.status || '')
                  )
                  .map(ride => renderRideCard(ride))
                }
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Selected Date Rides Tab */}
        <TabsContent value="today" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Rides for {format(selectedDate, 'MMMM d, yyyy')}
              {!isToday(selectedDate) && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Selected Date)
                </span>
              )}
            </h2>
            <Button variant="outline" size="sm" onClick={fetchRides} className="gap-2">
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
          
          {todayRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No rides scheduled for {format(selectedDate, 'MMMM d, yyyy')}</p>
                <p className="text-muted-foreground mb-4">Try selecting a different date or checking back later</p>
                <Button variant="outline" onClick={fetchRides}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {todayRides.map(ride => renderRideCard(ride))}
            </div>
          )}
        </TabsContent>
        
        {/* Active Rides Tab */}
        <TabsContent value="active" className="mt-4">
          {activeRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No active rides</p>
                <p className="text-muted-foreground mb-4">You don't have any in-progress trips at the moment</p>
                <Button variant="outline" onClick={fetchRides}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeRides.map(ride => renderRideCard(ride))}
            </div>
          )}
        </TabsContent>
        
        {/* Upcoming Rides Tab */}
        <TabsContent value="upcoming" className="mt-4">
          {upcomingRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No upcoming rides</p>
                <p className="text-muted-foreground mb-4">You don't have any future trips scheduled</p>
                <Button variant="outline" onClick={fetchRides}>
                  Refresh
                </Button>
                </CardContent>
              </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(sortAndGroupRidesByDate(upcomingRides)).map(([date, rides]) => (
                <div key={date}>
                  <h3 className="text-lg font-semibold mb-3">
                    {isToday(new Date(date)) 
                      ? 'Today' 
                      : format(new Date(date), 'EEEE, MMMM d')}
                  </h3>
                  <div className="space-y-4">
                    {rides.map(ride => renderRideCard(ride))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Completed Rides Tab */}
        <TabsContent value="completed" className="mt-4">
          {completedRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-lg font-medium mb-2">No completed rides</p>
                <p className="text-muted-foreground mb-4">You haven't completed any rides yet</p>
                <Button variant="outline" onClick={fetchRides}>
                  Refresh
                </Button>
        </CardContent>
      </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(sortAndGroupRidesByDate(completedRides)).map(([date, rides]) => (
                <div key={date}>
                  <h3 className="text-lg font-semibold mb-3">
                    {isToday(new Date(date)) 
                      ? 'Today' 
                      : format(new Date(date), 'EEEE, MMMM d')}
                  </h3>
                  <div className="space-y-4">
                    {rides.map(ride => renderRideCard(ride))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

