'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from "next/link"
import { 
  MapPin, 
  ExternalLink, 
  UserPlus, 
  Users, 
  ChevronDown, 
  Info, 
  Clock, 
  CalendarDays, 
  Grid, 
  Building2, 
  DollarSign, 
  History, 
  Ban, 
  Target, 
  Car, 
  CheckSquare, 
  Upload, 
  Shield,
  ArrowLeft,
  Calendar
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProviderScheduler } from './provider-scheduler' // We'll create this later

interface UnifiedProviderDashboardProps {
  providerId: string
  userRole: 'admin' | 'super_admin'
}

export function UnifiedProviderDashboard({ providerId, userRole }: UnifiedProviderDashboardProps) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(userRole === 'admin' ? 'dashboard' : 'details')
  const [provider, setProvider] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const fetchAttemptedRef = useRef(false)
  
  useEffect(() => {
    if (providerId && !fetchAttemptedRef.current) {
      fetchProviderDetails()
    }
  }, [providerId])
  
  const fetchProviderDetails = async () => {
    try {
      fetchAttemptedRef.current = true
      setIsLoading(true)
      
      // Fetch provider details
      const { data: providerData, error: providerError } = await supabase
        .from('transportation_providers')
        .select('*')
        .eq('id', providerId)
        .single()
      
      if (providerError) throw providerError
      
      setProvider(providerData)
      
      // Fetch provider stats
      const stats = await fetchProviderStats(providerId)
      setStats(stats)
    } catch (error) {
      console.error('Error fetching provider details:', error)
      toast.error('Failed to load provider details')
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchProviderStats = async (providerId: string) => {
    try {
      // Fetch admin count
      const { data: adminsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('provider_id', providerId)
        .eq('user_role', 'admin')

      // Fetch driver count
      const { data: driversCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('provider_id', providerId)
        .eq('user_role', 'driver')

      // Fetch rides data
      const { data: ridesData } = await supabase
        .from('rides')
        .select('status')
        .eq('provider_id', providerId)
      
      const rides = ridesData || []
      
      return {
        total_admins: adminsCount?.length || 0,
        total_drivers: driversCount?.length || 0,
        total_rides: rides.length,
        active_rides: rides.filter(r => ['assigned', 'in_progress'].includes(r.status)).length,
        completed_rides: rides.filter(r => r.status === 'completed').length,
        cancelled_rides: rides.filter(r => r.status === 'cancelled').length,
      }
    } catch (error) {
      console.error('Error fetching provider stats:', error)
      return {
        total_admins: 0,
        total_drivers: 0,
        total_rides: 0,
        active_rides: 0,
        completed_rides: 0,
        cancelled_rides: 0
      }
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }
  
  if (!provider) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Provider not found</h2>
        <Button
          className="mt-4"
          asChild
        >
          <Link href={userRole === 'super_admin' ? '/providers-dashboard' : '/admin-dashboard'}>
            Back
          </Link>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Provider Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{provider.name}</h1>
          <p className="text-muted-foreground">Organization Code: {provider.organization_code}</p>
        </div>
        <div className="flex gap-4">
          {/* Role-specific action buttons */}
          {userRole === 'admin' ? (
            <Button asChild>
              <Link href="/admin-dashboard">
                Back to Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    Staff Actions <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add New Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add New Driver
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4" />
                    Promote to Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4" />
                    Promote to Driver
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild>
                <Link href="/providers-dashboard">
                  Back to Providers
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Provider Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Provider Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={provider.status === 'active' ? 'success' : 'secondary'}>
              {provider.status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{provider.address}</p>
            <p>{provider.city}, {provider.state} {provider.zip}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Admins:</span>
              <span className="font-bold">{stats?.total_admins}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Drivers:</span>
              <span className="font-bold">{stats?.total_drivers}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Rides:</span>
              <span className="font-bold">{stats?.active_rides}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          {userRole === 'admin' && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - Only for Admin users */}
        {userRole === 'admin' && (
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <h2 className="text-2xl font-bold col-span-3">Quick Access</h2>
              
              <QuickAccessButton icon={Info} label="Info" href="/admin/info" />
              <QuickAccessButton icon={Clock} label="Pending" href="/admin/pending" />
              <QuickAccessButton icon={CalendarDays} label="Schedule" href="/admin/schedule" />
              <QuickAccessButton icon={Grid} label="Ride Assignments" href="/admin/ride-assignments" />
              <QuickAccessButton icon={Building2} label="Pickboard" href="/admin/pickboard" />
              <QuickAccessButton icon={DollarSign} label="Invoicing" href="/admin/invoicing" />
              <QuickAccessButton icon={History} label="History" href="/admin/history" />
              <QuickAccessButton icon={Ban} label="Exclude Member" href="/admin/exclude-member" />
              <QuickAccessButton icon={Target} label="Counties" href="/admin/counties" />
              <QuickAccessButton icon={Calendar} label="Calendar" href="/admin/calendar" />
              <QuickAccessButton icon={Users} label="Driver Info" href="/admin/driver-info" />
              <QuickAccessButton icon={Car} label="Vehicles" href="/admin/vehicles" />
              <QuickAccessButton icon={CheckSquare} label="Compliance" href="/admin/compliance" />
              <QuickAccessButton icon={Upload} label="Upload Trips" href="/admin/upload-trips" />
              <QuickAccessButton icon={Shield} label="Account" href="/admin/account" />
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Rides Today" value="0" subvalue="0% completion rate" />
              <StatCard title="Active Drivers" value="0/2" subvalue="Currently on duty" />
              <StatCard title="On-Time Rate" value="0" subvalue="Last 30 days" />
              <StatCard title="Completion Rate" value="50" subvalue="Overall completion rate" percentage={50} />
            </div>
          </TabsContent>
        )}

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Provider Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Organization Details</h3>
                  <p className="text-sm text-muted-foreground">Name: {provider.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {provider.organization_code}</p>
                  <p className="text-sm text-muted-foreground">Status: {provider.status}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Contact Information</h3>
                  <p className="text-sm text-muted-foreground">{provider.address}</p>
                  <p className="text-sm text-muted-foreground">{provider.city}, {provider.state} {provider.zip}</p>
                  <p className="text-sm text-muted-foreground">Phone: {provider.phone || 'N/A'}</p>
                </div>
              </div>
              
              {/* Map View */}
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Location</h3>
                <div className="h-[200px] bg-zinc-100 rounded-lg relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-red-500">
                      <MapPin className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-sm">
                    {provider.address}, {provider.city}, {provider.state}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would be implemented here */}
        <TabsContent value="admins">
          {/* Admin list content */}
        </TabsContent>
        
        <TabsContent value="fleet">
          {/* Fleet content */}
        </TabsContent>
        
        <TabsContent value="drivers">
          {/* Drivers content */}
        </TabsContent>
        
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Ride Scheduling</CardTitle>
              <CardDescription>
                Manage and schedule rides for members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Actually render the scheduler component instead of placeholder */}
              <ProviderScheduler providerId={providerId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          {/* Activity logs content */}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper component for quick access buttons
function QuickAccessButton({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
  return (
    <Link 
      href={href} 
      className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors"
    >
      <Icon className="h-6 w-6 mb-2" />
      <span>{label}</span>
    </Link>
  )
}

// Helper component for stats cards
function StatCard({ 
  title, 
  value, 
  subvalue, 
  percentage 
}: { 
  title: string, 
  value: string, 
  subvalue: string, 
  percentage?: number 
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subvalue}</p>
          </div>
          {percentage !== undefined && (
            <div className="h-12 w-12 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-orange-500"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                  strokeDasharray={`${percentage * 2.51}, 251`}
                  strokeDashoffset="0"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold">
                {percentage}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 