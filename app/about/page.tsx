'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function AboutPage() {
  const router = useRouter()
  
  return (
    <main className="container mx-auto py-16 px-4 max-w-3xl">
      <Button 
        variant="ghost" 
        className="flex items-center gap-2 mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <div className="mb-14">
        <div className="mb-3 flex items-center gap-3">
          <span role="img" aria-label="van" className="text-3xl">🚐</span>
          <h1 className="text-[32px] font-semibold leading-10 text-[rgb(13,13,13)]">BeLoved</h1>
        </div>
        <p className="text-lg font-medium tracking-tight text-gray-600 mt-2">
          A comprehensive <strong>ride scheduling platform</strong> with both <strong>web and mobile components</strong>, built using <strong>Next.js</strong>, <strong>Supabase</strong>, and <strong>TypeScript</strong>.
        </p>
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
          This platform is tailored for transportation services, especially in healthcare, where members (patients) need reliable transport to and from appointments. With a solid architecture, security-first approach, and well-separated concerns, the system is scalable and production-ready. <span role="img" aria-label="check">✅</span>
        </p>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="rocket" className="text-2xl">🚀</span>
          <h2 className="text-[24px] font-semibold leading-8 text-[rgb(13,13,13)]">Current Status & Future Vision</h2>
        </div>
        
        <p className="text-base ml-1">
          BeLoved is starting small, with a pilot program in Bloomington, Indiana while investing in fleets of self-driving electric vehicles and working closely with state Medicaid, brokering, and health insurance sectors to provide safe and reliable non-emergency medical transport.
        </p>
        
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
    </main>
  )
} 