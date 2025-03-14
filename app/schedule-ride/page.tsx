"use client"

import { Scheduler } from "../components/scheduler"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UserNav } from "@/app/components/user-nav"
import { useEffect, useState } from "react"

export default function ScheduleRidePage() {
  const router = useRouter()
  const [referrer, setReferrer] = useState<string>("/dashboard")

  useEffect(() => {
    // Check if the referrer is from the member-dashboard/rides page
    if (typeof window !== 'undefined') {
      const previousPath = document.referrer
      if (previousPath.includes("/member-dashboard/rides")) {
        setReferrer("/member-dashboard/rides")
      }
    }
  }, [])

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2"
            onClick={() => router.push(referrer)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {referrer === "/member-dashboard/rides" ? "My Rides" : "Dashboard"}
          </Button>
          <h1 className="text-3xl font-bold">Schedule a Ride</h1>
        </div>
        <UserNav />
      </div>
      <Scheduler isAdmin={false} />
    </main>
  )
} 