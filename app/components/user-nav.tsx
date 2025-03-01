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
import { useAuth } from "@/app/contexts/auth-context"

export function UserNav() {
  const { user, profile, logout, role } = useAuth()

  if (!user) return null

  const getMenuItems = () => {
    switch (role) {
      case 'super_admin':
        return (
          <>
            <DropdownMenuItem onClick={() => window.location.href = '/super-admin-dashboard'}>
              Super Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              Profile
            </DropdownMenuItem>
          </>
        )
      case 'admin':
        return (
          <>
            <DropdownMenuItem onClick={() => window.location.href = '/admin-dashboard'}>
              Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              Profile
            </DropdownMenuItem>
          </>
        )
      case 'driver':
        return (
          <>
            <DropdownMenuItem onClick={() => window.location.href = '/driver-dashboard'}>
              Driver Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              Profile
            </DropdownMenuItem>
          </>
        )
      case 'member':
        return (
          <>
            <DropdownMenuItem onClick={() => window.location.href = '/schedule-ride'}>
              Schedule Ride
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/my-rides'}>
              My Rides
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              Profile
            </DropdownMenuItem>
          </>
        )
      default:
        return (
          <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
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

