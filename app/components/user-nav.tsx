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
import { useRouter } from 'next/navigation'

export function UserNav() {
  const { user, profile, logout, role } = useAuth()
  const router = useRouter()

  if (!user) return null

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const getMenuItems = () => {
    switch (role) {
      case 'super_admin':
        return (
          <>
            <DropdownMenuItem onClick={() => handleNavigation('/super-admin-dashboard')}>
              Super Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
              Profile
            </DropdownMenuItem>
          </>
        )
      case 'admin':
        return (
          <>
            <DropdownMenuItem onClick={() => handleNavigation('/admin-dashboard')}>
              Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
              Profile
            </DropdownMenuItem>
          </>
        )
      case 'driver':
        return (
          <>
            <DropdownMenuItem onClick={() => handleNavigation('/driver-dashboard')}>
              Driver Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
              Profile
            </DropdownMenuItem>
          </>
        )
      case 'member':
        return (
          <>
            <DropdownMenuItem onClick={() => handleNavigation('/schedule-ride')}>
              Schedule Ride
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/my-rides')}>
              My Rides
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
              Profile
            </DropdownMenuItem>
          </>
        )
      default:
        return (
          <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
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

