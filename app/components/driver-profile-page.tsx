'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../lib/supabase'
import { DriverHistoryView } from './driver-history-view'

type Driver = Database['public']['Tables']['profiles']['Row'] & {
  driver_profile: Database['public']['Tables']['driver_profiles']['Row']
}

interface DriverProfilePageProps {
  driverId: string
  onBack?: () => void
}

export function DriverProfilePage({ driverId, onBack }: DriverProfilePageProps) {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<'active' | 'inactive' | 'on_break'>('inactive')
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchDriver = async () => {
      setIsLoading(true)
      try {
        const { data: driver, error } = await supabase
          .from('profiles')
          .select(`
            *,
            driver_profile:driver_profiles(*)
          `)
          .eq('id', driverId)
          .single()

        if (error) {
          console.error('Error fetching driver:', error)
          return
        }

        setDriver(driver)
        if (driver?.driver_profile?.status) {
          setStatus(driver.driver_profile.status)
        }
      } catch (err) {
        console.error('Error fetching driver:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDriver()
  }, [driverId, supabase])

  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'on_break') => {
    if (!driver) return

    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({ status: newStatus })
        .eq('id', driverId)

      if (error) {
        console.error('Error updating status:', error)
        return
      }

      setStatus(newStatus)
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!driver) {
    return <div>Driver not found</div>
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Driver Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium">{driver.full_name}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Contact</div>
              <div className="font-medium">{driver.phone}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="flex items-center gap-4">
                <Badge variant={driver.driver_profile.status === 'active' ? "default" : "secondary"}>
                  {driver.driver_profile.status.toUpperCase()}
                </Badge>
                <Select
                  value={driver.driver_profile.status}
                  onValueChange={(value: 'active' | 'inactive' | 'on_break') => handleStatusChange(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_break">On Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Statistics</div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-2xl font-bold">{driver.driver_profile.completed_rides}</div>
                  <div className="text-sm text-gray-500">Completed Rides</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{driver.driver_profile.total_miles}</div>
                  <div className="text-sm text-gray-500">Total Miles</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DriverHistoryView driverId={driverId} />
    </div>
  )
}

