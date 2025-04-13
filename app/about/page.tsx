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
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3 flex items-center justify-center gap-2">
          <span role="img" aria-label="van">🚐</span> Be-Loved Scheduler Overview
        </h1>
        <p className="text-lg">
          A comprehensive ride scheduling platform with both web and mobile components, built using Next.js, Supabase, and TypeScript.
        </p>
      </div>
      
      <div className="border-t border-b border-gray-200 my-6"></div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <span role="img" aria-label="people">👥</span> Multi-User System
        </h2>
        <ul className="space-y-3 pl-7">
          <li className="flex items-start gap-3">
            <span role="img" aria-label="person" className="text-xl flex-shrink-0">👤</span>
            <div><span className="font-semibold">Members:</span> Schedule rides, track ride status</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="car" className="text-xl flex-shrink-0">🚗</span>
            <div><span className="font-semibold">Drivers:</span> Manage assigned rides, track mileage, check in at car washes</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="admin" className="text-xl flex-shrink-0">🧑‍💼</span>
            <div><span className="font-semibold">Admins:</span> Manage all rides, drivers, and members</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="super-admin" className="text-xl flex-shrink-0">🧑‍💻</span>
            <div><span className="font-semibold">Super-Admins:</span> Oversee and manage the entire system</div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-b border-gray-200 my-6"></div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <span role="img" aria-label="calendar">🗓️</span> Core Ride Scheduling Features
        </h2>
        <ul className="space-y-3 pl-7">
          <li className="flex items-start gap-3">
            <span role="img" aria-label="taxi" className="text-xl flex-shrink-0">🚕</span>
            <div>Schedule rides with pickup/dropoff addresses</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="clock" className="text-xl flex-shrink-0">⏰</span>
            <div>Appointment time support</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="repeat" className="text-xl flex-shrink-0">🔁</span>
            <div>Return trip & recurring ride functionality (daily, weekly, monthly)</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="credit-card" className="text-xl flex-shrink-0">💳</span>
            <div>Multiple payment options: cash, credit, insurance</div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-b border-gray-200 my-6"></div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <span role="img" aria-label="car">🚘</span> Driver Management
        </h2>
        <ul className="space-y-3 pl-7">
          <li className="flex items-start gap-3">
            <span role="img" aria-label="clipboard" className="text-xl flex-shrink-0">📋</span>
            <div>Ride assignment system</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="location" className="text-xl flex-shrink-0">📍</span>
            <div>Real-time ride status updates</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="ruler" className="text-xl flex-shrink-0">📏</span>
            <div>Mileage tracking</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="soap" className="text-xl flex-shrink-0">🧼</span>
            <div>Carwash check-in system (Crew Carwash) with <span role="img" aria-label="star">⭐</span> rewards</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="chart" className="text-xl flex-shrink-0">📊</span>
            <div>Driver performance statistics</div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-b border-gray-200 my-6"></div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <span role="img" aria-label="wrench">🛠️</span> Administrative Features
        </h2>
        <ul className="space-y-3 pl-7">
          <li className="flex items-start gap-3">
            <span role="img" aria-label="chart" className="text-xl flex-shrink-0">📈</span>
            <div>Dashboards for data insights</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="person" className="text-xl flex-shrink-0">🙍‍♂️</span>
            <div>User & role management</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="hospital" className="text-xl flex-shrink-0">🏥</span>
            <div>Transportation provider coordination</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="van" className="text-xl flex-shrink-0">🚐</span>
            <div>Vehicle fleet tracking</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="note" className="text-xl flex-shrink-0">📝</span>
            <div>Member notes system</div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-b border-gray-200 my-6"></div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <span role="img" aria-label="mobile">📱</span> Mobile App Integration
        </h2>
        <ul className="space-y-3 pl-7">
          <li className="flex items-start gap-3">
            <span role="img" aria-label="phone" className="text-xl flex-shrink-0">📲</span>
            <div>iOS app built with Capacitor</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="bell" className="text-xl flex-shrink-0">🔔</span>
            <div>Push notifications</div>
          </li>
          <li className="flex items-start gap-3">
            <span role="img" aria-label="pin" className="text-xl flex-shrink-0">📌</span>
            <div>Geolocation services</div>
          </li>
        </ul>
      </div>
      
      <div className="border-t border-b border-gray-200 my-6"></div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <span role="img" aria-label="brain">🧠</span> Final Thoughts
        </h2>
        <p className="text-lg pl-7">
          This platform is tailored for transportation services, especially in healthcare, where members (patients) need reliable transport to and from appointments. With a solid architecture, security-first approach, and well-separated concerns, the system is scalable and production-ready. <span role="img" aria-label="check">✅</span>
        </p>
      </div>
    </main>
  )
} 