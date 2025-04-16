'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AboutPage() {
  const router = useRouter()
  
  return (
    <main className="container mx-auto py-16 px-4 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="text-gray-700 hover:bg-gray-50 border-gray-300 rounded-full px-6"
          onClick={() => window.location.href = "https://be-loved.app/login"}
        >
          Login
        </Button>
      </div>
      
      <div className="mb-14">
        <div className="mb-3 flex items-center gap-3">
          <span role="img" aria-label="van" className="text-3xl">🚐</span>
          <h1 className="text-[42px] font-semibold leading-10 text-[rgb(13,13,13)]">BeLoved <span role="img" aria-label="heart" className="text-red-500">❤️</span></h1>
        </div>
        <p className="text-base font-medium tracking-tight text-gray-600 mt-3 mx-auto px-4 max-w-2xl">
          A comprehensive <strong>ride scheduling platform</strong> with both <strong>web and mobile components</strong>, built using <strong>Next.js</strong>, <strong>Supabase</strong>, and <strong>TypeScript</strong>.
        </p>
        
        <div className="mt-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-gray-800 text-sm">
            <strong>BeLoved is live and in action!</strong> Our pilot program is currently running in Bloomington, Indiana.
            <a href="/preview-dashboard" className="ml-3 inline-flex items-center px-3 py-1 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
              Preview Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </p>
        </div>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="rocket" className="text-2xl">🚀</span>
          <h2 className="text-[24px] font-semibold leading-8 text-[rgb(13,13,13)]">Future Vision:</h2>
        </div>
        
        <p className="text-base ml-1">
          BeLoved is starting small, with a pilot program in Bloomington, Indiana while investing in fleets of self-driving electric vehicles and working closely with state Medicaid, brokering, and health insurance sectors to provide safe and reliable non-emergency medical transport.
        </p>
        
        <div className="my-6 flex justify-center">
          <svg className="w-full max-w-lg h-auto rounded-lg shadow-md" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="1200" height="800" fill="#f8fafc" />
            
            {/* Header */}
            <rect width="1200" height="80" fill="#f3f4f6" />
            <text x="30" y="45" fontFamily="Arial" fontSize="24" fill="#333">BeLoved Admin Dashboard</text>
            <circle cx="1150" cy="40" r="20" fill="#d1d5db" />
            
            {/* Main content area */}
            <rect x="30" y="100" width="550" height="300" rx="8" fill="white" stroke="#e5e7eb" />
            <text x="50" y="130" fontFamily="Arial" fontSize="18" fill="#333">Revenue & Earnings</text>
            <path d="M50,300 Q150,200 250,350 T450,250" stroke="#ef4444" strokeWidth="3" fill="none" />
            <path d="M50,350 Q150,300 250,250 T450,300" stroke="#ec4899" strokeWidth="3" fill="none" />
            
            {/* Chart area */}
            <rect x="620" y="100" width="550" height="300" rx="8" fill="white" stroke="#e5e7eb" />
            <text x="640" y="130" fontFamily="Arial" fontSize="18" fill="#333">Distribution</text>
            <circle cx="900" cy="250" r="100" fill="none" stroke="#f3f4f6" strokeWidth="30" />
            <path d="M900,250 L900,150 A100,100 0 0,1 985,303 z" fill="#ffffff" />
            <path d="M900,250 L985,303 A100,100 0 0,1 815,303 z" fill="#f9fafb" />
            <path d="M900,250 L815,303 A100,100 0 0,1 900,150 z" fill="#f3f4f6" />
            
            {/* Data tables */}
            <rect x="30" y="420" width="1140" height="350" rx="8" fill="white" stroke="#e5e7eb" />
            <text x="50" y="450" fontFamily="Arial" fontSize="18" fill="#333">Transportation Summary</text>
            <line x1="50" y1="470" x2="1150" y2="470" stroke="#e5e7eb" strokeWidth="2" />
            
            {/* Table rows */}
            <rect x="50" y="490" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="270" y="490" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="490" y="490" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="710" y="490" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="930" y="490" width="200" height="30" fill="#f3f4f6" rx="4" />
            
            <rect x="50" y="530" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="270" y="530" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="490" y="530" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="710" y="530" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="930" y="530" width="200" height="30" fill="#f8fafc" rx="4" />
            
            <rect x="50" y="570" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="270" y="570" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="490" y="570" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="710" y="570" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="930" y="570" width="200" height="30" fill="#f3f4f6" rx="4" />
            
            <rect x="50" y="610" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="270" y="610" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="490" y="610" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="710" y="610" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="930" y="610" width="200" height="30" fill="#f8fafc" rx="4" />
            
            <rect x="50" y="650" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="270" y="650" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="490" y="650" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="710" y="650" width="200" height="30" fill="#f3f4f6" rx="4" />
            <rect x="930" y="650" width="200" height="30" fill="#f3f4f6" rx="4" />
            
            <rect x="50" y="690" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="270" y="690" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="490" y="690" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="710" y="690" width="200" height="30" fill="#f8fafc" rx="4" />
            <rect x="930" y="690" width="200" height="30" fill="#f8fafc" rx="4" />
          </svg>
        </div>
        
        <ul className="space-y-2 ml-8 list-disc mt-4">
          <li className="pl-1">
            <div>
              <strong>Pilot Location:</strong> Bloomington, Indiana service area
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              <strong>Future Fleet:</strong> Investing in self-driving electric vehicles
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              <strong>Healthcare Partners:</strong> Collaborating with Medicaid, brokers, and insurance providers
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              <strong>Mission:</strong> Providing safe, reliable non-emergency medical transportation
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="people" className="text-2xl">👥</span>
          <h2 className="text-[24px] font-semibold leading-8 text-[rgb(13,13,13)]">Multi-User System</h2>
        </div>
        
        <ul className="space-y-2 ml-8 list-disc">
          <li className="pl-1">
            <div>
              <strong>Members:</strong> Schedule rides, track ride status
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              <strong>Drivers:</strong> Manage assigned rides, track mileage, check in at car washes
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              <strong>Admins:</strong> Manage all rides, drivers, and members
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              <strong>Super-Admins:</strong> Oversee and manage the entire system
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="calendar" className="text-2xl">🗓️</span>
          <h2 className="text-[24px] font-semibold leading-8 text-[rgb(13,13,13)]">Core Ride Scheduling Features</h2>
        </div>
        
        <ul className="space-y-2 ml-8 list-disc">
          <li className="pl-1">
            <div>
              Schedule rides with pickup/dropoff addresses
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Appointment time support
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Return trip & recurring ride functionality (daily, weekly, monthly)
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Multiple payment options: cash, credit, insurance
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="car" className="text-2xl">🚘</span>
          <h2 className="text-[24px] font-semibold leading-8 text-[rgb(13,13,13)]">Driver Management</h2>
        </div>
        
        <ul className="space-y-2 ml-8 list-disc">
          <li className="pl-1">
            <div>
              Ride assignment system
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Real-time ride status updates
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Mileage tracking
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Carwash check-in system (Crew Carwash) with <span role="img" aria-label="star">⭐</span> rewards
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Driver performance statistics
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="wrench" className="text-2xl">🛠️</span>
          <h2 className="text-[24px] font-semibold leading-8 text-[rgb(13,13,13)]">Administrative Features</h2>
        </div>
        
        <ul className="space-y-2 ml-8 list-disc">
          <li className="pl-1">
            <div>
              Dashboards for data insights
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              User & role management
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Transportation provider coordination
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Vehicle fleet tracking
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Member notes system
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="mobile" className="text-2xl">📱</span>
          <h2 className="text-[24px] font-semibold leading-8 text-[rgb(13,13,13)]">Mobile App Integration</h2>
        </div>
        
        <ul className="space-y-2 ml-8 list-disc">
          <li className="pl-1">
            <div>
              iOS app built with Capacitor
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Push notifications
            </div>
          </li>
          
          <li className="pl-1">
            <div>
              Geolocation services
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <h2 className="text-[24px] font-semibold leading-8 text-[rgb(13,13,13)] mb-4">Summary</h2>
        
        <p className="text-base ml-1">
          This platform is tailored for transportation services, especially in healthcare, where members (patients) need reliable transport to and from appointments. With a solid architecture, security-first approach, and well-separated concerns, the system is scalable and production-ready.
        </p>
      </div>
    </main>
  )
} 