'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  Building2,
  Users,
  Car,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { format, subDays } from 'date-fns'
import { Button } from '@/components/ui/button'

export default function PreviewDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Statistics data
  const stats = {
    totalRevenue: 15780.50,
    todayRevenue: 780.25,
    providerRevenue: 9468.30,
    driverEarnings: 4734.15,
    insuranceClaims: 1578.05,
    avgRideCost: 44.08,
    completedRides: 320,
    cancelledRides: 38,
    pendingPayouts: 3156.10,
    monthlyGrowth: 8.5,
    driverUtilization: 71.1,
    claimsRatio: 10.0, 
    activeDrivers: 32,
    totalProviders: 12
  }
  
  // Generate revenue trend data
  const generateRevenueData = () => {
    const data = []
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      const revenue = Math.floor(600 + Math.random() * 500)
      const providerRevenue = Math.round(revenue * 0.6)
      const driverEarnings = Math.round(revenue * 0.3)
      const rides = Math.floor(8 + Math.random() * 12)
      
      data.push({
        date,
        revenue,
        providerRevenue,
        driverEarnings,
        rides
      })
    }
    return data
  }
  
  const revenueData = generateRevenueData()
  
  // Revenue distribution data
  const distributionData = [
    { name: 'Provider', value: 60 },
    { name: 'Driver', value: 30 },
    { name: 'Insurance', value: 10 }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo notification banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-yellow-700 text-sm font-medium">
              <span className="md:hidden">Demo preview - non-functional</span>
              <span className="hidden md:inline">This is a non-functional preview of the BeLoved super admin dashboard. All data shown is fictional.</span>
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-yellow-700 bg-white hover:bg-yellow-50 border-yellow-300"
              onClick={() => router.push('/about')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to About
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 35.2C27.8 35.2 34.2 28.8 34.2 21C34.2 13.2 27.8 6.8 20 6.8C12.2 6.8 5.8 13.2 5.8 21C5.8 28.8 12.2 35.2 20 35.2Z" fill="#F4E1E2"/>
              <path d="M27.8 16.2C26.7 14.2 24.3 13 22 14C20.1 14.8 19.4 16.5 19.1 18.3C18.8 20.6 19.1 22.8 19.8 25C19.9 25.3 19.9 25.5 19.7 25.7C18.9 27.2 17.7 28.4 16.3 29.4C15.6 29.9 14.8 30.2 14 30.2C12.7 30.2 11.6 29.7 10.6 28.7C10.5 28.6 10.3 28.6 10.2 28.7C9.8 29.1 9.5 29.6 9.5 30.2C9.5 31 9.9 31.4 10.5 31.9C11.9 32.9 13.6 33.2 15.4 32.8C18.1 32.2 20.2 30.6 22 28.6C22.2 28.4 22.4 28.4 22.7 28.5C24.7 29.1 26.8 29.2 28.8 28.5C31.1 27.7 32.8 26.1 33.3 23.7C33.8 20.9 31.9 18.3 29.2 17.5C28.7 17.4 28.2 17.3 27.7 17.3C27.7 16.9 27.8 16.5 27.8 16.2Z" fill="#EF4444"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Preview</span>
        </div>
        
        {/* Subtitle and action buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <p className="text-gray-500 mb-4 sm:mb-0">System-wide analytics and management</p>
          <div className="flex flex-wrap gap-2">
            <button className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-md px-4 py-2 text-sm">
              Manage Providers
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-md px-4 py-2 text-sm">
              Members Directory
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md px-4 py-2 text-sm">
              AI Support
            </button>
          </div>
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            <span className="ml-3">Loading dashboard data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue & Earnings Trend */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b px-6 py-4">
                  <div className="flex justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Revenue & Earnings Trend</h2>
                      <p className="text-sm text-gray-500">Last 30 days of financial activity</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                        <span>Revenue</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-pink-400 mr-1"></div>
                        <span>Provider</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-rose-300 mr-1"></div>
                        <span>Driver</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-red-300 mr-1"></div>
                        <span>Rides</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[300px]">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => format(new Date(value), 'MMM d')}
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={{ stroke: '#e5e7eb' }}
                          />
                          <YAxis 
                            yAxisId="money" 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={{ stroke: '#e5e7eb' }}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <YAxis 
                            yAxisId="rides" 
                            orientation="right" 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={{ stroke: '#e5e7eb' }}
                          />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'rides') return [value, 'Rides'];
                              return [`$${value}`, name];
                            }}
                            labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                          />
                          <Line
                            yAxisId="money"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#ef4444"
                            strokeWidth={2}
                            name="Revenue"
                            dot={false}
                            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: 'white' }}
                          />
                          <Line
                            yAxisId="money"
                            type="monotone"
                            dataKey="providerRevenue"
                            stroke="#f472b6"
                            strokeWidth={2}
                            name="Provider"
                            dot={false}
                            activeDot={{ r: 6, stroke: '#f472b6', strokeWidth: 2, fill: 'white' }}
                          />
                          <Line
                            yAxisId="money"
                            type="monotone"
                            dataKey="driverEarnings"
                            stroke="#fda4af"
                            strokeWidth={2}
                            name="Driver"
                            dot={false}
                            activeDot={{ r: 6, stroke: '#fda4af', strokeWidth: 2, fill: 'white' }}
                          />
                          <Line
                            yAxisId="rides"
                            type="monotone"
                            dataKey="rides"
                            stroke="#fca5a5"
                            strokeWidth={2}
                            name="rides"
                            dot={false}
                            activeDot={{ r: 6, stroke: '#fca5a5', strokeWidth: 2, fill: 'white' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Revenue Distribution */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b px-6 py-4">
                  <h2 className="text-lg font-semibold">Revenue Distribution</h2>
                  <p className="text-sm text-gray-500">Breakdown of revenue allocation</p>
                </div>
                <div className="p-6">
                  <div className="h-[250px]">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                          >
                            <Cell fill="#f472b6" />
                            <Cell fill="#fda4af" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Percent']} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-pink-400 mr-2"></div>
                      <span className="text-sm">Provider Revenue</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-rose-300 mr-2"></div>
                      <span className="text-sm">Driver Earnings</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm">Insurance Claims</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Financial Summary */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold">Financial Summary</h2>
                <p className="text-sm text-gray-500">Detailed breakdown of revenue and expenses</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Revenue Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Gross Revenue</span>
                        <span className="font-medium">${stats.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Provider Fees</span>
                        <span className="font-medium">${stats.providerRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Driver Earnings</span>
                        <span className="font-medium">${stats.driverEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Key Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Avg. Ride Cost</span>
                        <span className="font-medium">${stats.avgRideCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Completed Rides</span>
                        <span className="font-medium">{stats.completedRides}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cancelled Rides</span>
                        <span className="font-medium">{stats.cancelledRides}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Insurance & Claims</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Claims</span>
                        <span className="font-medium">${stats.insuranceClaims.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Claims Ratio</span>
                        <span className="font-medium">{stats.claimsRatio.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pending Payouts</span>
                        <span className="font-medium">${stats.pendingPayouts.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Key Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-gray-500">
                  +${stats.todayRevenue.toFixed(2)} today
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Provider Revenue</h3>
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">${stats.providerRevenue.toFixed(2)}</div>
                <p className="text-xs text-gray-500">
                  ${(stats.providerRevenue / stats.totalProviders).toFixed(2)} avg/provider
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Driver Earnings</h3>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">${stats.driverEarnings.toFixed(2)}</div>
                <p className="text-xs text-gray-500">
                  ${(stats.driverEarnings / stats.activeDrivers).toFixed(2)} avg/driver
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Insurance Claims</h3>
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">${stats.insuranceClaims.toFixed(2)}</div>
                <p className="text-xs text-gray-500">
                  ${(stats.insuranceClaims / (stats.completedRides + stats.cancelledRides)).toFixed(2)} avg/ride
                </p>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Monthly Growth</h3>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">{stats.monthlyGrowth.toFixed(1)}%</div>
                <p className="text-xs text-gray-500">
                  Month over month revenue growth
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Driver Utilization</h3>
                  <Activity className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">{stats.driverUtilization.toFixed(1)}%</div>
                <p className="text-xs text-gray-500">
                  Average rides per active driver
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Avg. Revenue/Ride</h3>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">${stats.avgRideCost.toFixed(2)}</div>
                <p className="text-xs text-gray-500">
                  Average revenue per completed ride
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">
                  {((stats.completedRides / (stats.completedRides + stats.cancelledRides)) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500">
                  Percentage of completed rides
                </p>
              </div>
            </div>
            
            {/* Geographic Distribution */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold">Geographic Distribution</h2>
                <p className="text-sm text-gray-500">Service areas and ride density map</p>
              </div>
              <div className="p-6 h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <MapSVG />
                  <p className="text-sm text-gray-500 mt-4">Interactive geographic distribution map</p>
                  <p className="text-xs text-gray-400">Current service areas: Bloomington, Indianapolis</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple Map SVG component
function MapSVG() {
  return (
    <svg width="600" height="300" viewBox="0 0 600 300" className="mx-auto">
      <rect x="0" y="0" width="600" height="300" fill="#f8fafc" />
      
      {/* Grid lines */}
      <g transform="translate(50, 50)">
        <path d="M 0,0 L 500,0 M 0,50 L 500,50 M 0,100 L 500,100 M 0,150 L 500,150 M 0,200 L 500,200" 
              stroke="#e2e8f0" strokeWidth="1" fill="none" />
        <path d="M 0,0 L 0,200 M 100,0 L 100,200 M 200,0 L 200,200 M 300,0 L 300,200 M 400,0 L 400,200 M 500,0 L 500,200" 
              stroke="#e2e8f0" strokeWidth="1" fill="none" />
      </g>
      
      {/* City dots */}
      <g>
        <circle cx="150" cy="100" r="15" fill="rgba(239, 68, 68, 0.1)" className="animate-pulse" />
        <circle cx="150" cy="100" r="6" fill="#ef4444" />
        <text x="150" y="80" textAnchor="middle" fontSize="12" fill="#374151">Bloomington</text>
        
        <circle cx="350" cy="120" r="15" fill="rgba(239, 68, 68, 0.1)" className="animate-pulse" />
        <circle cx="350" cy="120" r="6" fill="#ef4444" />
        <text x="350" y="100" textAnchor="middle" fontSize="12" fill="#374151">Indianapolis</text>
        
        <circle cx="250" cy="180" r="15" fill="rgba(239, 68, 68, 0.1)" className="animate-pulse" />
        <circle cx="250" cy="180" r="6" fill="#ef4444" />
        
        <circle cx="450" cy="150" r="15" fill="rgba(239, 68, 68, 0.1)" className="animate-pulse" />
        <circle cx="450" cy="150" r="6" fill="#ef4444" />
      </g>
    </svg>
  )
} 