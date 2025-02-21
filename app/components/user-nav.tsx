"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useAuth } from "@/app/contexts/auth-context"
import { useRouter } from "next/navigation"

export function UserNav() {
  const { user, profile, logout, isDriver } = useAuth()
  const router = useRouter()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarFallback>{profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isDriver ? (
          // Driver navigation options
          <DropdownMenuItem onClick={() => router.push("/driver-dashboard")}>
            Dashboard
          </DropdownMenuItem>
        ) : (
          // Member navigation options
          <>
            <DropdownMenuItem onClick={() => router.push("/schedule-ride")}>
              Schedule Ride
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/my-rides")}>
              My Rides
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

