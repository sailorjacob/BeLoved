"use client"

import { MemberList } from "../components/member-list"
import { UserNav } from "../components/user-nav"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'

export default function MemberListPage() {
  const router = useRouter()

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/admin-dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold">Member List</h1>
        </div>
        <UserNav />
      </div>
      <MemberList />
    </main>
  )
}

