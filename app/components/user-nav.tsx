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
  const { user, profile, logout, role } = useAuth()
  const router = useRouter()

  if (!user) return null

  const getMenuItems = () => {
    switch (role) {
      case 'super_admin':
        return (
          <>
            <DropdownMenuItem onClick={() => router.replace("/super-admin-dashboard")}>
              Super Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.replace("/profile")}>
              Profile
            </DropdownMenuItem>
          </>
        )
      case 'admin':
        return (
          <>
            <DropdownMenuItem onClick={() => router.replace("/admin-dashboard")}>
              Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.replace("/profile")}>
              Profile
            </DropdownMenuItem>
          </>
        )
      case 'driver':
        return (
          <>
            <DropdownMenuItem onClick={() => router.replace("/driver-dashboard")}>
              Driver Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.replace("/profile")}>
              Profile
            </DropdownMenuItem>
          </>
        )
      case 'member':
        return (
          <>
            <DropdownMenuItem onClick={() => router.replace("/schedule-ride")}>
              Schedule Ride
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.replace("/my-rides")}>
              My Rides
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.replace("/profile")}>
              Profile
            </DropdownMenuItem>
          </>
        )
      default:
        return (
          <DropdownMenuItem onClick={() => router.replace("/profile")}>
            Profile
          </DropdownMenuItem>
        )
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="cursor-pointer">
            <AvatarFallback>{profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{profile?.full_name || user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {getMenuItems()}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

