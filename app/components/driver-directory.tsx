'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import type { Database } from "@/lib/supabase"
import { toast } from 'sonner'

// Use the same Driver type as in admin-dashboard.tsx
type Driver = Database['public']['Tables']['profiles']['Row'] & {
  driver_profile?: Database['public']['Tables']['driver_profiles']['Row'] | null
}

interface DriverDirectoryProps {
  providerId?: string;
  onViewProfile?: (driver: Driver) => void;
  onViewSchedule?: (driver: Driver) => void;
}

export function DriverDirectory({ providerId, onViewProfile, onViewSchedule }: DriverDirectoryProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  useEffect(() => {
    console.log("DriverDirectory mounted, providerId:", providerId);
    fetchDrivers()
  }, [providerId])

  const fetchDrivers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setDebugInfo(null)

      console.log("Fetching drivers with providerId:", providerId);

      let query = supabase
        .from('profiles')
        .select(`
          *,
          driver_profile:driver_profiles(*)
        `)
        .eq('user_role', 'driver');
      
      // Only filter by provider if providerId is provided
      if (providerId) {
        console.log("Adding provider filter:", providerId);
        query = query.eq('provider_id', providerId);
      }

      const { data, error, status } = await query;

      console.log("Supabase response status:", status);
      console.log("Supabase response error:", error);
      console.log("Supabase response data length:", data?.length);
      console.log("Supabase response first item:", data?.[0]);
      
      setDebugInfo(`Status: ${status}, Data count: ${data?.length || 0}`);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("No drivers found");
        setDrivers([]);
        setError("No drivers found. Please add drivers to your organization.");
        setIsLoading(false);
        return;
      }

      setDrivers(data as Driver[]);
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      setError(`Failed to load drivers: ${err.message || 'Unknown error'}`);
      // We'll use real error messaging instead of demo data
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredDrivers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return drivers;

    return drivers.filter(driver => 
      driver.full_name?.toLowerCase().includes(query) ||
      driver.phone?.toLowerCase().includes(query)
    );
  }, [drivers, searchQuery]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Driver Directory</CardTitle>
            <CardDescription>
              View and manage all drivers in your organization
            </CardDescription>
            <div className="relative w-full mt-4 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => window.location.href = '/create-driver'}>
            Add New Driver
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mr-2"></div>
            <span>Loading drivers...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p>{error}</p>
            {debugInfo && (
              <p className="text-xs mt-2">Debug info: {debugInfo}</p>
            )}
            <div className="mt-4">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => fetchDrivers()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              {filteredDrivers.length} {filteredDrivers.length === 1 ? 'driver' : 'drivers'} found
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed Rides</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No drivers found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-bold">
                          <div className="font-medium">{driver.full_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <span className="text-muted-foreground">{driver.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={driver.driver_profile?.status === 'active' ? 'success' : 'destructive'}>
                            {driver.driver_profile?.status || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {driver.driver_profile?.completed_rides || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewProfile && onViewProfile(driver)}
                            >
                              Profile
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewSchedule && onViewSchedule(driver)}
                            >
                              Schedule
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 