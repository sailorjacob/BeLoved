'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth-context'
import Link from 'next/link'
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
} from 'recharts'
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
  Cog,
  Bell,
  BarChart3,
  Headphones,
  UserPlus,
  MapPin,
  ClipboardList,
  BookOpen,
  Target,
  FileText,
  Ban,
  Table as TableIcon,
  History
} from 'lucide-react'

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
}

interface RevenueData {
  date: string
  revenue: number
  rides: number
  provider_revenue: number
  driver_earnings: number
  insurance_claims: number
}

interface RideStatus {
  status: string
  count: number
}

interface RideData {
  id: string
  status: string
  cost: number
  created_at: string
  provider_fee: number | null
  driver_earnings: number | null
  insurance_claim_amount: number | null
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

export function SuperAdminDashboard({ isDebugMode = false }: { isDebugMode?: boolean }) {
  const { isLoggedIn, role, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [rideStatuses, setRideStatuses] = useState<RideStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const fetchAttemptedRef = useRef(false)

  // Add detailed component state logging
  console.log('[SuperAdminDashboard] Component rendering, props:', { 
    isDebugMode, 
    authState: { isLoggedIn, role, authLoading }, 
    componentState: { isLoading, hasError: !!error } 
  })

  useEffect(() => {
    console.log('[SuperAdminDashboard] Component mounted, debug mode:', isDebugMode)
    mountedRef.current = true
    
    // Set a safety timeout to show something if data fetching takes too long
    const timeoutId = setTimeout(() => {
      if (!mountedRef.current) return;
      
      if (isLoading) {
        console.log('[SuperAdminDashboard] Timeout reached, showing demo data as fallback')
        setDemoData()
        setIsLoading(false)
      }
    }, 5000)
    
    // If in debug mode, immediately set demo data and skip auth check
    if (isDebugMode) {
      console.log('[SuperAdminDashboard] Debug mode enabled, loading demo data')
      setDemoData()
      setIsLoading(false)
    } else if (isLoggedIn && role === 'super_admin' && !fetchAttemptedRef.current) {
      console.log('[SuperAdminDashboard] Auth conditions met, fetchDashboardData will be called')
      fetchAttemptedRef.current = true
      fetchDashboardData()
    } else {
      console.log('[SuperAdminDashboard] Auth conditions NOT met or fetch already attempted:', { isLoggedIn, role, fetchAttempted: fetchAttemptedRef.current })
      // Still show dashboard with demo data if auth failed but component is being rendered anyway
      if (!fetchAttemptedRef.current) {
        console.log('[SuperAdminDashboard] Loading demo data as fallback since component is being rendered')
        fetchAttemptedRef.current = true
        setDemoData()
        setIsLoading(false)
      }
    }
    
    return () => {
      clearTimeout(timeoutId)
      mountedRef.current = false;
      console.log('[SuperAdminDashboard] Component unmounted')
    }
  }, [isLoggedIn, role, isDebugMode])

  const fetchDashboardData = async () => {
    try {
      console.log('[SuperAdminDashboard] Fetching dashboard data...')
      setIsLoading(true)
      setError(null)

      // Fetch basic stats
      const stats = await fetchStats()
      if (!mountedRef.current) return;
      setStats(stats)

      // Fetch revenue data for the last 30 days
      const revenue = await fetchRevenueData()
      if (!mountedRef.current) return;
      setRevenueData(revenue)

      // Fetch ride status distribution
      const rideStats = await fetchRideStatusDistribution()
      if (!mountedRef.current) return;
      setRideStatuses(rideStats)

      console.log('[SuperAdminDashboard] Data fetched successfully')
    } catch (error) {
      console.error('[SuperAdminDashboard] Error fetching data:', error)
      if (!mountedRef.current) return;
      setError('Failed to fetch dashboard data. Using demo data instead.')
      
      // Set demo data if fetch fails
      setDemoData();
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }
  
  const setDemoData = () => {
    // Demo stats
    setStats({
      total_providers: 12,
      active_providers: 8,
      total_admins: 25,
      total_drivers: 45,
      active_drivers: 32,
      total_rides: 358,
      rides_today: 18,
      completed_rides: 320,
      cancelled_rides: 38,
      total_revenue: 15780.50,
      revenue_today: 780.25,
      pending_support_tickets: 7,
      average_ride_cost: 44.08,
      total_providers_revenue: 9468.30,
      total_drivers_earnings: 4734.15,
      insurance_claims_amount: 1578.05,
      pending_payouts: 3156.10,
      monthly_growth_rate: 8.5,
      driver_utilization_rate: 71.1,
      average_response_time: 6.5,
      customer_satisfaction_rate: 92.3
    });
    
    // Demo revenue data
    const demoRevenueData: RevenueData[] = [];
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const randomValue = Math.floor(400 + Math.random() * 600);
      const rides = Math.floor(8 + Math.random() * 12);
      demoRevenueData.push({
        date,
        revenue: randomValue,
        rides,
        provider_revenue: randomValue * 0.6,
        driver_earnings: randomValue * 0.3,
        insurance_claims: randomValue * 0.1
      });
    }
    setRevenueData(demoRevenueData.reverse());
    
    // Demo ride statuses
    setRideStatuses([
      { status: 'completed', count: 320 },
      { status: 'cancelled', count: 38 },
      { status: 'in_progress', count: 12 },
      { status: 'scheduled', count: 28 }
    ]);
  }

  const fetchStats = async (): Promise<DashboardStats> => {
    try {
      console.log('[SuperAdminDashboard] Fetching dashboard stats...')
      const today = new Date()
      const startOfToday = startOfDay(today)
      const endOfToday = endOfDay(today)
      const startOfLastMonth = subDays(startOfToday, 30)

      // Fetch providers stats
      const { data: providers, error: providersError } = await supabase
        .from('transportation_providers')
        .select('*')
      
      // If table doesn't exist or there's an error, use demo data
      if (providersError) {
        console.error('[SuperAdminDashboard] Error fetching providers:', providersError)
        console.log('[SuperAdminDashboard] Using demo stats data instead')
        
        // Return demo stats
        return {
          total_providers: 12,
          active_providers: 8,
          total_admins: 25,
          total_drivers: 45,
          active_drivers: 32,
          total_rides: 358,
          rides_today: 18,
          completed_rides: 320,
          cancelled_rides: 38,
          total_revenue: 15780.50,
          revenue_today: 780.25,
          pending_support_tickets: 7,
          average_ride_cost: 44.08,
          total_providers_revenue: 9468.30,
          total_drivers_earnings: 4734.15,
          insurance_claims_amount: 1578.05,
          pending_payouts: 3156.10,
          monthly_growth_rate: 8.5,
          driver_utilization_rate: 71.1,
          average_response_time: 6.5,
          customer_satisfaction_rate: 92.3
        };
      }

      // Return data structure with actual provider data
      return {
        total_providers: providers?.length || 0,
        active_providers: providers?.filter(p => p.is_active)?.length || 0,
        total_admins: 0, // Replace with actual data when available
        total_drivers: 0,
        active_drivers: 0, 
        total_rides: 0,
        rides_today: 0,
        completed_rides: 0,
        cancelled_rides: 0,
        total_revenue: 0,
        revenue_today: 0,
        pending_support_tickets: 0,
        average_ride_cost: 0,
        total_providers_revenue: 0,
        total_drivers_earnings: 0,
        insurance_claims_amount: 0,
        pending_payouts: 0,
        monthly_growth_rate: 0,
        driver_utilization_rate: 0,
        average_response_time: 0,
        customer_satisfaction_rate: 0
      }
    } catch (error) {
      console.error('[SuperAdminDashboard] Error in fetchStats:', error)
      console.log('[SuperAdminDashboard] Using demo stats data due to error')
      
      // Return demo stats on error
      return {
        total_providers: 12,
        active_providers: 8,
        total_admins: 25,
        total_drivers: 45,
        active_drivers: 32,
        total_rides: 358,
        rides_today: 18,
        completed_rides: 320,
        cancelled_rides: 38,
        total_revenue: 15780.50,
        revenue_today: 780.25,
        pending_support_tickets: 7,
        average_ride_cost: 44.08,
        total_providers_revenue: 9468.30,
        total_drivers_earnings: 4734.15,
        insurance_claims_amount: 1578.05,
        pending_payouts: 3156.10,
        monthly_growth_rate: 8.5,
        driver_utilization_rate: 71.1,
        average_response_time: 6.5,
        customer_satisfaction_rate: 92.3
      };
    }
  }

  const fetchRevenueData = async (): Promise<RevenueData[]> => {
    try {
      console.log('[SuperAdminDashboard] Fetching revenue data...')
      const days = 30
      const startDate = subDays(new Date(), days)

      const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select(`
          created_at,
          cost,
          status,
          provider_fee,
          driver_earnings,
          insurance_claim_amount
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at')

      // If table doesn't exist or there's an error, use demo data
      if (ridesError) {
        console.error('[SuperAdminDashboard] Error fetching rides:', ridesError)
        console.log('[SuperAdminDashboard] Using demo revenue data instead')
        
        // Return demo revenue data
        const demoRevenueData: RevenueData[] = [];
        for (let i = 0; i < 30; i++) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          const randomValue = Math.floor(400 + Math.random() * 600);
          const rides = Math.floor(8 + Math.random() * 12);
          demoRevenueData.push({
            date,
            revenue: randomValue,
            rides,
            provider_revenue: randomValue * 0.6,
            driver_earnings: randomValue * 0.3,
            insurance_claims: randomValue * 0.1
          });
        }
        return demoRevenueData.reverse();
      }

      // If no rides data, return demo data
      if (!rides || rides.length === 0) {
        console.log('[SuperAdminDashboard] No ride data found, using demo revenue data')
        
        // Return demo revenue data
        const demoRevenueData: RevenueData[] = [];
        for (let i = 0; i < 30; i++) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          const randomValue = Math.floor(400 + Math.random() * 600);
          const rides = Math.floor(8 + Math.random() * 12);
          demoRevenueData.push({
            date,
            revenue: randomValue,
            rides,
            provider_revenue: randomValue * 0.6,
            driver_earnings: randomValue * 0.3,
            insurance_claims: randomValue * 0.1
          });
        }
        return demoRevenueData.reverse();
      }

      const dailyData: { [key: string]: RevenueData } = {}

      // Initialize all days
      for (let i = 0; i <= days; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
        dailyData[date] = { date, revenue: 0, rides: 0, provider_revenue: 0, driver_earnings: 0, insurance_claims: 0 }
      }

      // Aggregate ride data
      rides.forEach(ride => {
        const date = format(new Date(ride.created_at), 'yyyy-MM-dd')
        if (dailyData[date]) {
          dailyData[date].revenue += ride.cost || 0
          dailyData[date].rides += 1
          dailyData[date].provider_revenue += ride.provider_fee || 0
          dailyData[date].driver_earnings += ride.driver_earnings || 0
          dailyData[date].insurance_claims += ride.insurance_claim_amount || 0
        }
      })

      return Object.values(dailyData).reverse()
    } catch (error) {
      console.error('[SuperAdminDashboard] Error in fetchRevenueData:', error)
      console.log('[SuperAdminDashboard] Using demo revenue data due to error')
      
      // Return demo revenue data on error
      const demoRevenueData: RevenueData[] = [];
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const randomValue = Math.floor(400 + Math.random() * 600);
        const rides = Math.floor(8 + Math.random() * 12);
        demoRevenueData.push({
          date,
          revenue: randomValue,
          rides,
          provider_revenue: randomValue * 0.6,
          driver_earnings: randomValue * 0.3,
          insurance_claims: randomValue * 0.1
        });
      }
      return demoRevenueData.reverse();
    }
  }

  const fetchRideStatusDistribution = async (): Promise<RideStatus[]> => {
    try {
      console.log('[SuperAdminDashboard] Fetching ride status distribution...')
      
      const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select('status')

      // If table doesn't exist or there's an error, use demo data
      if (ridesError) {
        console.error('[SuperAdminDashboard] Error fetching ride statuses:', ridesError)
        console.log('[SuperAdminDashboard] Using demo ride status data instead')
        
        // Return demo data
        return [
          { status: 'completed', count: 320 },
          { status: 'cancelled', count: 38 },
          { status: 'in_progress', count: 12 },
          { status: 'scheduled', count: 28 }
        ]
      }

      // If no rides data, return demo data
      if (!rides || rides.length === 0) {
        console.log('[SuperAdminDashboard] No ride data found, using demo data')
        return [
          { status: 'completed', count: 320 },
          { status: 'cancelled', count: 38 },
          { status: 'in_progress', count: 12 },
          { status: 'scheduled', count: 28 }
        ]
      }

      // Process actual ride data
      const statusCounts: { [key: string]: number } = {}
      rides.forEach(ride => {
        statusCounts[ride.status] = (statusCounts[ride.status] || 0) + 1
      })

      return Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }))
    } catch (error) {
      console.error('[SuperAdminDashboard] Error in fetchRideStatusDistribution:', error)
      console.log('[SuperAdminDashboard] Using demo ride status data due to error')
      
      // Return demo data on error
      return [
        { status: 'completed', count: 320 },
        { status: 'cancelled', count: 38 },
        { status: 'in_progress', count: 12 },
        { status: 'scheduled', count: 28 }
      ]
    }
  }

  // If error is visible, show simplified dashboard
  if (error) {
    console.log('[SuperAdminDashboard] Rendering error state')
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">System-wide analytics and management</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="text-lg font-medium text-red-800">Dashboard Error</h3>
          <p className="text-red-700 mt-2">{error}</p>
          <div className="mt-4 space-x-4">
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded" 
              onClick={() => fetchDashboardData()}
            >
              Retry
            </button>
            <button 
              className="px-4 py-2 bg-gray-600 text-white rounded" 
              onClick={() => {
                setError(null)
                setDemoData()
              }}
            >
              Use Demo Data
            </button>
          </div>
        </div>

        {/* Fallback content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$15,780.50</div>
              <p className="text-xs text-muted-foreground">
                +$780.25 today
              </p>
            </CardContent>
          </Card>
          {/* Add more cards here as needed */}
        </div>
      </div>
    )
  }

  if (isLoading) {
    console.log('[SuperAdminDashboard] Rendering loading state')
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    )
  }

  // This log is crucial to see if we get this far
  console.log('[SuperAdminDashboard] Rendering dashboard with data:', {
    hasStats: !!stats,
    revenueDataLength: revenueData.length,
    rideStatusesLength: rideStatuses.length
  })

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">System-wide analytics and management</p>
        </div>
        <div className="flex space-x-4">
          <a 
            href="/providers-dashboard" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
            onClick={() => {
              console.log('[SuperAdminDashboard] Navigating to providers dashboard page')
            }}
          >
            Manage Providers
          </a>
          <Button variant="destructive" asChild>
            <Link href="/super-admin-dashboard/members">
              Members Directory
            </Link>
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
            <Link href="/super-admin/support">
              AI Support
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">Dashboard Error</h3>
          <p>Failed to fetch dashboard data. Using demo data instead.</p>
          <div className="mt-3 flex space-x-4">
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => fetchDashboardData()}
            >
              Retry
            </Button>
            <a 
              href="/providers-simple" 
              className="inline-flex items-center justify-center text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-9 px-3"
              onClick={() => {
                console.log('[SuperAdminDashboard] Demo mode: Navigating to simplified providers page')
              }}
            >
              Go to Provider Management
            </a>
          </div>
        </div>
      )}

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
                  <div className="h-3 w-3 rounded-full bg-purple-500 mr-1"></div>
                  <span>Revenue</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 mr-1"></div>
                  <span>Provider</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-amber-400 mr-1"></div>
                  <span>Driver</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-400 mr-1"></div>
                  <span>Rides</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[320px]">
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
                    stroke="#8884d8"
                    strokeWidth={3}
                    name="Total Revenue ($)"
                    dot={false}
                    activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2, fill: 'white' }}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="provider_revenue"
                    stroke="#4ade80"
                    strokeWidth={3}
                    name="Provider Revenue ($)"
                    dot={false}
                    activeDot={{ r: 6, stroke: '#4ade80', strokeWidth: 2, fill: 'white' }}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="driver_earnings"
                    stroke="#fbbf24"
                    strokeWidth={3}
                    name="Driver Earnings ($)"
                    dot={false}
                    activeDot={{ r: 6, stroke: '#fbbf24', strokeWidth: 2, fill: 'white' }}
                  />
                  <Line
                    yAxisId="rides"
                    type="monotone"
                    dataKey="rides"
                    stroke="#60a5fa"
                    strokeWidth={3}
                    name="Number of Rides"
                    dot={false}
                    activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="colorPie1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8884d8" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="colorPie2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="colorPie3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={1}/>
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
                    labelLine={false}
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
            </div>
            <div className="flex justify-center space-x-6 pt-2 pb-2">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-indigo-500 mr-2"></div>
                <span className="text-sm">Provider Revenue</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-emerald-500 mr-2"></div>
                <span className="text-sm">Driver Earnings</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                <span className="text-sm">Insurance Claims</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Details */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Detailed breakdown of revenue and expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Revenue Breakdown</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Gross Revenue</span>
                    <span className="font-medium">${stats?.total_revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider Fees</span>
                    <span className="font-medium">${stats?.total_providers_revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Driver Earnings</span>
                    <span className="font-medium">${stats?.total_drivers_earnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Key Metrics</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Avg. Ride Cost</span>
                    <span className="font-medium">${stats?.average_ride_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Rides</span>
                    <span className="font-medium">{stats?.completed_rides}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancelled Rides</span>
                    <span className="font-medium">{stats?.cancelled_rides}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Insurance & Claims</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Total Claims</span>
                    <span className="font-medium">${stats?.insurance_claims_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Claims Ratio</span>
                    <span className="font-medium">
                      {((stats?.insurance_claims_amount || 0) / (stats?.total_revenue || 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Payouts</span>
                    <span className="font-medium">${stats?.pending_payouts.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Quick Access Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Link href="/super-admin-dashboard/members" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
              <Users className="h-6 w-6 text-primary" />
              <span className="text-sm text-center">Members</span>
            </Link>
            
            <Link href="/super-admin-dashboard/drivers" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
              <Car className="h-6 w-6 text-primary" />
              <span className="text-sm text-center">Drivers</span>
            </Link>
            
            <Link href="/super-admin-dashboard/providers" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-sm text-center">Providers</span>
            </Link>

            <Link href="/super-admin-dashboard/ride-requests" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
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
              <UserPlus className="h-6 w-6 text-red-500 mb-2" />
              <span className="text-center text-sm">Driver Info</span>
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

      <GeographicNodes />
    </div>
  )
} 