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

export function UserNav() {
  const { user, profile, logout, role } = useAuth()

  if (!user) return null

  const getMenuItems = () => {
    switch (role) {
      case 'super_admin':
        return (
          <>
            <Link href="/super-admin-dashboard" passHref legacyBehavior>
              <DropdownMenuItem>
                Super Admin Dashboard
              </DropdownMenuItem>
            </Link>
            <Link href="/profile" passHref legacyBehavior>
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
            </Link>
          </>
        )
      case 'admin':
        return (
          <>
            <Link href="/admin-dashboard" passHref legacyBehavior>
              <DropdownMenuItem>
                Admin Dashboard
              </DropdownMenuItem>
            </Link>
            <Link href="/profile" passHref legacyBehavior>
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
            </Link>
          </>
        )
      case 'driver':
        return (
          <>
            <Link href="/driver-dashboard" passHref legacyBehavior>
              <DropdownMenuItem>
                Driver Dashboard
              </DropdownMenuItem>
            </Link>
            <Link href="/profile" passHref legacyBehavior>
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
            </Link>
          </>
        )
      case 'member':
        return (
          <>
            <Link href="/schedule-ride" passHref legacyBehavior>
              <DropdownMenuItem>
                Schedule Ride
              </DropdownMenuItem>
            </Link>
            <Link href="/my-rides" passHref legacyBehavior>
              <DropdownMenuItem>
                My Rides
              </DropdownMenuItem>
            </Link>
            <Link href="/profile" passHref legacyBehavior>
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
            </Link>
          </>
        )
      default:
        return (
          <Link href="/profile" passHref legacyBehavior>
            <DropdownMenuItem>
              Profile
            </DropdownMenuItem>
          </Link>
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

