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
import Image from 'next/image'

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
    totalRevenue: 146870.00,
    todayRevenue: 2456.00,
    completedRides: 1284,
    ridesToday: 47,
    activeDrivers: 68,
    utilizationRate: 82,
    supportTickets: 8,
    members: 284,
    membersGrowth: 8.2,
    providers: 26,
    activeProviders: 18,
    growthRate: 8.7,
    providerRevenue: 67580,
    driverEarnings: 58748,
    insuranceClaims: 22842,
  }
  
  // Generate revenue trend data
  const generateRevenueData = () => {
    const data = []
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      const revenue = Math.floor(1800 + Math.random() * 2000)
      const providerRevenue = Math.round(revenue * 0.45)
      const driverEarnings = Math.round(revenue * 0.4)
      const rides = Math.floor(40 + Math.random() * 24)
      
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
    { name: 'Provider', value: 45.3, legendPosition: 'top' },
    { name: 'Driver', value: 39.4 },
    { name: 'Insurance', value: 15.3 }
  ]
  
  // Define GeographicNodes component for enhanced map display
  function GeographicNodes() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [hoveredNode, setHoveredNode] = useState<number | null>(null)
    const [nodes, setNodes] = useState([
      { id: 1, baseX: 300, baseY: 150, x: 300, y: 150, animClass: 'animate-pulse-dot-1', location: 'Bloomington' },
      { id: 2, baseX: 400, baseY: 150, x: 400, y: 150, animClass: 'animate-pulse-dot-2', location: 'Indianapolis' },
      { id: 3, baseX: 500, baseY: 150, x: 500, y: 150, animClass: 'animate-pulse-dot-3', location: 'Carmel' },
      { id: 4, baseX: 300, baseY: 250, x: 300, y: 250, animClass: 'animate-pulse-dot-2', location: 'Fishers' },
      { id: 5, baseX: 400, baseY: 250, x: 400, y: 250, animClass: 'animate-pulse-dot-3', location: 'Noblesville' },
      { id: 6, baseX: 500, baseY: 250, x: 500, y: 250, animClass: 'animate-pulse-dot-1', location: 'Westfield' }
    ])

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
      const svgRect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - svgRect.left
      const y = event.clientY - svgRect.top
      setMousePos({ x, y })

      // Update node positions with enhanced floating and mouse repulsion
      setNodes(nodes.map(node => {
        const dx = x - node.x
        const dy = y - node.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 150
        const repelStrength = 0.6

        // Calculate mouse repulsion
        let newX = node.x
        let newY = node.y
        
        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * repelStrength
          const angle = Math.atan2(dy, dx)
          newX = node.x - Math.cos(angle) * force * 40
          newY = node.y - Math.sin(angle) * force * 40
        }

        // Add smooth return to base position
        const returnStrength = 0.05
        newX = newX + (node.baseX - newX) * returnStrength
        newY = newY + (node.baseY - newY) * returnStrength

        return {
          ...node,
          x: newX,
          y: newY
        }
      }))
    }

    // Create 3D grid pattern
    const gridSize = 100
    const gridLines = []
    
    // Generate horizontal grid lines
    for (let i = 0; i <= 2; i++) {
      const y = 150 + i * gridSize
      gridLines.push({
        path: `M 250,${y} L 550,${y}`,
        transform: `scale(1, 0.7) rotate(-30 400 ${y})`
      })
    }
    
    // Generate vertical grid lines
    for (let i = 0; i <= 2; i++) {
      const x = 250 + i * 150
      gridLines.push({
        path: `M ${x},150 L ${x},350`,
        transform: `scale(1, 0.7) rotate(-30 ${x} 250)`
      })
    }

    return (
      <div className="relative w-full h-[400px] bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Geographic Distribution</h3>
        <svg
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          style={{ 
            perspective: '1000px',
            transform: 'rotateX(45deg)'
          }}
        >
          {/* Background for depth */}
          <rect
            x="200"
            y="100"
            width="400"
            height="300"
            fill="#f8fafc"
            transform="scale(1, 0.7) rotate(-30 400 250)"
          />

          {/* 3D Grid */}
          {gridLines.map((line, index) => (
            <path
              key={`grid-${index}`}
              d={line.path}
              stroke="#e2e8f0"
              strokeWidth="1.5"
              fill="none"
              transform={line.transform}
            />
          ))}

          {/* Floating Nodes */}
          {nodes.map((node) => (
            <g 
              key={node.id} 
              transform={`translate(${node.x},${node.y})`}
              style={{ 
                transition: 'transform 0.3s ease-out',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
              }}
              onMouseEnter={() => node.location && setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Node glow effect */}
              <circle
                r="15"
                className="animate-pulse-ring"
                fill="rgba(239, 68, 68, 0.15)"
              />
              {/* Main node */}
              <circle
                r="6"
                className={node.animClass}
                fill="#ef4444"
                filter="drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))"
              />
              {/* Location tooltip */}
              {hoveredNode === node.id && node.location && (
                <g transform="translate(0, -25)">
                  <rect
                    x="-40"
                    y="-20"
                    width="80"
                    height="24"
                    rx="4"
                    fill="white"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  />
                  <text
                    x="0"
                    y="-2"
                    textAnchor="middle"
                    fill="#374151"
                    style={{
                      fontSize: '12px',
                      fontFamily: 'system-ui',
                      fontWeight: 500
                    }}
                  >
                    {node.location}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo notification banner - changed from yellow to grey */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-700 bg-white hover:bg-gray-50 border-gray-300 mr-4"
              onClick={() => router.push('/about')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to About
            </Button>
            <p className="text-gray-700 text-sm font-medium">
              <span className="md:hidden">Demo preview - non-functional</span>
              <span className="hidden md:inline">This is a non-functional preview of the BeLoved super admin dashboard. All data shown is fictional.</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header - Updated to match real dashboard with logo */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10">
              <Image 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png" 
                alt="BeLoved Logo" 
                width={40} 
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl font-bold">Super Admin Dashboard</h1>
          </div>
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
            <p className="text-lg text-gray-600 ml-3">Loading dashboard data...</p>
            <p className="text-sm text-gray-500 mt-2">Preparing content...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Charts Section - Moved to top */}
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
                            label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = outerRadius * 1.2;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              
                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  textAnchor={x > cx ? 'start' : 'end'} 
                                  dominantBaseline="central"
                                  fill="#374151"
                                  style={{ fontSize: '12px' }}
                                >
                                  {`${name}: ${(percent * 100).toFixed(1)}%`}
                                </text>
                              );
                            }}
                            labelLine={{
                              stroke: '#9ca3af',
                              strokeWidth: 1
                            }}
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
            
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <h3 className="text-sm font-medium text-gray-500">Completed Rides</h3>
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">{stats.completedRides}</div>
                <p className="text-xs text-gray-500">
                  {stats.ridesToday} rides today
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Active Drivers</h3>
                  <Car className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">{stats.activeDrivers}</div>
                <p className="text-xs text-gray-500">
                  {stats.utilizationRate}% utilization rate
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Support Tickets</h3>
                  <Activity className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold">{stats.supportTickets}</div>
                <p className="text-xs text-gray-500">
                  Open tickets requiring attention
                </p>
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
                        <span className="font-medium">${(stats.totalRevenue / stats.completedRides).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Completed Rides</span>
                        <span className="font-medium">{stats.completedRides}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cancelled Rides</span>
                        <span className="font-medium">64</span>
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
                        <span className="font-medium">{(stats.insuranceClaims / stats.totalRevenue * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pending Payouts</span>
                        <span className="font-medium">$4,780.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Geographic Distribution - Updated to match real dashboard */}
            <GeographicNodes />
            
            {/* Added footer similar to real dashboard */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 text-sm text-gray-500">
              <div>© 2023 BeLoved Transportation. All rights reserved.</div>
              <div className="flex gap-4">
                <button className="hover:text-gray-800" onClick={() => router.push('/about')}>About</button>
                <button className="hover:text-gray-800">Support</button>
                <button className="hover:text-gray-800">Terms of Service</button>
                <button className="hover:text-gray-800">Privacy Policy</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 