'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PreviewDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('analytics')
  
  // Fake data for charts
  const currentMonth = new Date().toLocaleString('default', { month: 'long' })
  const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long' })
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-4"
              onClick={() => router.push('/about')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to About
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <span>BeLoved Admin Preview</span>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Demo</span>
            </h1>
          </div>
          <div className="flex items-center">
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
              Preview Mode
            </span>
          </div>
        </div>
      </header>
      
      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['analytics', 'rides', 'drivers', 'members', 'vehicles', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
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
        {/* Dashboard header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Analytics Dashboard
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <select className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm font-medium text-gray-700 mr-3">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
              <option>Last month</option>
            </select>
            <Button>Export Data</Button>
          </div>
        </div>
        
        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Rides
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        1,482
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="sr-only">Increased by</span>
                        12.5%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Members
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        284
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="sr-only">Increased by</span>
                        8.2%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Monthly Revenue
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        $24,352
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="sr-only">Increased by</span>
                        5.4%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Driver Reliability
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        98.3%
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="sr-only">Increased by</span>
                        1.2%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main chart */}
        <div className="bg-white p-6 shadow rounded-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Monthly Rides</h3>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {currentMonth}
              </span>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {previousMonth}
              </span>
            </div>
          </div>
          
          {/* Chart placeholder */}
          <div className="relative h-80 w-full">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M0,240 C60,220 120,230 180,210 C240,190 300,120 360,150 C420,180 480,200 540,180 C600,160 660,120 720,110 C780,100 840,100 900,130 C960,160 1020,180 1080,170 C1140,160 1200,130 1200,130 L1200,300 L0,300 Z" 
                fill="url(#gradient1)" 
              />
              <path 
                d="M0,240 C60,220 120,230 180,210 C240,190 300,120 360,150 C420,180 480,200 540,180 C600,160 660,120 720,110 C780,100 840,100 900,130 C960,160 1020,180 1080,170 C1140,160 1200,130 1200,130" 
                fill="none" 
                stroke="#6366F1" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              
              <defs>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M0,260 C60,250 120,260 180,240 C240,220 300,180 360,200 C420,220 480,230 540,220 C600,210 660,180 720,170 C780,160 840,160 900,180 C960,200 1020,210 1080,200 C1140,190 1200,180 1200,180 L1200,300 L0,300 Z" 
                fill="url(#gradient2)" 
              />
              <path 
                d="M0,260 C60,250 120,260 180,240 C240,220 300,180 360,200 C420,220 480,230 540,220 C600,210 660,180 720,170 C780,160 840,160 900,180 C960,200 1020,210 1080,200 C1140,190 1200,180 1200,180" 
                fill="none" 
                stroke="#818CF8" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeDasharray="5,5" 
              />
            </svg>
            
            {/* X axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
              <span>30</span>
            </div>
          </div>
        </div>
        
        {/* Secondary charts - 2 columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Column 1 - Donut chart */}
          <div className="bg-white p-6 shadow rounded-lg">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Ride Distribution</h3>
            <p className="text-sm text-gray-500 mb-6">Breakdown of ride types in the current period</p>
            
            <div className="flex items-center justify-center">
              <div className="relative h-64 w-64">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Donut segments */}
                  <circle r="30" cx="50" cy="50" fill="transparent" stroke="#E0F2FE" strokeWidth="30" strokeDasharray="188.5" strokeDashoffset="0"></circle>
                  <circle r="30" cx="50" cy="50" fill="transparent" stroke="#38BDF8" strokeWidth="30" strokeDasharray="188.5" strokeDashoffset="120"></circle>
                  <circle r="30" cx="50" cy="50" fill="transparent" stroke="#0EA5E9" strokeWidth="30" strokeDasharray="188.5" strokeDashoffset="160"></circle>
                  <circle r="30" cx="50" cy="50" fill="transparent" stroke="#0284C7" strokeWidth="30" strokeDasharray="188.5" strokeDashoffset="180"></circle>
                  <circle r="30" cx="50" cy="50" fill="transparent" stroke="#075985" strokeWidth="30" strokeDasharray="188.5" strokeDashoffset="185"></circle>
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill="#0C4A6E">Medical</text>
                  <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#0C4A6E">65%</text>
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-[#38BDF8] mr-2"></span>
                <span className="text-sm text-gray-600">Medical: 65%</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-[#0EA5E9] mr-2"></span>
                <span className="text-sm text-gray-600">Personal: 20%</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-[#0284C7] mr-2"></span>
                <span className="text-sm text-gray-600">Work: 10%</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-[#075985] mr-2"></span>
                <span className="text-sm text-gray-600">Other: 5%</span>
              </div>
            </div>
          </div>
          
          {/* Column 2 - Top drivers */}
          <div className="bg-white p-6 shadow rounded-lg">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Top Drivers</h3>
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">View all</a>
            </div>
            
            <div className="space-y-4">
              {/* Driver 1 */}
              <div className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                  JD
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">John Doe</h4>
                      <p className="text-xs text-gray-500">142 rides this month</p>
                    </div>
                    <div>
                      <span className="flex items-center text-sm font-medium text-green-600">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        98.7%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "98%" }}></div>
                  </div>
                </div>
              </div>
              
              {/* Driver 2 */}
              <div className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  MJ
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Maria Johnson</h4>
                      <p className="text-xs text-gray-500">136 rides this month</p>
                    </div>
                    <div>
                      <span className="flex items-center text-sm font-medium text-green-600">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        97.5%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "97%" }}></div>
                  </div>
                </div>
              </div>
              
              {/* Driver 3 */}
              <div className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-semibold">
                  RW
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Robert Williams</h4>
                      <p className="text-xs text-gray-500">119 rides this month</p>
                    </div>
                    <div>
                      <span className="flex items-center text-sm font-medium text-green-600">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        96.8%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "96%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Demo note */}
      <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="p-2 rounded-lg bg-yellow-50 shadow-lg sm:p-3">
            <div className="flex items-center justify-between flex-wrap">
              <div className="w-0 flex-1 flex items-center">
                <span className="flex p-2 rounded-lg bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </span>
                <p className="ml-3 font-medium text-yellow-700 truncate">
                  <span className="md:hidden">This is a demo preview of the dashboard.</span>
                  <span className="hidden md:inline">This is a non-functional preview of the BeLoved admin dashboard. All data shown is fictional.</span>
                </p>
              </div>
              <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
                <a
                  href="/about"
                  className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50"
                >
                  Return to About
                </a>
              </div>
              <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
                <button
                  type="button"
                  className="-mr-1 flex p-2 rounded-md hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-6 w-6 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 