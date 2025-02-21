"use client"

import { useState, useEffect } from "react";
import { StatsCards } from "./components/stats-cards";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";

type Ride = Database['public']['Tables']['rides']['Row'];
type Driver = Database['public']['Tables']['profiles']['Row'] & {
  driver_profile: Database['public']['Tables']['driver_profiles']['Row']
};

export default function DashboardPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch rides
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('*');

      if (ridesError) throw ridesError;
      setRides(ridesData);

      // Fetch drivers
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select(`
          *,
          driver_profile:driver_profiles(*)
        `)
        .eq('user_type', 'driver');

      if (driversError) throw driversError;
      setDrivers(driversData as Driver[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <StatsCards rides={rides} drivers={drivers} />
        {/* Add other dashboard components here */}
      </div>
    </div>
  );
} 