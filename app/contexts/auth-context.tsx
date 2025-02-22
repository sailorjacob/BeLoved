"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient, type User } from "@supabase/auth-helpers-nextjs"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import type { Database } from "../lib/supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isDriver: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isDriver: false,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isDriver, setIsDriver] = useState(false)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profile) {
          setProfile(profile)
          setIsDriver(profile.role === "driver")
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setIsDriver(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, isDriver, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

