"use client"

import { useState, useEffect, useRef } from "react"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AdminScheduler } from "./admin-scheduler"
import { DriverProfilePage } from "./driver-profile-page"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  BookOpen, 
  Clock, 
  CalendarDays,
  Grid,
  Building2,
  DollarSign,
  History,
  Ban,
  Target,
  UserCircle,
  CheckCircle,
  User,
  Car,
  CheckSquare,
  Upload,
  Shield,
  Info,
  Calendar,
  CalendarCheck,
  ClipboardList,
  UserPlus,
  Users,
  ChevronDown,
  Search
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import { RideDetailView } from "./ride-detail-view"
import { StatsCards } from "./dashboard/stats-cards"
import { RideTrendsChart } from "./dashboard/ride-trends-chart"
import { DriverDirectory as AdminDriverDirectory } from "./driver-directory"
import { AdminMembersDirectory } from "./admin-members-directory"
import { toast } from 'sonner'
import { useFormHandling } from '@/hooks/useFormHandling'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { FormInput } from '@/components/ui/form-input'
import { Input } from "@/components/ui/input"

type Ride = Database['public']['Tables']['rides']['Row'] & {
  member: Database['public']['Tables']['profiles']['Row']
  driver?: Database['public']['Tables']['profiles']['Row']
}

type Driver = Database['public']['Tables']['profiles']['Row'] & {
  driver_profile?: Database['public']['Tables']['driver_profiles']['Row'] | null
}

interface DriverProfilePageProps {
  driverId: string
  onBack: () => void
}

interface StaffFormData {
  full_name: string
  email: string
  phone: string
  username: string
  password: string
  provider_id: string
  role: 'admin' | 'driver'
}

interface Member {
  id: string
  full_name: string
  email: string
  phone: string
  username?: string
  user_role: 'member' | 'driver' | 'admin' | 'super_admin'
  status: 'active' | 'inactive'
  provider_id?: string
}

export function AdminDashboard() {
  const [selectedView, setSelectedView] = useState<'overview' | 'driver' | 'ride'>('overview')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [showAssignedRides, setShowAssignedRides] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [provider, setProvider] = useState<any>(null)
  const [providerLoaded, setProviderLoaded] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const router = useRouter()
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)
  const [staffMode, setStaffMode] = useState<'create' | 'promote'>('create')
  const [staffRole, setStaffRole] = useState<'admin' | 'driver'>('admin')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [selectedUser, setSelectedUser] = useState<Member | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log("Initializing admin dashboard...");
        setIsLoading(true);
        setDashboardError(null);
        
        // Get current user's session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          console.error('No session found');
          setDashboardError('No active session found. Please log in again.');
          router.push('/');
          return;
        }

        console.log("Session user ID:", session.user.id);
        
        // Fetch user's profile including provider_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setDashboardError('Failed to load your profile information.');
          throw profileError;
        }

        console.log("Profile with provider_id:", profile?.provider_id);

        if (!profile?.provider_id) {
          console.error('No provider ID found for user');
          setDashboardError('Your account is not associated with any provider organization.');
          return;
        }

        // Fetch provider details
        const { data: providerData, error: providerError } = await supabase
          .from('transportation_providers')
          .select('*')
          .eq('id', profile.provider_id)
          .single();

        if (providerError) {
          console.error('Error fetching provider:', providerError);
          setDashboardError('Failed to load provider details.');
          throw providerError;
        }

        console.log("Provider loaded:", providerData);
        setProvider(providerData);
        setProviderLoaded(true);
        
        // Fetch rides and drivers after provider is set
        await fetchRides(profile.provider_id);
        await fetchDrivers(profile.provider_id);
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error initializing dashboard:', error);
        setDashboardError(`Failed to load dashboard data: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
        toast.error('Failed to load dashboard data');
      }
    }

    initializeDashboard();
  }, [router])

  const fetchRides = async (providerId: string) => {
    try {
      console.log("Fetching rides for provider:", providerId);
      
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          member:profiles!rides_member_id_fkey(*),
          driver:profiles!rides_driver_id_fkey(*)
        `)
        .eq('provider_id', providerId)
        .order('scheduled_pickup_time', { ascending: true });

      if (error) {
        console.error('Error fetching rides:', error);
        return;
      }

      console.log(`Fetched ${data?.length || 0} rides for provider`);
      setRides(data || []);
    } catch (error) {
      console.error('Error in fetchRides:', error);
    }
  }

  const fetchDrivers = async (providerId: string) => {
    try {
      console.log("Fetching drivers for provider:", providerId);
      
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`
          *,
          driver_profile:driver_profiles(*)
        `)
        .eq('user_role', 'driver')
        .eq('provider_id', providerId);

      if (error) {
        console.error('Error fetching drivers:', error);
        return;
      }

      console.log(`Fetched ${data?.length || 0} drivers with status ${status}`);
      console.log("First driver:", data?.[0]);
      
      setDrivers(data as Driver[]);
    } catch (error) {
      console.error('Error in fetchDrivers:', error);
    }
  }

  const assignDriver = async (rideId: string, driverId: string | null) => {
    const { error } = await supabase
      .from('rides')
      .update({
        driver_id: driverId,
        status: driverId ? 'assigned' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)

    if (error) {
      console.error('Error assigning driver:', error)
      return
    }

    fetchRides(provider.id)
  }

  const filteredRides = showAssignedRides
    ? rides.filter((ride) => ride.driver_id)
    : rides.filter((ride) => !ride.driver_id)

  const getDriverRides = (driverName: string) => {
    const allRides = rides.filter((ride) => ride.driver?.full_name === driverName)
    const completedRides = allRides.filter((ride) => ride.status && ride.status === "completed")
    const uncompletedRides = allRides.filter((ride) => ride.status && ride.status !== "completed")
    return { completedRides, uncompletedRides }
  }

  const handleViewSchedule = (driver: Driver) => {
    setSelectedDriver(driver)
  }

  const handleViewDetails = (ride: Ride) => {
    setSelectedRide(ride)
  }

  const handleBackFromDetails = () => {
    setSelectedRide(null)
  }

  const handleBackFromDriver = () => {
    setSelectedDriver(null)
  }

  const handleRideAction = async (rideId: string, newStatus: Ride['status'], milesData?: { start?: number | null; end?: number | null }) => {
    const { error } = await supabase
      .from('rides')
      .update({
        status: newStatus,
        ...(milesData?.start !== undefined && { start_miles: milesData.start }),
        ...(milesData?.end !== undefined && { end_miles: milesData.end }),
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)

    if (error) {
      console.error('Error updating ride:', error)
      return
    }

    fetchRides(provider.id)
  }

  const handleMilesEdit = async (rideId: string, miles: { start?: number | null; end?: number | null }) => {
    const { error } = await supabase
      .from('rides')
      .update({
        ...(miles.start !== undefined && { start_miles: miles.start }),
        ...(miles.end !== undefined && { end_miles: miles.end }),
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)

    if (error) {
      console.error('Error updating ride miles:', error)
    }
  }

  // Add staff form handling
  const staffForm = useFormHandling<StaffFormData>({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      provider_id: '',
      role: 'admin'
    },
    validationRules: {
      full_name: (value) => !value ? 'Full name is required' : undefined,
      email: (value) => {
        if (!value) return 'Email is required'
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
        return undefined
      },
      phone: (value) => {
        if (!value) return 'Phone number is required'
        if (!/^\+?[\d\s-]{10,}$/.test(value)) return 'Invalid phone format'
        return undefined
      },
      username: (value) => !value ? 'Username is required' : undefined,
      password: (value) => !value ? 'Password is required' : value.length < 6 ? 'Password must be at least 6 characters' : undefined,
      provider_id: (value) => !value ? 'Provider is required' : undefined,
      role: (value) => !value ? 'Role is required' : undefined
    },
    onSubmit: async (values) => {
      try {
        if (!provider) {
          throw new Error('Provider not found')
        }

        // Show loading toast
        toast.loading(`Creating ${values.role} account...`)

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.full_name,
              user_role: values.role
            }
          }
        })

        if (authError) {
          console.error('Auth error creating user:', authError)
          throw new Error(`Failed to create user account: ${authError.message}`)
        }

        if (!authData.user) throw new Error('No user returned from sign up')

        // 2. Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            username: values.username,
            user_role: values.role,
            provider_id: values.provider_id,
            organization_code: provider.organization_code,
            status: 'active'
          })

        if (profileError) throw profileError

        // 3. If creating a driver, add driver-specific data
        if (values.role === 'driver') {
          const { error: driverProfileError } = await supabase
            .from('driver_profiles')
            .insert({
              id: authData.user.id,
              status: 'active',
              completed_rides: 0,
              total_miles: 0
            })

          if (driverProfileError) throw driverProfileError
        }

        // Clear loading toast and show success
        toast.dismiss()
        toast.success(`${values.role.charAt(0).toUpperCase() + values.role.slice(1)} account created successfully!`, {
          duration: 5000,
          description: `${values.full_name} can now confirm their email and log in.`
        })
        
        // Close dialog
        setIsStaffDialogOpen(false)
        
        // Reset form
        staffForm.resetForm()
        
        // Refresh drivers list if we added a driver
        if (values.role === 'driver') {
          fetchDrivers(provider.id)
        }
      } catch (error: any) {
        // Clear loading toast and show error
        toast.dismiss()
        toast.error(`Failed to create ${values.role} account: ${error.message}`)
      }
    }
  })

  const handleSearchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set a new timeout to debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true)
        
        // Search for users by name or email
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
          .order('full_name', { ascending: true })
          
        if (error) throw error
        
        setSearchResults(data || [])
      } catch (error) {
        console.error('Error searching users:', error)
        toast.error('Failed to search users')
      } finally {
        setIsSearching(false)
      }
    }, 500)
  }

  const handlePromoteUser = async () => {
    if (!selectedUser || !provider) return
    
    try {
      toast.loading(`Promoting user to ${staffRole}...`)
      
      // Update user profile with new role and provider association
      const { error } = await supabase
        .from('profiles')
        .update({
          user_role: staffRole,
          provider_id: provider.id,
          organization_code: provider.organization_code
        })
        .eq('id', selectedUser.id)
        
      if (error) throw error
      
      // If promoting to driver, also create driver profile
      if (staffRole === 'driver') {
        // Check if driver profile already exists
        const { data: existingProfile } = await supabase
          .from('driver_profiles')
          .select('id')
          .eq('id', selectedUser.id)
          .single();
          
        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('driver_profiles')
            .update({
              status: 'active',
            })
            .eq('id', selectedUser.id);
            
          if (updateError) throw updateError;
        } else {
          // Create new profile
          const { error: insertError } = await supabase
            .from('driver_profiles')
            .insert({
              id: selectedUser.id,
              status: 'active',
              completed_rides: 0,
              total_miles: 0
            });
            
          if (insertError) throw insertError;
        }
        
        // Refresh drivers list
        fetchDrivers(provider.id)
      }
      
      toast.dismiss()
      toast.success(`User promoted to ${staffRole} successfully!`)
      
      // Close dialog and reset state
      setIsStaffDialogOpen(false)
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
      
    } catch (error: any) {
      toast.dismiss()
      toast.error(`Failed to promote user: ${error.message}`)
    }
  }

  const openStaffDialog = (mode: 'create' | 'promote', role: 'admin' | 'driver') => {
    setStaffMode(mode)
    setStaffRole(role)
    
    if (mode === 'create') {
      staffForm.handleChange('provider_id', provider?.id || '')
      staffForm.handleChange('role', role)
    } else {
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
    }
    
    setIsStaffDialogOpen(true)
  }

  if (isLoading || !provider) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-lg font-semibold">Loading dashboard...</div>
          {dashboardError && (
            <div className="text-red-500 mt-2 max-w-md">{dashboardError}</div>
          )}
        </div>
      </div>
    )
  }

  if (selectedView === 'driver' && selectedDriver) {
    return (
      <DriverProfilePage 
        driverId={selectedDriver.id} 
        onBack={handleBackFromDriver}
      />
    )
  }

  if (selectedView === 'ride' && selectedRide) {
    return (
      <RideDetailView
        ride={selectedRide}
        onBack={handleBackFromDetails}
        onRideAction={handleRideAction}
        onMilesEdit={handleMilesEdit}
        onClose={handleBackFromDetails}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{provider?.name || 'BeLoved'}</h1>
          <p className="text-muted-foreground">
            {provider?.address}, {provider?.city}, {provider?.state} {provider?.zip}
          </p>
          <p className="text-sm text-muted-foreground">Organization Code: {provider?.organization_code}</p>
        </div>
        <div className="flex items-center gap-4">
          {provider?.status && (
            <Badge variant={provider.status === 'active' ? 'success' : 'secondary'}>
              {provider.status.toUpperCase()}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                Staff Actions <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem 
                onClick={() => openStaffDialog('create', 'admin')}
                className="cursor-pointer"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Admin
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openStaffDialog('create', 'driver')}
                className="cursor-pointer"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Driver
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openStaffDialog('promote', 'admin')}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                Promote to Admin
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openStaffDialog('promote', 'driver')}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                Promote to Driver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rides.filter(r => ['assigned', 'in_progress', 'started', 'picked_up'].includes(r.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rides.filter(r => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter(d => d.driver_profile?.status === 'active').length} / {drivers.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            <Link href="/admin/info" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Info className="h-6 w-6 mb-2 text-primary" />
              <span className="text-xs text-center">Info</span>
            </Link>
            <Link href="/admin/pending" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Clock className="h-6 w-6 mb-2 text-primary" />
              <span className="text-xs text-center">Pending</span>
            </Link>
            <Link href="/admin/schedule" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Calendar className="h-6 w-6 mb-2 text-primary" />
              <span className="text-xs text-center">Schedule</span>
            </Link>
            <Link href="/admin-dashboard/ride-assignments" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <CalendarCheck className="h-6 w-6 mb-2 text-primary" />
              <span className="text-xs text-center">Ride Assignments</span>
            </Link>
            <Link href="/admin/pickboard" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <ClipboardList className="h-6 w-6 mb-2 text-primary" />
              <span className="text-xs text-center">Pickboard</span>
            </Link>
            <Link href="/admin-dashboard/members" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Users className="h-6 w-6 mb-2 text-primary" />
              <span className="text-xs text-center">Member Directory</span>
            </Link>
            <Link href="/admin/manifest" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Building2 className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Manifest</span>
            </Link>
            <Link href="/admin/invoicing" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <DollarSign className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Invoicing</span>
            </Link>
            <Link href="/admin/history" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <History className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">History</span>
            </Link>
            <Link href="/admin/exclude" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Ban className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Exclude Member</span>
            </Link>
            <Link href="/admin/counties" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Target className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Counties</span>
            </Link>
            <Link href="/admin/calendar" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <UserCircle className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Calendar</span>
            </Link>
            <Link href="/admin/driver-info" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <User className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Driver Info</span>
            </Link>
            <Link href="/admin/vehicles" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Car className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Vehicles</span>
            </Link>
            <Link href="/admin-dashboard/vehicles" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent border-primary">
              <Car className="h-6 w-6 mb-2 text-primary" />
              <span className="text-xs text-center font-semibold">Fleet Management</span>
            </Link>
            <Link href="/admin/compliance" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <CheckSquare className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Compliance</span>
            </Link>
            <Link href="/admin/upload-trips" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Upload className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Upload Trips</span>
            </Link>
            <Link href="/admin/account" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent">
              <Shield className="h-6 w-6 mb-2 text-red-500" />
              <span className="text-sm">Account</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      <StatsCards rides={rides} drivers={drivers} />
      <RideTrendsChart rides={rides} />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Rides This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{rides.length}</p>
              <p className="text-sm text-muted-foreground">
                {format(startOfWeek(new Date()), "MMM d")} - {format(endOfWeek(new Date()), "MMM d, yyyy")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fulfilled Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  <span>Completed Rides</span>
                </div>
                <Badge variant="outline">
                  {rides.filter((ride) => ride.status && (ride.status === 'completed' || ride.status === 'return_completed')).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-yellow-500" />
                  <span>Active Rides</span>
                </div>
                <Badge variant="outline">
                  {rides.length - rides.filter((ride) => ride.status && (ride.status === 'completed' || ride.status === 'return_completed')).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Manage Rides</h2>
          <div className="flex items-center space-x-2">
            <Switch id="assigned-rides" checked={showAssignedRides} onCheckedChange={setShowAssignedRides} />
            <Label htmlFor="assigned-rides">{showAssignedRides ? "Assigned Rides" : "Unassigned Rides"}</Label>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{showAssignedRides ? "Assigned Rides" : "Unassigned Rides"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Appointment Time</TableHead>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRides.map((ride) => (
                  <TableRow key={ride.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ride.member.full_name}</div>
                        <div className="text-sm text-muted-foreground">{ride.member.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ride.scheduled_pickup_time), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(new Date(ride.scheduled_pickup_time).getTime() - 60 * 60 * 1000), "h:mm a")}
                    </TableCell>
                    <TableCell>
                      {ride.status ? (
                        <Badge variant={(ride.status === 'completed' || ride.status === 'return_completed') ? "default" : "secondary"}>
                          {ride.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">UNKNOWN</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ride.driver_id || "unassigned"}
                        onValueChange={(value) => assignDriver(ride.id, value === "unassigned" ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {ride.driver ? ride.driver.full_name : "Unassigned"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(ride)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-8">
          {dashboardError ? (
            <Card>
              <CardContent className="py-4">
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                  <p>{dashboardError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Reload Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-4"></div>
                  <p>Loading driver directory...</p>
                </div>
              </CardContent>
            </Card>
          ) : providerLoaded && provider?.id ? (
            <AdminDriverDirectory 
              providerId={provider.id} 
              onViewProfile={handleViewSchedule} 
              onViewSchedule={handleViewSchedule}
            />
          ) : (
            <Card>
              <CardContent className="py-4">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
                  <p>Cannot load driver directory: Provider information is missing</p>
                  <p className="text-xs mt-2">
                    Debug: Provider loaded status - {providerLoaded ? 'Yes' : 'No'}, 
                    Provider ID - {provider?.id || 'Missing'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Member Directory Section */}
        <div className="mt-8">
          {dashboardError ? (
            <Card>
              <CardContent className="py-4">
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                  <p>{dashboardError}</p>
                </div>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-4"></div>
                  <p>Loading member directory...</p>
                </div>
              </CardContent>
            </Card>
          ) : providerLoaded && provider?.id ? (
            <AdminMembersDirectory 
              providerId={provider.id} 
              onViewProfile={(memberId) => window.location.href = `/admin-dashboard/member/${memberId}`}
            />
          ) : (
            <Card>
              <CardContent className="py-4">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
                  <p>Cannot load member directory: Provider information is missing</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Staff Management Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {staffMode === 'create' 
                ? `Add New ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}` 
                : `Promote User to ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}`}
            </DialogTitle>
            <DialogDescription>
              {staffMode === 'create' 
                ? `Create a new ${staffRole} account for ${provider?.name || 'the provider'}.`
                : `Assign an existing user as a ${staffRole} for ${provider?.name || 'the provider'}.`}
            </DialogDescription>
          </DialogHeader>

          {staffMode === 'create' ? (
            <form onSubmit={(e) => {
              e.preventDefault()
              staffForm.handleSubmit(e)
            }} className="space-y-4">
              <FormInput
                label="Full Name"
                name="full_name"
                value={staffForm.values.full_name}
                error={staffForm.errors.full_name}
                onChange={(e) => staffForm.handleChange('full_name', e.target.value)}
                required
              />
              <FormInput
                label="Username"
                name="username"
                value={staffForm.values.username}
                error={staffForm.errors.username}
                onChange={(e) => staffForm.handleChange('username', e.target.value)}
                required
              />
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={staffForm.values.email}
                error={staffForm.errors.email}
                onChange={(e) => staffForm.handleChange('email', e.target.value)}
                required
              />
              <FormInput
                label="Phone Number"
                name="phone"
                value={staffForm.values.phone}
                error={staffForm.errors.phone}
                onChange={(e) => staffForm.handleChange('phone', e.target.value)}
                required
              />
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={staffForm.values.password}
                error={staffForm.errors.password}
                onChange={(e) => staffForm.handleChange('password', e.target.value)}
                required
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create {staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Search for User</label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleSearchUsers(e.target.value)
                    }}
                  />
                </div>
                {isSearching && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-sm text-gray-500">Searching...</span>
                  </div>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                {searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((user) => (
                      <div 
                        key={user.id} 
                        className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                          selectedUser?.id === user.id ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="text-xs mr-2">
                              {user.user_role}
                            </Badge>
                            <Badge 
                              variant={user.status === 'active' ? 'success' : 'destructive'}
                              className="text-xs"
                            >
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          {selectedUser?.id === user.id && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.length >= 3 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">Type at least 3 characters to search</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handlePromoteUser}
                  disabled={!selectedUser}
                >
                  Promote to {staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

