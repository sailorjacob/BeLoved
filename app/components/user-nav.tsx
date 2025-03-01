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
            <a href="/super-admin-dashboard">
              <DropdownMenuItem>
                Super Admin Dashboard
              </DropdownMenuItem>
            </a>
            <a href="/profile">
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
            </a>
          </>
        )
      case 'admin':
        return (
          <>
            <a href="/admin-dashboard">
              <DropdownMenuItem>
                Admin Dashboard
              </DropdownMenuItem>
            </a>
            <a href="/profile">
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
            </a>
          </>
        )
      case 'driver':
        return (
          <>
            <a href="/driver-dashboard">
              <DropdownMenuItem>
                Driver Dashboard
              </DropdownMenuItem>
            </a>
            <a href="/profile">
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
            </a>
          </>
        )
      case 'member':
        return (
          <>
            <a href="/schedule-ride">
              <DropdownMenuItem>
                Schedule Ride
              </DropdownMenuItem>
            </a>
            <a href="/my-rides">
              <DropdownMenuItem>
                My Rides
              </DropdownMenuItem>
            </a>
            <a href="/profile">
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
            </a>
          </>
        )
      default:
        return (
          <a href="/profile">
            <DropdownMenuItem>
              Profile
            </DropdownMenuItem>
          </a>
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

