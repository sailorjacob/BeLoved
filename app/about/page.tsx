'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function AboutPage() {
  const router = useRouter()
  
  return (
    <main className="container mx-auto py-8 px-4 max-w-3xl">
      <Button 
        variant="ghost" 
        className="flex items-center gap-2 mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-3">
          <span role="img" aria-label="van" className="text-3xl">🚐</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">BeLoved</h1>
        </div>
        <p className="text-lg font-medium tracking-tight text-gray-600 mt-2">
          A comprehensive <strong>ride scheduling platform</strong> with both <strong>web and mobile components</strong>, built using <strong>Next.js</strong>, <strong>Supabase</strong>, and <strong>TypeScript</strong>.
        </p>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="people" className="text-2xl">👥</span>
          <h2 className="text-2xl font-bold text-gray-900">Multi-User System</h2>
        </div>
        
        <ul className="space-y-4 ml-8 list-disc">
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="person" className="text-xl flex-shrink-0">👤</span>
              <div><strong>Members:</strong> Schedule rides, track ride status</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="car" className="text-xl flex-shrink-0">🚗</span>
              <div><strong>Drivers:</strong> Manage assigned rides, track mileage, check in at car washes</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="admin" className="text-xl flex-shrink-0">🧑‍💼</span>
              <div><strong>Admins:</strong> Manage all rides, drivers, and members</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="super-admin" className="text-xl flex-shrink-0">🧑‍💻</span>
              <div><strong>Super-Admins:</strong> Oversee and manage the entire system</div>
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="calendar" className="text-2xl">🗓️</span>
          <h2 className="text-2xl font-bold text-gray-900">Core Ride Scheduling Features</h2>
        </div>
        
        <ul className="space-y-4 ml-8 list-disc">
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="taxi" className="text-xl flex-shrink-0">🚕</span>
              <div>Schedule rides with pickup/dropoff addresses</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="clock" className="text-xl flex-shrink-0">⏰</span>
              <div>Appointment time support</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="repeat" className="text-xl flex-shrink-0">🔁</span>
              <div>Return trip & recurring ride functionality (daily, weekly, monthly)</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="credit-card" className="text-xl flex-shrink-0">💳</span>
              <div>Multiple payment options: cash, credit, insurance</div>
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="car" className="text-2xl">🚘</span>
          <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
        </div>
        
        <ul className="space-y-4 ml-8 list-disc">
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="clipboard" className="text-xl flex-shrink-0">📋</span>
              <div>Ride assignment system</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="location" className="text-xl flex-shrink-0">📍</span>
              <div>Real-time ride status updates</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="ruler" className="text-xl flex-shrink-0">📏</span>
              <div>Mileage tracking</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="soap" className="text-xl flex-shrink-0">🧼</span>
              <div>Carwash check-in system (Crew Carwash) with <span role="img" aria-label="star">⭐</span> rewards</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="chart" className="text-xl flex-shrink-0">📊</span>
              <div>Driver performance statistics</div>
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="wrench" className="text-2xl">🛠️</span>
          <h2 className="text-2xl font-bold text-gray-900">Administrative Features</h2>
        </div>
        
        <ul className="space-y-4 ml-8 list-disc">
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="chart" className="text-xl flex-shrink-0">📈</span>
              <div>Dashboards for data insights</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="person" className="text-xl flex-shrink-0">🙍‍♂️</span>
              <div>User & role management</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="hospital" className="text-xl flex-shrink-0">🏥</span>
              <div>Transportation provider coordination</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="van" className="text-xl flex-shrink-0">🚐</span>
              <div>Vehicle fleet tracking</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="note" className="text-xl flex-shrink-0">📝</span>
              <div>Member notes system</div>
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="mobile" className="text-2xl">📱</span>
          <h2 className="text-2xl font-bold text-gray-900">Mobile App Integration</h2>
        </div>
        
        <ul className="space-y-4 ml-8 list-disc">
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="phone" className="text-xl flex-shrink-0">📲</span>
              <div>iOS app built with Capacitor</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="bell" className="text-xl flex-shrink-0">🔔</span>
              <div>Push notifications</div>
            </div>
          </li>
          
          <li className="pl-1">
            <div className="flex items-start gap-3">
              <span role="img" aria-label="pin" className="text-xl flex-shrink-0">📌</span>
              <div>Geolocation services</div>
            </div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 my-8"></div>
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span role="img" aria-label="brain" className="text-2xl">🧠</span>
          <h2 className="text-2xl font-bold text-gray-900">Summary</h2>
        </div>
        
        <p className="text-base ml-1">
          This platform is tailored for transportation services, especially in healthcare, where members (patients) need reliable transport to and from appointments. With a solid architecture, security-first approach, and well-separated concerns, the system is scalable and production-ready. <span role="img" aria-label="check">✅</span>
        </p>
      </div>
    </main>
  )
} 