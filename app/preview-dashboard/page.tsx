'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Star,
  Headphones,
  UserPlus,
  FileText,
  TableIcon,
  BookOpen,
  History,
  Ban,
  Target,
  Cog,
  ClipboardList,
  PhoneCall,
  MapPin,
  BarChart3,
  ArrowUpIcon,
  ArrowDownIcon,
  Building2Icon,
  CarIcon,
  ServerIcon,
  RefreshCcwIcon,
  ShirtIcon,
  TruckIcon,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import moment from 'moment'

interface DashboardStats {
  total_providers: number
  active_providers: number
  total_admins: number
  total_drivers: number
  active_drivers: number
  total_rides: number
  rides_today: number
  completed_rides: number
  cancelled_rides: number
  total_revenue: number
  revenue_today: number
  pending_support_tickets: number
  average_ride_cost: number
  total_providers_revenue: number
  total_drivers_earnings: number
  insurance_claims_amount: number
  pending_payouts: number
  monthly_growth_rate: number
  driver_utilization_rate: number
  average_response_time: number
  customer_satisfaction_rate: number
  avg_response_time: number
  provider_satisfaction: number
  system_uptime: number
}

interface RevenueData {
  date: string
  revenue: number
  rides: number
  provider_revenue: number
  driver_earnings: number
}

interface RideStatus {
  name: string
  value: number
}

// Mockup stats with realistic data
const demoStats: DashboardStats = {
  total_providers: 26,
  active_providers: 18,
  total_admins: 12,
  total_drivers: 84,
  active_drivers: 68,
  total_rides: 1482,
  rides_today: 47,
  completed_rides: 1284,
  cancelled_rides: 64,
  total_revenue: 146870,
  revenue_today: 2456,
  pending_support_tickets: 8,
  average_ride_cost: 99.10,
  total_providers_revenue: 67580,
  total_drivers_earnings: 58748,
  insurance_claims_amount: 22842,
  pending_payouts: 4780,
  monthly_growth_rate: 8.7,
  driver_utilization_rate: 82.4,
  average_response_time: 17,
  customer_satisfaction_rate: 94.6,
  avg_response_time: 17,
  provider_satisfaction: 94.6,
  system_uptime: 99.5,
}

// Generate last 30 days of mock revenue data
const generateLastThirtyDaysData = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Random values but with a realistic pattern
    const rides = Math.floor(Math.random() * 20) + 40;
    const revenue = Math.floor(Math.random() * 1000) + 2500;
    const provider_revenue = Math.round(revenue * 0.46);
    const driver_earnings = Math.round(revenue * 0.4);
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: revenue,
      provider_revenue: provider_revenue,
      driver_earnings: driver_earnings,
      rides: rides
    });
  }
  
  return data;
};

const demoRevenueData: RevenueData[] = generateLastThirtyDaysData();

// Mockup ride status distribution
const demoRideStatuses: RideStatus[] = [
  { name: "Completed", value: 1284 },
  { name: "In Progress", value: 87 },
  { name: "Scheduled", value: 47 },
  { name: "Cancelled", value: 64 }
]

// Mockup recent rides
const demoRecentRides = [
  { id: "RID-10584", status: "completed", created_at: "2023-11-21T09:45:00", cost: 65.20, provider_fee: 30.10, driver_earnings: 26.08, insurance_claim_amount: 0 },
  { id: "RID-10583", status: "in_progress", created_at: "2023-11-21T09:30:00", cost: 42.75, provider_fee: 19.70, driver_earnings: 17.10, insurance_claim_amount: 0 },
  { id: "RID-10582", status: "scheduled", created_at: "2023-11-21T09:25:00", cost: 78.50, provider_fee: 36.20, driver_earnings: 31.40, insurance_claim_amount: 0 },
  { id: "RID-10581", status: "completed", created_at: "2023-11-21T09:15:00", cost: 55.30, provider_fee: 25.50, driver_earnings: 22.10, insurance_claim_amount: 0 },
  { id: "RID-10580", status: "cancelled", created_at: "2023-11-21T09:00:00", cost: 0, provider_fee: 0, driver_earnings: 0, insurance_claim_amount: 0 },
  { id: "RID-10579", status: "completed", created_at: "2023-11-21T08:45:00", cost: 124.80, provider_fee: 57.60, driver_earnings: 49.90, insurance_claim_amount: 19.40 },
  { id: "RID-10578", status: "completed", created_at: "2023-11-21T08:30:00", cost: 37.95, provider_fee: 17.50, driver_earnings: 15.20, insurance_claim_amount: 0 }
]

// Mockup recent support tickets
const demoSupportTickets = [
  { id: "TKT-2364", title: "Driver arrived late", status: "open", priority: "medium", created_at: "2023-11-21T09:32:00" },
  { id: "TKT-2363", title: "App crash during ride booking", status: "open", priority: "high", created_at: "2023-11-21T08:17:00" },
  { id: "TKT-2362", title: "Payment not processing", status: "in_progress", priority: "high", created_at: "2023-11-20T16:44:00" },
  { id: "TKT-2361", title: "Unable to schedule return trip", status: "open", priority: "medium", created_at: "2023-11-20T15:21:00" },
  { id: "TKT-2360", title: "Driver feedback submission", status: "closed", priority: "low", created_at: "2023-11-20T14:03:00" }
]

// Define the recent activity type
interface RecentActivity {
  type: 'provider' | 'driver' | 'system'
  title: string
  description: string
  time: string
}

function GeographicNodes() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)
  const [nodes, setNodes] = useState([
    { id: 1, baseX: 300, baseY: 150, x: 300, y: 150, animClass: 'animate-pulse-dot-1', location: 'Bloomington' },
    { id: 2, baseX: 400, baseY: 150, x: 400, y: 150, animClass: 'animate-pulse-dot-2', location: 'Indianapolis' },
    { id: 3, baseX: 500, baseY: 150, x: 500, y: 150, animClass: 'animate-pulse-dot-3' },
    { id: 4, baseX: 300, baseY: 250, x: 300, y: 250, animClass: 'animate-pulse-dot-2' },
    { id: 5, baseX: 400, baseY: 250, x: 400, y: 250, animClass: 'animate-pulse-dot-3' },
    { id: 6, baseX: 500, baseY: 250, x: 500, y: 250, animClass: 'animate-pulse-dot-1' }
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
    <div className="bg-white rounded-lg border shadow overflow-hidden">
      <div className="border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Geographic Distribution</h3>
        <p className="text-sm text-gray-500">Service areas and ride density map</p>
      </div>
      <div className="relative w-full h-[400px] p-4">
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
    </div>
  )
}

export default function PreviewDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [rideStatuses, setRideStatuses] = useState<RideStatus[]>([])
  
  // Recent activity data
  const recentActivity: RecentActivity[] = [
    {
      type: 'provider',
      title: 'New Provider Onboarded',
      description: 'Medical Transport Solutions Inc. completed registration',
      time: '2 hours ago'
    },
    {
      type: 'driver',
      title: 'Driver Background Check',
      description: 'Jason Reynolds (ID: 4928) approved and activated',
      time: '4 hours ago'
    },
    {
      type: 'system',
      title: 'System Update Completed',
      description: 'Matching algorithm v2.3 deployed successfully',
      time: 'Yesterday'
    },
    {
      type: 'provider',
      title: 'Provider Status Change',
      description: 'Sunshine Transportation marked as inactive',
      time: 'Yesterday'
    },
    {
      type: 'system',
      title: 'API Rate Limit Exceeded',
      description: 'Provider API endpoint throttled temporarily',
      time: '2 days ago'
    }
  ]

  // Set mounted state after initial render and load demo data
  useEffect(() => {
    setIsMounted(true)
    
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
      setStats(demoStats)
      setRevenueData(demoRevenueData)
      setRideStatuses(demoRideStatuses)
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'open':
        return 'bg-yellow-100 text-yellow-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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

      {/* Top navigation bar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="flex-shrink-0 bg-red-100 p-2 rounded-md text-red-600 mr-3">
                <Building2 className="h-5 w-5" />
              </span>
              BeLoved Super Admin Dashboard
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Preview</span>
            </h1>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
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
          
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">System-wide analytics and management</p>
              </div>
              <div className="flex space-x-4">
                <Button className="bg-red-500 hover:bg-red-600 text-white rounded-md font-medium">
                  Manage Providers
                </Button>
                <Button className="bg-red-500 hover:bg-red-600 text-white rounded-md font-medium">
                  Members Directory
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium">
                  AI Support
                </Button>
              </div>
            </div>

            <Tabs value="overview" className="space-y-4">
              <TabsContent value="overview" className="space-y-4">
                {/* Key Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(demoStats.total_revenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(demoStats.revenue_today)} today
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Rides</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{demoStats.completed_rides}</div>
                      <p className="text-xs text-muted-foreground">
                        {demoStats.rides_today} rides today
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{demoStats.active_drivers}</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(demoStats.driver_utilization_rate)}% utilization rate
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                      <Headphones className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{demoStats.pending_support_tickets}</div>
                      <p className="text-xs text-muted-foreground">
                        Open tickets requiring attention
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Secondary Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Members</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">284</div>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +8.2%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          this month
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Providers</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{demoStats.total_providers}</div>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                          {demoStats.active_providers} active
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{demoStats.monthly_growth_rate}%</div>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full flex items-center">
                          MoM
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Daily revenue for the past 14 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {isMounted && (
                        <div className="w-full h-full">
                          <div className="w-full h-[300px] relative">
                            {/* Placeholder chart */}
                            <div className="absolute inset-0">
                              <svg className="w-full h-full" viewBox="0 0 1000 300">
                                {/* X and Y axes */}
                                <line x1="50" y1="250" x2="950" y2="250" stroke="#e5e7eb" strokeWidth="2" />
                                <line x1="50" y1="250" x2="50" y2="50" stroke="#e5e7eb" strokeWidth="2" />
                                
                                {/* Y axis labels */}
                                <text x="20" y="250" fontSize="12" fill="#6b7280" textAnchor="end">$0</text>
                                <text x="20" y="200" fontSize="12" fill="#6b7280" textAnchor="end">$1,000</text>
                                <text x="20" y="150" fontSize="12" fill="#6b7280" textAnchor="end">$2,000</text>
                                <text x="20" y="100" fontSize="12" fill="#6b7280" textAnchor="end">$3,000</text>
                                <text x="20" y="50" fontSize="12" fill="#6b7280" textAnchor="end">$4,000</text>
                                
                                {/* X axis labels - every other day to avoid clutter */}
                                <text x="100" y="270" fontSize="12" fill="#6b7280" textAnchor="middle">Jan 1</text>
                                <text x="200" y="270" fontSize="12" fill="#6b7280" textAnchor="middle">Jan 3</text>
                                <text x="300" y="270" fontSize="12" fill="#6b7280" textAnchor="middle">Jan 5</text>
                                <text x="400" y="270" fontSize="12" fill="#6b7280" textAnchor="middle">Jan 7</text>
                                <text x="500" y="270" fontSize="12" fill="#6b7280" textAnchor="middle">Jan 9</text>
                                <text x="600" y="270" fontSize="12" fill="#6b7280" textAnchor="middle">Jan 11</text>
                                <text x="700" y="270" fontSize="12" fill="#6b7280" textAnchor="middle">Jan 13</text>
                                
                                {/* Revenue Line */}
                                <path 
                                  d="M100,200 L150,185 L200,190 L250,175 L300,165 L350,180 L400,160 L450,150 L500,155 L550,140 L600,130 L650,135 L700,120 L750,125" 
                                  fill="none" 
                                  stroke="#ef4444" 
                                  strokeWidth="3" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                />
                                
                                {/* Area under Revenue Line */}
                                <path 
                                  d="M100,200 L150,185 L200,190 L250,175 L300,165 L350,180 L400,160 L450,150 L500,155 L550,140 L600,130 L650,135 L700,120 L750,125 L750,250 L100,250 Z" 
                                  fill="url(#revenueGradient)" 
                                />
                                
                                {/* Data points */}
                                <circle cx="100" cy="200" r="4" fill="#ef4444" />
                                <circle cx="150" cy="185" r="4" fill="#ef4444" />
                                <circle cx="200" cy="190" r="4" fill="#ef4444" />
                                <circle cx="250" cy="175" r="4" fill="#ef4444" />
                                <circle cx="300" cy="165" r="4" fill="#ef4444" />
                                <circle cx="350" cy="180" r="4" fill="#ef4444" />
                                <circle cx="400" cy="160" r="4" fill="#ef4444" />
                                <circle cx="450" cy="150" r="4" fill="#ef4444" />
                                <circle cx="500" cy="155" r="4" fill="#ef4444" />
                                <circle cx="550" cy="140" r="4" fill="#ef4444" />
                                <circle cx="600" cy="130" r="4" fill="#ef4444" />
                                <circle cx="650" cy="135" r="4" fill="#ef4444" />
                                <circle cx="700" cy="120" r="4" fill="#ef4444" />
                                <circle cx="750" cy="125" r="4" fill="#ef4444" />
                                
                                {/* Revenue gradient */}
                                <defs>
                                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
                                    <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tables Row */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Recent Rides */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Rides</CardTitle>
                      <CardDescription>Latest ride activity across the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {demoRecentRides.map((ride) => (
                            <TableRow key={ride.id}>
                              <TableCell className="font-medium">{ride.id}</TableCell>
                              <TableCell>{formatDate(ride.created_at)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(ride.status)}>
                                  {ride.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(ride.cost)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Support Tickets */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Support Tickets</CardTitle>
                      <CardDescription>Latest customer support requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {demoSupportTickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium">{ticket.id}</TableCell>
                              <TableCell className="max-w-[150px] truncate" title={ticket.title}>
                                {ticket.title}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {ticket.priority}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Summary */}
                <div className="bg-white rounded-lg border shadow overflow-hidden">
                  <div className="border-b px-6 py-4">
                    <h3 className="text-lg font-semibold">Financial Summary</h3>
                    <p className="text-sm text-gray-500">Detailed breakdown of revenue and expenses</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Revenue Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Gross Revenue</span>
                            <span className="font-medium">${stats?.total_revenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Provider Fees</span>
                            <span className="font-medium">${stats?.total_providers_revenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Driver Earnings</span>
                            <span className="font-medium">${stats?.total_drivers_earnings.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Key Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Avg. Ride Cost</span>
                            <span className="font-medium">${stats?.average_ride_cost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Completed Rides</span>
                            <span className="font-medium">{stats?.completed_rides}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Cancelled Rides</span>
                            <span className="font-medium">{stats?.cancelled_rides}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Insurance & Claims</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Claims</span>
                            <span className="font-medium">${stats?.insurance_claims_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Claims Ratio</span>
                            <span className="font-medium">
                              {((stats?.insurance_claims_amount || 0) / (stats?.total_revenue || 1) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Pending Payouts</span>
                            <span className="font-medium">${stats?.pending_payouts.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support and Alerts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Support Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* To be implemented with support system */}
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              Support ticket system coming soon
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">All Systems Operational</p>
                            <p className="text-sm text-muted-foreground">
                              Last checked: {format(new Date(), 'PPp')}
                            </p>
                          </div>
                        </div>
                        {/* Add more system alerts as needed */}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <CardHeader className="border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Revenue & Earnings Trend</CardTitle>
                          <CardDescription className="text-gray-500">Last 30 days of financial activity</CardDescription>
                        </div>
                        <div className="flex items-center text-xs space-x-3">
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
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[320px]">
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
                                domain={[0, 'dataMax + 100']}
                              />
                              <YAxis 
                                yAxisId="rides" 
                                orientation="right" 
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                                tickLine={{ stroke: '#e5e7eb' }}
                                domain={[0, 'dataMax + 5']}
                              />
                              <Tooltip 
                                formatter={(value, name) => {
                                  if (name === 'rides') return [value, 'Rides'];
                                  return [`$${typeof value === 'number' ? value.toFixed(2) : value}`, name];
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
                                dataKey="provider_revenue"
                                stroke="#f472b6"
                                strokeWidth={2}
                                name="Provider"
                                dot={false}
                                activeDot={{ r: 6, stroke: '#f472b6', strokeWidth: 2, fill: 'white' }}
                              />
                              <Line
                                yAxisId="money"
                                type="monotone"
                                dataKey="driver_earnings"
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
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-0 shadow-lg">
                    <CardHeader className="border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Revenue Distribution</CardTitle>
                          <CardDescription className="text-gray-500">Breakdown of revenue allocation</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[250px] mb-8">
                        {isMounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  {
                                    name: 'Provider Revenue',
                                    value: stats?.total_providers_revenue || 0
                                  },
                                  {
                                    name: 'Driver Earnings',
                                    value: stats?.total_drivers_earnings || 0
                                  },
                                  {
                                    name: 'Insurance Claims',
                                    value: stats?.insurance_claims_amount || 0
                                  }
                                ]}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={2}
                                cornerRadius={6}
                                label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(1)}%`}
                                labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                              >
                                <Cell fill="#f472b6" />
                                <Cell fill="#fda4af" />
                                <Cell fill="#ef4444" />
                              </Pie>
                              <Tooltip 
                                formatter={(value) => [
                                  `$${typeof value === 'number' ? value.toFixed(2) : value}`, 
                                  'Amount'
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      <div className="flex justify-center space-x-6 pt-2 pb-2">
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
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Access Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Quick Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      <Link href="#" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors" onClick={(e) => e.preventDefault()}>
                        <Users className="h-6 w-6 text-primary" />
                        <span className="text-sm text-center">Members</span>
                      </Link>
                      
                      <Link href="#" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors" onClick={(e) => e.preventDefault()}>
                        <Car className="h-6 w-6 text-primary" />
                        <span className="text-sm text-center">Drivers</span>
                      </Link>
                      
                      <Link href="#" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors" onClick={(e) => e.preventDefault()}>
                        <Building2 className="h-6 w-6 text-primary" />
                        <span className="text-sm text-center">Providers</span>
                      </Link>

                      <Link href="#" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors" onClick={(e) => e.preventDefault()}>
                        <Calendar className="h-6 w-6 text-primary" />
                        <span className="text-sm text-center">Ride Requests</span>
                      </Link>

                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <BookOpen className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Information Base</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <Clock className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Pending Acceptance</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <Calendar className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Schedule</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <TableIcon className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Pickboard</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <FileText className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Manifest</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <DollarSign className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Invoicing</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <History className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">History</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <Ban className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Exclude Member</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <Target className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Counties</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <Users className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Calendar</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <Car className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Vehicles</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <ClipboardList className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Compliance</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <Activity className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Upload Trips</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <Cog className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-center text-sm">Account</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow">
                    <div className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">${stats?.total_revenue.toFixed(2)}</div>
                    <p className="text-xs text-gray-500">
                      +${stats?.revenue_today.toFixed(2)} today
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border shadow">
                    <div className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-sm font-medium text-gray-500">Provider Revenue</h3>
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">${(stats?.total_providers_revenue || 0).toFixed(2)}</div>
                    <p className="text-xs text-gray-500">
                      ${((stats?.total_providers_revenue || 0) / (stats?.total_providers || 1)).toFixed(2)} avg/provider
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border shadow">
                    <div className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-sm font-medium text-gray-500">Driver Earnings</h3>
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">${(stats?.total_drivers_earnings || 0).toFixed(2)}</div>
                    <p className="text-xs text-gray-500">
                      ${((stats?.total_drivers_earnings || 0) / (stats?.total_drivers || 1)).toFixed(2)} avg/driver
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border shadow">
                    <div className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-sm font-medium text-gray-500">Insurance Claims</h3>
                      <AlertTriangle className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">${(stats?.insurance_claims_amount || 0).toFixed(2)}</div>
                    <p className="text-xs text-gray-500">
                      ${((stats?.insurance_claims_amount || 0) / (stats?.total_rides || 1)).toFixed(2)} avg/ride
                    </p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow">
                    <div className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-sm font-medium text-gray-500">Monthly Growth</h3>
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">{stats?.monthly_growth_rate.toFixed(1)}%</div>
                    <p className="text-xs text-gray-500">
                      Month over month revenue growth
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border shadow">
                    <div className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-sm font-medium text-gray-500">Driver Utilization</h3>
                      <Activity className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">{stats?.driver_utilization_rate.toFixed(1)}%</div>
                    <p className="text-xs text-gray-500">
                      Average rides per active driver
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border shadow">
                    <div className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-sm font-medium text-gray-500">Avg. Revenue/Ride</h3>
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">${stats?.average_ride_cost.toFixed(2)}</div>
                    <p className="text-xs text-gray-500">
                      Average revenue per completed ride
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border shadow">
                    <div className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
                      <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">
                      {stats ? ((stats.completed_rides / stats.total_rides) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs text-gray-500">
                      Percentage of completed rides
                    </p>
                  </div>
                </div>

                {/* Recent Activity */}
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader className="border-b">
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system events and updates</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {recentActivity.map((activity: RecentActivity, index: number) => (
                        <div key={index} className="flex items-center p-4">
                          <div className="mr-4">
                            {activity.type === 'provider' && (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Building2Icon className="h-5 w-5 text-blue-700" />
                              </div>
                            )}
                            {activity.type === 'driver' && (
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CarIcon className="h-5 w-5 text-green-700" />
                              </div>
                            )}
                            {activity.type === 'system' && (
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <ServerIcon className="h-5 w-5 text-purple-700" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-gray-500">{activity.description}</p>
                          </div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <GeographicNodes />
              </TabsContent>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
              <span className="ml-2">Loading dashboard data...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-2">Dashboard Error</h3>
                  <p>Failed to fetch dashboard data. Using demo data instead.</p>
                  <div className="mt-3 flex space-x-4">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => {
                          setIsLoading(false);
                          setError(null);
                        }, 1500);
                      }}
                    >
                      Retry
                    </Button>
                    <a 
                      href="#" 
                      className="inline-flex items-center justify-center text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-9 px-3"
                      onClick={(e) => e.preventDefault()}
                    >
                      Go to Provider Management
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
} 