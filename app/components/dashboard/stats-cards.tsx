import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useInView } from 'react-intersection-observer';
import type { Database } from "../../lib/supabase";

type Ride = Database['public']['Tables']['rides']['Row'];
type Driver = Database['public']['Tables']['profiles']['Row'] & {
  driver_profile: Database['public']['Tables']['driver_profiles']['Row']
};

interface StatsCardsProps {
  rides: Ride[];
  drivers: Driver[];
}

interface StatCardProps {
  title: string;
  value: number;
  total?: number;
  description: string;
  color: string;
}

const CircularProgress = ({ value, color }: { value: number; color: string }) => {
  const circumference = 2 * Math.PI * 38; // radius = 38
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      {/* Background circle */}
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="38"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-200"
        />
        {/* Animated progress circle */}
        <motion.circle
          cx="48"
          cy="48"
          r="38"
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      {/* Centered percentage text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {value}%
      </motion.div>
    </div>
  );
};

const StatCard = ({ title, value, total, description, color }: StatCardProps) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const percentage = total ? Math.round((value / total) * 100) : value;

  return (
    <Card ref={ref} className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <motion.p 
              className="text-2xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              {value}{total && `/${total}`}
            </motion.p>
            <motion.p 
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {description}
            </motion.p>
          </div>
          {inView && <CircularProgress value={percentage} color={color} />}
        </div>
      </CardContent>
    </Card>
  );
};

export function StatsCards({ rides, drivers }: StatsCardsProps) {
  // Calculate statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayRides = rides.filter(ride => {
    const rideDate = new Date(ride.scheduled_pickup_time);
    rideDate.setHours(0, 0, 0, 0);
    return rideDate.getTime() === today.getTime();
  });
  
  const completedTodayRides = todayRides.filter(
    ride => ride.status === 'completed' || ride.status === 'return_completed'
  );
  
  const activeDrivers = drivers.filter(
    driver => driver.driver_profile.status === 'active'
  );
  
  // Calculate on-time rate for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const last30DaysRides = rides.filter(ride => {
    const rideDate = new Date(ride.scheduled_pickup_time);
    return rideDate >= thirtyDaysAgo;
  });
  
  const onTimeRides = last30DaysRides.filter(ride => {
    // A ride is considered on time if it was started within 15 minutes of the scheduled time
    if (!ride.start_time) return false;
    const scheduledTime = new Date(ride.scheduled_pickup_time);
    const actualStartTime = new Date(ride.start_time);
    const diffInMinutes = Math.abs(actualStartTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
    return diffInMinutes <= 15;
  });
  
  const onTimeRate = last30DaysRides.length > 0
    ? Math.round((onTimeRides.length / last30DaysRides.length) * 100)
    : 100;

  const stats = [
    {
      title: "Total Rides Today",
      value: completedTodayRides.length,
      total: todayRides.length,
      description: `${Math.round((completedTodayRides.length / (todayRides.length || 1)) * 100)}% completion rate`,
      color: "#22c55e" // green
    },
    {
      title: "Active Drivers",
      value: activeDrivers.length,
      total: drivers.length,
      description: "Currently on duty",
      color: "#3b82f6" // blue
    },
    {
      title: "On-Time Rate",
      value: onTimeRate,
      description: "Last 30 days",
      color: "#8b5cf6" // purple
    },
    {
      title: "Completion Rate",
      value: Math.round((rides.filter(ride => 
        ride.status === 'completed' || ride.status === 'return_completed'
      ).length / (rides.length || 1)) * 100),
      description: "Overall completion rate",
      color: "#f59e0b" // amber
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
} 