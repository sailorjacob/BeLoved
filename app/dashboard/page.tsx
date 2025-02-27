'use client'

import { useEffect, useState } from 'react'
import { StatsCards } from '@/app/dashboard/components/stats-cards'
import { RideTrendsChart } from '@/app/dashboard/components/ride-trends-chart'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Ride = Database['public']['Tables']['rides']['Row']
type Driver = Database['public']['Tables']['profiles']['Row'] & {
  driver_profile: Database['public']['Tables']['driver_profiles']['Row']
}

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    rides: Ride[]
    drivers: Driver[]
  }>({
    rides: [],
    drivers: []
  })

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch rides with all fields
        const { data: rides } = await supabase
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
            updated_at
          `)
          .order('scheduled_pickup_time', { ascending: false })

        // Fetch drivers with their profiles
        const { data: drivers } = await supabase
          .from('profiles')
          .select(`
            *,
            driver_profile:driver_profiles(*)
          `)
          .eq('user_type', 'driver')

        setStats({
          rides: rides || [],
          drivers: (drivers as Driver[]) || []
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <StatsCards rides={stats.rides} drivers={stats.drivers} />
      <RideTrendsChart rides={stats.rides} />
    </div>
  )
} 