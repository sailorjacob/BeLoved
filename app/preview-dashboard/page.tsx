'use client'

import { useState, useEffect } from 'react'
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
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Star,
  BarChart3,
  Headphones,
  UserPlus,
  MapPin,
  FileText,
} from 'lucide-react'

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

// Mockup revenue trend data
const demoRevenueData = [
  { date: "Jan 1", revenue: 2100, rides: 22, provider_revenue: 970, driver_earnings: 840, insurance_claims: 330 },
  { date: "Jan 2", revenue: 2340, rides: 24, provider_revenue: 1080, driver_earnings: 940, insurance_claims: 365 },
  { date: "Jan 3", revenue: 2280, rides: 23, provider_revenue: 1050, driver_earnings: 910, insurance_claims: 356 },
  { date: "Jan 4", revenue: 2560, rides: 26, provider_revenue: 1180, driver_earnings: 1020, insurance_claims: 397 },
  { date: "Jan 5", revenue: 2680, rides: 27, provider_revenue: 1240, driver_earnings: 1070, insurance_claims: 417 },
  { date: "Jan 6", revenue: 2430, rides: 25, provider_revenue: 1120, driver_earnings: 970, insurance_claims: 378 },
  { date: "Jan 7", revenue: 2790, rides: 28, provider_revenue: 1290, driver_earnings: 1120, insurance_claims: 434 },
  { date: "Jan 8", revenue: 2950, rides: 30, provider_revenue: 1360, driver_earnings: 1180, insurance_claims: 458 },
  { date: "Jan 9", revenue: 2840, rides: 29, provider_revenue: 1310, driver_earnings: 1140, insurance_claims: 442 },
  { date: "Jan 10", revenue: 3100, rides: 31, provider_revenue: 1430, driver_earnings: 1240, insurance_claims: 481 },
  { date: "Jan 11", revenue: 3260, rides: 33, provider_revenue: 1500, driver_earnings: 1300, insurance_claims: 508 },
  { date: "Jan 12", revenue: 3140, rides: 32, provider_revenue: 1450, driver_earnings: 1260, insurance_claims: 490 },
  { date: "Jan 13", revenue: 3470, rides: 35, provider_revenue: 1600, driver_earnings: 1390, insurance_claims: 539 },
  { date: "Jan 14", revenue: 3380, rides: 34, provider_revenue: 1560, driver_earnings: 1350, insurance_claims: 525 }
]

// Mockup ride status distribution
const demoRideStatusData = [
  { status: "completed", count: 1284 },
  { status: "in_progress", count: 87 },
  { status: "scheduled", count: 47 },
  { status: "cancelled", count: 64 }
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
  const [activeTab, setActiveTab] = useState('overview')
  const [isMounted, setIsMounted] = useState(false)
  
  // Set mounted state after initial render
  useEffect(() => {
    setIsMounted(true)
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
      {/* Demo notification */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-yellow-700 text-sm font-medium">
              <span className="md:hidden">Demo preview - non-functional</span>
              <span className="hidden md:inline">This is a non-functional preview of the BeLoved admin dashboard. All data shown is fictional.</span>
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
              BeLoved Admin Dashboard
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Preview</span>
            </h1>
          </div>
        </div>
      </header>
      
      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'rides', 'drivers', 'members', 'providers', 'support'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
          </TabsContent>
          
          {/* Other Tabs (Just placeholders) */}
          {['rides', 'drivers', 'members', 'providers', 'support'].map((tab) => (
            <TabsContent key={tab} value={tab} className="h-[600px] flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  {tab === 'rides' && <Calendar className="h-6 w-6 text-gray-500" />}
                  {tab === 'drivers' && <Car className="h-6 w-6 text-gray-500" />}
                  {tab === 'members' && <Users className="h-6 w-6 text-gray-500" />}
                  {tab === 'providers' && <Building2 className="h-6 w-6 text-gray-500" />}
                  {tab === 'support' && <Headphones className="h-6 w-6 text-gray-500" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 capitalize">{tab} Management</h3>
                <p className="text-gray-500 mb-4">
                  This is a preview of the {tab} management tab. In the actual dashboard, this would show detailed {tab} data and management options.
                </p>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Preview Only
                </Badge>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
} 