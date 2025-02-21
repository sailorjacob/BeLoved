import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import type { Database } from "../../../lib/supabase";

type Ride = Database['public']['Tables']['rides']['Row'];

interface RideTrendsChartProps {
  rides: Ride[];
}

export function RideTrendsChart({ rides }: RideTrendsChartProps) {
  // Prepare data for the last 14 days
  const data = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(startOfDay(new Date()), i);
    const dayRides = rides.filter(ride => {
      const rideDate = startOfDay(new Date(ride.scheduled_pickup_time));
      return rideDate.getTime() === date.getTime();
    });

    return {
      date: format(date, 'MMM dd'),
      total: dayRides.length,
      completed: dayRides.filter(
        ride => ride.status === 'completed' || ride.status === 'return_completed'
      ).length,
      onTime: dayRides.filter(ride => {
        if (!ride.start_time) return false;
        const scheduledTime = new Date(ride.scheduled_pickup_time);
        const actualStartTime = new Date(ride.start_time);
        const diffInMinutes = Math.abs(actualStartTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
        return diffInMinutes <= 15;
      }).length,
    };
  }).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ride Trends (Last 14 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Total Rides"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="onTime"
                name="On Time"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 