"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useAuth, NavigationManager } from "@/app/contexts/auth-context"
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/auth-service'

function getMenuItems(role: UserRole | null) {
  switch (role) {
    case 'super_admin':
      return [
        {
          label: "Super Admin Dashboard",
          href: "/super-admin-dashboard",
        },
        {
          label: "My Profile",
          href: "/profile",
        }
      ]
    case 'admin':
      return [
        {
          label: "Admin Dashboard",
          href: "/admin-dashboard",
        },
        {
          label: "Profile",
          href: "/profile",
        }
      ]
    case 'driver':
      return [
        {
          label: "Driver Dashboard",
          href: "/driver-dashboard",
        },
        {
          label: "My Trips",
          href: "/trips",
        },
        {
          label: "Profile",
          href: "/profile",
        }
      ]
    case 'member':
      return [
        {
          label: "Schedule Ride",
          href: "/schedule-ride",
        },
        {
          label: "My Rides",
          href: "/my-rides",
        },
        {
          label: "Profile",
          href: "/profile",
        }
      ]
    default:
      return []
  }
}

export function UserNav() {
  const { user, profile, role, logout } = useAuth()
  const router = useRouter()

  const menuItems = getMenuItems(role)

  const handleLogout = async () => {
    console.log('[UserNav] Logging out')
    try {
      await logout()
      console.log('[UserNav] Logout successful, redirecting to home')
      
      // Clear any session storage flags
      sessionStorage.clear();
      
      // EMERGENCY DIRECT NAVIGATION: Completely bypass Next.js routing
      console.log('[UserNav] EMERGENCY DIRECT NAVIGATION to home');
      window.location.href = window.location.origin + '/';
    } catch (error) {
      console.error('[UserNav] Error during logout:', error)
      
      // Clear any session storage flags
      sessionStorage.clear();
      
      // EMERGENCY DIRECT NAVIGATION: Completely bypass Next.js routing
      console.log('[UserNav] EMERGENCY DIRECT NAVIGATION to home');
      window.location.href = window.location.origin + '/';
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt={profile?.full_name || user?.email || ""} />
            <AvatarFallback>{profile?.full_name?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems.map((item) => (
            <DropdownMenuItem 
              key={item.href}
              className="cursor-pointer"
              onClick={() => {
                // EMERGENCY DIRECT NAVIGATION: Completely bypass Next.js routing
                console.log(`[UserNav] EMERGENCY DIRECT NAVIGATION to ${item.href}`);
                window.location.href = window.location.origin + item.href;
              }}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleLogout}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

