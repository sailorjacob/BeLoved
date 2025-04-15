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
import { format } from 'date-fns'

// Mockup stats with realistic data
const demoStats = {
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
  customer_satisfaction_rate: 94.6
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

const demoRevenueData = generateLastThirtyDaysData();

// Mockup ride status distribution
const demoRideStatuses = [
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

export default function PreviewDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [rideStatuses, setRideStatuses] = useState([])
  
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">System-wide analytics and management</p>
            </div>
            <div className="flex space-x-4">
              <Button variant="destructive" asChild>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Manage Providers
                </a>
              </Button>
              <Button variant="destructive" asChild>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Members Directory
                </a>
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  AI Support
                </a>
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
                        {/* Demo support tickets */}
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
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
                  <CardHeader className="border-b bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">Revenue & Earnings Trend</CardTitle>
                        <CardDescription className="text-slate-500">Last 30 days of financial activity</CardDescription>
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
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorProvider" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorDriver" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRides" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
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
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: 'none', 
                                borderRadius: '8px', 
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                              }}
                              formatter={(value, name) => {
                                if (name === 'Number of Rides') return [value, name];
                                return [`$${typeof value === 'number' ? value.toFixed(2) : value}`, name];
                              }}
                              labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                            />
                            <Line
                              yAxisId="money"
                              type="monotone"
                              dataKey="revenue"
                              stroke="#ef4444"
                              strokeWidth={3}
                              name="Total Revenue ($)"
                              dot={false}
                              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: 'white' }}
                            />
                            <Line
                              yAxisId="money"
                              type="monotone"
                              dataKey="provider_revenue"
                              stroke="#f472b6"
                              strokeWidth={3}
                              name="Provider Revenue ($)"
                              dot={false}
                              activeDot={{ r: 6, stroke: '#f472b6', strokeWidth: 2, fill: 'white' }}
                            />
                            <Line
                              yAxisId="money"
                              type="monotone"
                              dataKey="driver_earnings"
                              stroke="#fda4af"
                              strokeWidth={3}
                              name="Driver Earnings ($)"
                              dot={false}
                              activeDot={{ r: 6, stroke: '#fda4af', strokeWidth: 2, fill: 'white' }}
                            />
                            <Line
                              yAxisId="rides"
                              type="monotone"
                              dataKey="rides"
                              stroke="#fca5a5"
                              strokeWidth={3}
                              name="Number of Rides"
                              dot={false}
                              activeDot={{ r: 6, stroke: '#fca5a5', strokeWidth: 2, fill: 'white' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
                  <CardHeader className="border-b bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">Revenue Distribution</CardTitle>
                        <CardDescription className="text-slate-500">Breakdown of revenue allocation</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[250px] mb-8">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              <linearGradient id="colorPie1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f472b6" stopOpacity={1}/>
                                <stop offset="100%" stopColor="#f9a8d4" stopOpacity={1}/>
                              </linearGradient>
                              <linearGradient id="colorPie2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fda4af" stopOpacity={1}/>
                                <stop offset="100%" stopColor="#fecdd3" stopOpacity={1}/>
                              </linearGradient>
                              <linearGradient id="colorPie3" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                                <stop offset="100%" stopColor="#fca5a5" stopOpacity={1}/>
                              </linearGradient>
                            </defs>
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
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                            >
                              <Cell fill="url(#colorPie1)" />
                              <Cell fill="url(#colorPie2)" />
                              <Cell fill="url(#colorPie3)" />
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: 'none', 
                                borderRadius: '8px', 
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                              }}
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

              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats?.total_revenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      +${stats?.revenue_today.toFixed(2)} today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Provider Revenue
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${(stats?.total_providers_revenue || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      ${((stats?.total_providers_revenue || 0) / (stats?.total_providers || 1)).toFixed(2)} avg/provider
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Driver Earnings
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${(stats?.total_drivers_earnings || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      ${((stats?.total_drivers_earnings || 0) / (stats?.total_drivers || 1)).toFixed(2)} avg/driver
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Insurance Claims
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${(stats?.insurance_claims_amount || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      ${((stats?.insurance_claims_amount || 0) / (stats?.total_rides || 1)).toFixed(2)} avg/ride
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Monthly Growth
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.monthly_growth_rate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Month over month revenue growth
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Driver Utilization
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.driver_utilization_rate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Average rides per active driver
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg. Revenue/Ride
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats?.average_ride_cost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      Average revenue per completed ride
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Completion Rate
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats ? ((stats.completed_rides / stats.total_rides) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Percentage of completed rides
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* GeographicNodes placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>Service areas and ride density map</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-slate-50">
                  <div className="text-center p-8">
                    <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">Geographic map visualization would appear here</p>
                    <p className="text-sm text-slate-400 mt-2">Preview mode - actual map not available</p>
                  </div>
                </CardContent>
              </Card>
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
      </main>
    </div>
  )
} 