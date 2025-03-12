import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Database } from "@/lib/supabase";

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
        ride => ride.status && (ride.status === 'completed' || ride.status === 'return_completed')
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

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-6 pt-2">
        {payload.map((entry: any, index: number) => (
          <div
            key={`item-${index}`}
            className="flex items-center gap-2"
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium">
              {entry.value === "Total Rides" && "Total Rides"}
              {entry.value === "Completed" && "Completed Rides"}
              {entry.value === "On Time" && "On-Time Arrivals"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ride Trends (Last 14 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="#6b7280"
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '12px'
                }}
                labelStyle={{
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
                itemStyle={{
                  padding: '4px 0'
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "Total Rides" ? "Total Rides" :
                  name === "Completed" ? "Completed Rides" :
                  "On-Time Arrivals"
                ]}
              />
              <Legend content={CustomLegend} />
              <Line
                type="monotone"
                dataKey="total"
                name="Total Rides"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="onTime"
                name="On Time"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 