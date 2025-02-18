"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type UserType = "user" | "driver" | "admin"

interface User {
  id: number
  name: string
  username: string
  email: string
  userType: UserType
}

type AuthContextType = {
  user: User | null
  isLoggedIn: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isDriver: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Check for admin login
    if (username === "admin" && password === "admin") {
      const adminUser: User = {
        id: 0,
        name: "Admin",
        username: "admin",
        email: "admin@example.com",
        userType: "admin",
      }
      setUser(adminUser)
      localStorage.setItem("currentUser", JSON.stringify(adminUser))
      return true
    }

    // Check for driver logins
    const driverAccounts = [
      {
        id: 1,
        name: "Dwayne Johnson",
        username: "dwayne_driver",
        password: "dwayne123",
        email: "dwayne@example.com",
        userType: "driver" as const,
      },
      {
        id: 2,
        name: "Gino Rossi",
        username: "gino_driver",
        password: "gino123",
        email: "gino@example.com",
        userType: "driver" as const,
      },
      {
        id: 3,
        name: "Jacob Smith",
        username: "jacob_driver",
        password: "jacob123",
        email: "jacob@example.com",
        userType: "driver" as const,
      },
      {
        id: 4,
        name: "Mike Brown",
        username: "mike_driver",
        password: "mike123",
        email: "mike@example.com",
        userType: "driver" as const,
      },
      {
        id: 5,
        name: "Sherry Williams",
        username: "sherry_driver",
        password: "sherry123",
        email: "sherry@example.com",
        userType: "driver" as const,
      },
    ]

    const foundDriver = driverAccounts.find((d) => d.username === username && d.password === password)
    if (foundDriver) {
      const { password, ...driverWithoutPassword } = foundDriver
      setUser(driverWithoutPassword)
      localStorage.setItem("currentUser", JSON.stringify(driverWithoutPassword))
      return true
    }

    // Check users in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const foundUser = users.find((u: any) => u.username === username && u.password === password)

    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, isDriver: user?.userType === "driver" }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

