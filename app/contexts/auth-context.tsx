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
        id: 0,
        name: "Dwayne",
        username: "dwayne.driver",
        password: "dwayne123",
        email: "dwayne@beloved.com",
        userType: "driver" as const,
      },
      {
        id: 1,
        name: "Gino",
        username: "gino.driver",
        password: "gino123",
        email: "gino@beloved.com",
        userType: "driver" as const,
      },
      {
        id: 2,
        name: "Jacob",
        username: "jacob.driver",
        password: "jacob123",
        email: "jacob@beloved.com",
        userType: "driver" as const,
      },
      {
        id: 3,
        name: "Mike",
        username: "mike.driver",
        password: "mike123",
        email: "mike@beloved.com",
        userType: "driver" as const,
      },
      {
        id: 4,
        name: "Sherry",
        username: "sherry.driver",
        password: "sherry123",
        email: "sherry@beloved.com",
        userType: "driver" as const,
      },
      {
        id: 5,
        name: "Danny",
        username: "danny.driver",
        password: "danny123",
        email: "danny@beloved.com",
        userType: "driver" as const,
      },
    ]

    const foundDriver = driverAccounts.find(
      (d) => d.username === username && d.password === password
    )
    if (foundDriver) {
      const { password: _, ...driverWithoutPassword } = foundDriver
      setUser(driverWithoutPassword)
      localStorage.setItem("currentUser", JSON.stringify(driverWithoutPassword))
      return true
    }

    // Check users in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const foundUser = users.find((u: any) => u.username === username && u.password === password)

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
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

