"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

type UserProfile = {
  id: string
  email: string
  name: string
  role: "vendor" | "supplier" | "admin"
}

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for hardcoded admin first
    const hardcodedAdmin = localStorage.getItem("hardcoded_admin")
    if (hardcodedAdmin) {
      try {
        const adminProfile = JSON.parse(hardcodedAdmin)
        setProfile(adminProfile)
        setUser({
          id: adminProfile.id,
          email: adminProfile.email,
          user_metadata: { name: adminProfile.name, role: adminProfile.role },
        } as User)
        setLoading(false)
        return
      } catch (error) {
        localStorage.removeItem("hardcoded_admin")
      }
    }

    // Get initial session for regular users
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes for regular users
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't override hardcoded admin session
      if (localStorage.getItem("hardcoded_admin")) {
        return
      }

      setUser(session?.user ?? null)
      if (session?.user) {
        // Add delay for new signups to allow trigger/manual creation
        if (event === "SIGNED_UP") {
          setTimeout(() => fetchProfile(session.user.id), 2000)
        } else {
          fetchProfile(session.user.id)
        }
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error && error.code === "PGRST116" && retryCount < 5) {
        // Profile not found, wait and retry
        console.log(`Profile not found, retrying... (${retryCount + 1}/5)`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return fetchProfile(userId, retryCount + 1)
      } else if (error && error.code === "PGRST116") {
        // After all retries failed, try to create profile manually
        console.log("All retries failed, attempting manual profile creation...")

        const { data: user } = await supabase.auth.getUser()
        if (user.user) {
          const { data: rpcData, error: rpcError } = await supabase.rpc("create_user_profile", {
            user_id: user.user.id,
            user_email: user.user.email!,
            user_name: user.user.user_metadata?.name || user.user.email!.split("@")[0],
            user_role: user.user.user_metadata?.role || "vendor",
          })

          if (!rpcError) {
            // Try fetching again
            const { data: newProfile, error: fetchError } = await supabase
              .from("users")
              .select("*")
              .eq("id", userId)
              .single()

            if (!fetchError) {
              setProfile(newProfile)
              setLoading(false)
              return
            }
          }
        }

        console.error("Failed to create user profile after all attempts")
      } else if (error) {
        throw error
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    // Check if it's hardcoded admin
    if (localStorage.getItem("hardcoded_admin")) {
      localStorage.removeItem("hardcoded_admin")
      setUser(null)
      setProfile(null)
      setLoading(false)
      // Force a page reload to ensure clean state
      window.location.href = "/"
      return
    }

    // Regular Supabase sign out
    await supabase.auth.signOut()
  }

  return <AuthContext.Provider value={{ user, profile, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
