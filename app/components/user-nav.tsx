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
  const { user, profile, logout, isDriver, isAdmin, isSuperAdmin } = useAuth()
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
        <DropdownMenuLabel>{profile?.full_name || user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isSuperAdmin ? (
            <>
              <DropdownMenuItem onClick={() => router.push("/super-admin-dashboard")}>
                Super Admin Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                Profile
              </DropdownMenuItem>
            </>
          ) : isAdmin ? (
            <>
              <DropdownMenuItem onClick={() => router.push("/admin-dashboard")}>
                Admin Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                Profile
              </DropdownMenuItem>
            </>
          ) : isDriver ? (
            <>
              <DropdownMenuItem onClick={() => router.push("/driver-dashboard")}>
                Driver Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                Profile
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => router.push("/schedule-ride")}>
                Schedule Ride
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/my-rides")}>
                My Rides
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                Profile
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

