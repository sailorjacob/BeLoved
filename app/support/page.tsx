'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Support</h1>
        <p className="text-gray-600">We're here to help with your transportation needs.</p>
      </div>
      
      <div className="grid gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>Multiple ways to reach our support team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Email</h3>
              <p>support@belovedtransportation.com</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Phone</h3>
              <p>1-800-555-1234 (Available Monday-Friday, 8am-6pm)</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">How do I schedule a recurring ride for appointments?</h3>
            <p className="text-gray-600">
              When scheduling a ride, select the "Recurring" option and choose your preferred frequency (daily, weekly, or monthly). Our system will automatically generate future rides based on your selection.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">What should I do if I miss my pickup time?</h3>
            <p className="text-gray-600">
              If you've missed your scheduled pickup, please call our support line at 1-800-555-1234 immediately. Our team will help reschedule your ride or coordinate with the driver if they're still in the area.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">How can I modify a trip or cancel a recurring schedule?</h3>
            <p className="text-gray-600">
              To modify a single trip, locate the ride in your "My Rides" section and select "Edit." For recurring schedules, you can manage your recurring rides in the "Recurring Rides" tab of your dashboard.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">What is my Trip ID, and how do I use it?</h3>
            <p className="text-gray-600">
              Your Trip ID is a unique identifier assigned to each ride (e.g., T123456). You can find your Trip ID in your ride details. When contacting support about a specific ride, please provide this ID for faster assistance.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">App isn't loading your Trip ID</h3>
            <p className="text-gray-600">
              Try these steps:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-600">
              <li>Log out and log back in</li>
              <li>Check your internet connection</li>
              <li>Make sure you're using the latest version of the app</li>
              <li>Clear the app cache (Settings &gt; Apps &gt; BeLoved Rides &gt; Clear Cache)</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Issues with Medicaid ID verification</h3>
            <p className="text-gray-600">
              Ensure your Medicaid ID is entered correctly, including any hyphens or special characters. If problems persist, contact our support team with a copy of your Medicaid card for manual verification.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">For Drivers</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p>
                If you need to report a no-show, require trip verification, or have other driver-specific issues, please contact our driver support line at 1-800-555-4321 or use the driver portal to submit reports.
              </p>
              <Button variant="outline" asChild>
                <Link href="/driver-dashboard">Go to Driver Portal</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 