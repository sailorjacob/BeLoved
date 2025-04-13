'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function SupportPage() {
  const router = useRouter()
  
  return (
    <main className="container mx-auto p-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        className="flex items-center gap-2 mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <div className="prose max-w-none">
        <h1 className="text-3xl font-bold mb-2">Support</h1>
        <p className="text-gray-600 mb-6">We're here to help with your transportation needs.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
        <p>Multiple ways to reach our support team:</p>
        <ul className="list-disc pl-6 space-y-2 my-4">
          <li><p>By email: support@be-loved.app</p></li>
          <li><p>By phone: +1 (812) 913-9571 (Available Monday-Friday, 8am-6pm)</p></li>
          <li><p>Through our support portal: <a href="https://be-loved.app/support" rel="external nofollow noopener" target="_blank">https://be-loved.app/support</a></p></li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Frequently Asked Questions</h2>
        
        <h3 className="text-xl font-bold mt-6 mb-3">How do I schedule a recurring ride for appointments?</h3>
        <p>
          When scheduling a ride, select the "Recurring" option and choose your preferred frequency (daily, weekly, or monthly). Our system will automatically generate future rides based on your selection.
        </p>
        
        <h3 className="text-xl font-bold mt-6 mb-3">What should I do if I miss my pickup time?</h3>
        <p>
          If you've missed your scheduled pickup, please call our support line at +1 (812) 913-9571 immediately. Our team will help reschedule your ride or coordinate with the driver if they're still in the area.
        </p>
        
        <h3 className="text-xl font-bold mt-6 mb-3">How can I modify a trip or cancel a recurring schedule?</h3>
        <p>
          To modify a single trip, locate the ride in your "My Rides" section and select "Edit." For recurring schedules, you can manage your recurring rides in the "Recurring Rides" tab of your dashboard.
        </p>
        
        <h3 className="text-xl font-bold mt-6 mb-3">What is my Trip ID, and how do I use it?</h3>
        <p>
          Your Trip ID is a unique identifier assigned to each ride (e.g., T123456). You can find your Trip ID in your ride details. When contacting support about a specific ride, please provide this ID for faster assistance.
        </p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Troubleshooting</h2>
        
        <h3 className="text-xl font-bold mt-6 mb-3">App isn't loading your Trip ID</h3>
        <p>Try these steps:</p>
        <ol className="list-decimal pl-6 space-y-2 my-4">
          <li>Log out and log back in</li>
          <li>Check your internet connection</li>
          <li>Make sure you're using the latest version of the app</li>
          <li>Clear the app cache (Settings &gt; Apps &gt; BeLoved Rides &gt; Clear Cache)</li>
        </ol>
        
        <h3 className="text-xl font-bold mt-6 mb-3">Issues with Medicaid ID verification</h3>
        <p>
          Ensure your Medicaid ID is entered correctly, including any hyphens or special characters. If problems persist, contact our support team with a copy of your Medicaid card for manual verification.
        </p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">For Drivers</h2>
        <p>
          If you need to report a no-show, require trip verification, or have other driver-specific issues, please contact our driver support line at +1 (812) 913-9571 or use the driver portal to submit reports.
        </p>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/driver-dashboard">Go to Driver Portal</Link>
          </Button>
        </div>
      </div>
    </main>
  )
} 