"use client"

import Image from "next/image"
import { useAuth } from "./contexts/auth-context"
import { LoginForm } from "./components/login-form"
import { Scheduler } from "./components/scheduler"
import { UserNav } from "./components/user-nav"
import { ClientLayout } from "@/app/components/client-layout"

export default function Home() {
  const { user, profile, isLoading } = useAuth()

  return (
    <ClientLayout>
      <main className="container mx-auto p-4 min-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"
                alt="BeLoved Transportation Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl font-bold">BeLoved Transportation</h1>
          </div>
          <UserNav />
        </div>
        <div className="flex-grow flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : user ? (
            profile?.user_type === "member" ? (
              <Scheduler />
            ) : null
          ) : (
            <div className="flex flex-col items-center">
              <LoginForm />
            </div>
          )}
        </div>
      </main>
    </ClientLayout>
  )
}

