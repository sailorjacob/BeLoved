'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/app/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserNav } from '@/app/components/user-nav'
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Car, 
  Building, 
  Clock, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react'
import { MemberNotes } from '@/app/components/member-note'
import { MemberEditForm } from '@/app/components/member-edit-form'

interface Member {
  id: string
  member_id?: string
  full_name: string
  email: string
  phone: string
  user_role: 'super_admin' | 'admin' | 'driver' | 'member'
  status: 'active' | 'inactive'
  provider_id?: string
  provider?: {
    name: string
    organization_code: string
  }
  organization_code?: string
  home_address?: {
    address: string
    city: string
    state: string
    zip: string
  }
  created_at: string
  updated_at: string
}

interface Ride {
  id: string
  pickup_location: string
  dropoff_location: string
  pickup_time: string
  status: string
  driver_id?: string
  driver_name?: string
  cost?: number
}

export default function MemberProfilePage({ params }: { params: { id: string } }) {
  const { isLoggedIn, isLoading: authLoading, role } = useAuth()
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  useEffect(() => {
    // Check authentication
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/')
        return
      }
      
      if (role !== 'admin') {
        const dashboardPath = role === 'super_admin' 
          ? '/super-admin-dashboard'
          : role === 'driver'
            ? '/driver-dashboard'
            : '/member-dashboard'
        router.push(dashboardPath)
        return
      }
      
      // If we got here, user is logged in as admin
      fetchMemberData(params.id)
    }
  }, [isLoggedIn, role, router, authLoading, params.id])

  const fetchMemberData = async (memberId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch member profile with provider details
      const { data: memberData, error: memberError } = await supabase
        .from('profiles')
        .select(`
          *,
          provider:provider_id(name, organization_code)
        `)
        .eq('id', memberId)
        .single()

      if (memberError) {
        throw memberError
      }

      setMember(memberData)

      // Fetch member's rides if any
      // This is a placeholder - adjust based on your actual database schema
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .eq('member_id', memberId)
        .order('pickup_time', { ascending: false })
        .limit(5)

      if (ridesError) {
        console.error('Error fetching rides:', ridesError)
        // Don't throw an error for rides, just log it
      } else {
        setRides(ridesData || [])
      }
    } catch (err) {
      console.error('Error fetching member data:', err)
      setError('Failed to load member profile. Please try again.')
      // Set demo data for development
      setDemoData(memberId)
    } finally {
      setIsLoading(false)
    }
  }

  const setDemoData = (memberId: string) => {
    // Generate appropriate provider data based on ID
    let providerInfo = undefined;
    let providerID = undefined;
    let organizationCode = undefined;
    
    // Generate different provider data based on ID
    if (parseInt(memberId) % 3 === 0) {
      providerID = 'provider-1';
      providerInfo = { 
        name: 'BeLoved Transportation', 
        organization_code: 'BELOVED' 
      };
      organizationCode = 'BELOVED';
    } else if (parseInt(memberId) % 3 === 1) {
      providerID = 'provider-2';
      providerInfo = { 
        name: 'Bloomington Transit', 
        organization_code: 'BLOOM123' 
      };
      organizationCode = 'BLOOM123';
    }
    
    // Create demo member data
    const demoMember: Member = {
      id: memberId,
      member_id: `M${100000 + parseInt(memberId)}`,
      full_name: `Member ${memberId}`,
      email: `member${memberId}@example.com`,
      phone: `555-${String(1000 + parseInt(memberId)).slice(1)}`,
      user_role: parseInt(memberId) % 5 === 0 ? 'driver' : 
                 parseInt(memberId) % 7 === 0 ? 'admin' :
                 parseInt(memberId) % 11 === 0 ? 'super_admin' : 'member',
      status: 'active',
      provider_id: providerID,
      provider: providerInfo,
      organization_code: organizationCode,
      home_address: {
        address: '123 Main Street',
        city: 'Bloomington',
        state: 'IN',
        zip: '47401'
      },
      created_at: new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)).toISOString(),
      updated_at: new Date(Date.now() - (1000 * 60 * 60 * 24 * 5)).toISOString()
    }

    setMember(demoMember)

    // Create demo rides data
    const statuses = ['completed', 'scheduled', 'cancelled', 'in_progress']
    const demoRides: Ride[] = Array(5).fill(null).map((_, index) => ({
      id: `ride-${index}`,
      pickup_location: '123 Main St, Bloomington, IN',
      dropoff_location: '456 Oak Ave, Bloomington, IN',
      pickup_time: new Date(Date.now() - (1000 * 60 * 60 * 24 * (30 - index * 3))).toISOString(),
      status: statuses[index % statuses.length],
      driver_id: `driver-${index + 1}`,
      driver_name: `Driver ${index + 1}`,
      cost: 25 + (index * 3)
    }))

    setRides(demoRides)
  }

  // Loading states
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading member profile...</p>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Member Profile</h1>
          <Button variant="outline" asChild>
            <Link href="/admin-dashboard/members">
              Back to Members
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Error Loading Profile</h3>
              <p>{error || "Member not found"}</p>
            </div>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link href="/admin-dashboard/members">
                  Return to Members Directory
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold">{member.full_name}</h1>
            <p className="text-muted-foreground">
              {member.member_id && <span className="font-mono">{member.member_id}</span>} • 
              <span className="ml-1">{member.user_role === 'driver' ? 'Driver' : 'Member'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin-dashboard/members">
              Back to Members
            </Link>
          </Button>
          <UserNav />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Member Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{member.full_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <div>
                  <Badge variant={member.status === 'active' ? 'default' : 'destructive'}>
                    {member.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium flex items-center">
                  <Mail className="mr-1 h-4 w-4 text-muted-foreground" /> 
                  {member.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center">
                  <Phone className="mr-1 h-4 w-4 text-muted-foreground" /> 
                  {member.phone}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">User Type</p>
                <p className="font-medium flex items-center">
                  <User className="mr-1 h-4 w-4 text-muted-foreground" /> 
                  {member.user_role.charAt(0).toUpperCase() + member.user_role.slice(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium flex items-center">
                  <Calendar className="mr-1 h-4 w-4 text-muted-foreground" /> 
                  {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
              {member.provider_id && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium flex items-center">
                    <Building className="mr-1 h-4 w-4 text-muted-foreground" /> 
                    {member.provider?.name || 'Unknown Provider'}
                  </p>
                  {(member.provider?.organization_code || member.organization_code) && (
                    <p className="text-sm font-mono text-muted-foreground">
                      Organization Code: {member.provider?.organization_code || member.organization_code}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-medium flex items-center mb-4">
                <MapPin className="mr-1 h-4 w-4 text-muted-foreground" /> 
                Home Address
              </h3>
              {member.home_address ? (
                <div className="space-y-1">
                  <p>{member.home_address.address}</p>
                  <p>{member.home_address.city}, {member.home_address.state} {member.home_address.zip}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No address information provided</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button 
              variant="outline" 
              className="ml-auto"
              onClick={() => setIsEditFormOpen(true)}
            >
              Edit Profile
            </Button>
          </CardFooter>
        </Card>

        {/* Member Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Member Activity</CardTitle>
            <CardDescription>
              Summary of member's recent activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Car className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span>Total Rides</span>
                </div>
                <Badge variant="secondary">{rides.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span>Completed Rides</span>
                </div>
                <Badge variant="secondary">
                  {rides.filter(ride => ride.status === 'completed').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span>Pending Rides</span>
                </div>
                <Badge variant="secondary">
                  {rides.filter(ride => ride.status === 'scheduled').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span>Cancelled Rides</span>
                </div>
                <Badge variant="secondary">
                  {rides.filter(ride => ride.status === 'cancelled').length}
                </Badge>
              </div>
            </div>
            <div className="border-t pt-4">
              <Button variant="outline" className="w-full">
                <Link href={`/admin-dashboard/members/${member.id}/rides`} className="w-full">
                  View All Rides
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rides */}
      <div className="mt-8">
        <Tabs defaultValue="recent-rides">
          <TabsList>
            <TabsTrigger value="recent-rides">Recent Rides</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="support">Support History</TabsTrigger>
          </TabsList>
          <TabsContent value="recent-rides">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="mr-2 h-5 w-5" />
                  Recent Rides
                </CardTitle>
                <CardDescription>
                  {member.user_role === 'driver' 
                    ? "This driver's assigned rides"
                    : "The member's most recent transportation activities"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rides.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {member.user_role === 'driver' 
                      ? <p>No rides found for this driver.</p> 
                      : <p>No rides found for this member.</p>
                    }
                    {member.user_role === 'driver' && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        asChild
                      >
                        <Link href={`/admin-dashboard/members/${member.id}/rides`}>
                          View Driver's Rides
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                          <th className="text-left p-4 text-muted-foreground font-medium">From/To</th>
                          <th className="text-left p-4 text-muted-foreground font-medium">Driver</th>
                          <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                          <th className="text-right p-4 text-muted-foreground font-medium">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rides.map((ride) => (
                          <tr key={ride.id} className="border-t">
                            <td className="p-4">
                              {new Date(ride.pickup_time).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="font-medium">{ride.pickup_location.split(',')[0]}</div>
                              <div className="text-muted-foreground text-sm">to {ride.dropoff_location.split(',')[0]}</div>
                            </td>
                            <td className="p-4">
                              {ride.driver_name || '-'}
                            </td>
                            <td className="p-4">
                              <Badge variant={
                                ride.status === 'completed' ? 'default' : 
                                ride.status === 'cancelled' ? 'destructive' : 
                                ride.status === 'in_progress' ? 'secondary' : 
                                'outline'
                              }>
                                {ride.status.replace('_', ' ').charAt(0).toUpperCase() + ride.status.replace('_', ' ').slice(1)}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              ${ride.cost?.toFixed(2) || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" className="ml-auto" asChild>
                  {member.user_role === 'driver' ? (
                    <Link href={`/admin-dashboard/members/${member.id}/rides`}>
                      View All Driver Rides
                    </Link>
                  ) : (
                    <Link href={`/admin-dashboard/members/${member.id}/rides`}>
                      View All Rides
                    </Link>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="notes">
            <MemberNotes memberId={params.id} providerId={member?.provider_id} />
          </TabsContent>
          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Support History</CardTitle>
                <CardDescription>
                  Record of support interactions with this member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No support history found for this member.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Profile Form */}
      <MemberEditForm 
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        memberId={params.id}
        onSuccess={() => {
          // Refresh member data after successful edit
          fetchMemberData(params.id)
        }}
      />
    </main>
  )
} 