"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shield } from "lucide-react"

export function AuthForm() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    role: "" as "vendor" | "supplier" | "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check for hardcoded admin credentials
      if (loginData.email === "rishimpatel28@gmail.com" && loginData.password === "Rishi@2005") {
        // Create a mock admin session without database interaction
        const mockAdminUser = {
          id: "admin-hardcoded-id",
          email: "rishimpatel28@gmail.com",
          user_metadata: {
            name: "Super Admin",
            role: "admin",
          },
        }

        // Set the admin profile directly in localStorage for persistence
        localStorage.setItem(
          "hardcoded_admin",
          JSON.stringify({
            id: "admin-hardcoded-id",
            email: "rishimpatel28@gmail.com",
            name: "Super Admin",
            role: "admin",
          }),
        )

        // Trigger a page reload to activate the admin session
        window.location.reload()

        toast({
          title: "Success",
          description: "Admin logged in successfully!",
        })
        return
      }

      // Regular Supabase authentication for other users
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Logged in successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createUserProfile = async (userId: string, email: string, name: string, role: string) => {
    try {
      // Method 1: Try RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_user_profile", {
        user_id: userId,
        user_email: email,
        user_name: name,
        user_role: role,
      })

      if (!rpcError) {
        console.log("Profile created via RPC:", rpcData)
        return true
      }

      console.log("RPC failed, trying direct insert:", rpcError)

      // Method 2: Try direct insert with service role
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        email: email,
        name: name,
        role: role,
      })

      if (!insertError) {
        console.log("Profile created via direct insert")
        return true
      }

      console.log("Direct insert failed:", insertError)
      return false
    } catch (error) {
      console.error("Profile creation error:", error)
      return false
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.name,
            role: signupData.role,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Wait a moment for the trigger to potentially work
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (checkError && checkError.code === "PGRST116") {
          // Profile doesn't exist, create it manually
          console.log("Profile not found, creating manually...")
          const success = await createUserProfile(data.user.id, data.user.email!, signupData.name, signupData.role)

          if (!success) {
            console.warn("Manual profile creation failed, but user auth succeeded")
          }
        } else if (existingProfile) {
          console.log("Profile already exists:", existingProfile)
        }
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email to verify your account.",
      })

      // Reset form
      setSignupData({
        name: "",
        email: "",
        password: "",
        role: "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-600">StreetSupply</CardTitle>
          <CardDescription>Connecting street food vendors with trusted suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </form>

              {/* Admin Login Info */}
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Admin Access</span>
                </div>
                <p className="text-xs text-blue-700">Super Admin: rishimpatel28@gmail.com</p>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={signupData.role}
                    onValueChange={(value: "vendor" | "supplier") => setSignupData({ ...signupData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">🧑‍🍳 Vendor (Buy raw materials)</SelectItem>
                      <SelectItem value="supplier">🚚 Supplier (Sell raw materials)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !signupData.role}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Admin accounts are managed separately. Contact support for admin access.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
