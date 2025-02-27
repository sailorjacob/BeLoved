'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

interface Provider {
  id: string
  name: string
  organization_code: string
  address: string
  city: string
  state: string
  zip: string
  status: 'active' | 'inactive'
}

interface ProviderStats {
  total_admins: number
  total_drivers: number
  total_rides: number
  active_rides: number
  completed_rides: number
  cancelled_rides: number
}

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  changed_by: string
  changes: any
  ip_address: string
  user_agent: string
  created_at: string
  changed_by_user?: {
    full_name: string
  }
}

interface ProviderDetailsProps {
  providerId: string
}

export function ProviderDetails({ providerId }: ProviderDetailsProps) {
  const router = useRouter()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [stats, setStats] = useState<ProviderStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProviderDetails()
  }, [providerId])

  const fetchProviderDetails = async () => {
    try {
      // Fetch provider details
      const { data: providerData, error: providerError } = await supabase
        .from('transportation_providers')
        .select('*')
        .eq('id', providerId)
        .single()

      if (providerError) throw providerError

      // Fetch provider statistics
      const stats = await fetchProviderStats(providerId)
      
      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          changed_by_user:profiles!audit_logs_changed_by_fkey(full_name)
        `)
        .eq('entity_id', providerId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (logsError) throw logsError

      setProvider(providerData)
      setStats(stats)
      setAuditLogs(logsData)
    } catch (error) {
      console.error('Error fetching provider details:', error)
      toast.error('Failed to fetch provider details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProviderStats = async (providerId: string): Promise<ProviderStats> => {
    const { data: adminsCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('provider_id', providerId)
      .eq('user_role', 'admin')

    const { data: driversCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('provider_id', providerId)
      .eq('user_role', 'driver')

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
  }

  const formatChanges = (changes: any) => {
    if (!changes) return 'No changes recorded'

    if (changes.changed_fields) {
      return Object.entries(changes.changed_fields)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ')
    }

    if (changes.new) {
      return 'New record created'
    }

    if (changes.old) {
      return 'Record deleted'
    }

    return JSON.stringify(changes)
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
          onClick={() => router.push('/super-admin/providers')}
        >
          Back to Providers
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{provider.name}</h1>
          <p className="text-muted-foreground">Organization Code: {provider.organization_code}</p>
        </div>
        <Button
          onClick={() => router.push('/super-admin/providers')}
        >
          Back to Providers
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="stats">Detailed Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.changed_by_user?.full_name || 'System'}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {formatChanges(log.changes)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Performance Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ride Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Rides:</span>
                      <span className="font-bold">{stats?.total_rides}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Rides:</span>
                      <span className="font-bold">{stats?.completed_rides}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Rides:</span>
                      <span className="font-bold">{stats?.active_rides}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cancelled Rides:</span>
                      <span className="font-bold">{stats?.cancelled_rides}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Statistics</CardTitle>
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
                      <span>Driver Utilization:</span>
                      <span className="font-bold">
                        {stats && stats.total_drivers > 0
                          ? `${((stats.active_rides / stats.total_drivers) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 