"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { LogOut, User, Shield, Store, Truck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Navbar() {
  const { profile, signOut } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Success",
        description: "Signed out successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = () => {
    switch (profile?.role) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "supplier":
        return <Truck className="h-4 w-4" />
      case "vendor":
        return <Store className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = () => {
    switch (profile?.role) {
      case "admin":
        return "Admin"
      case "supplier":
        return "Supplier"
      case "vendor":
        return "Vendor"
      default:
        return "User"
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-orange-600">StreetSupply</h1>
          {profile && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
              {getRoleIcon()}
              <span className="text-sm font-medium text-gray-700">{getRoleLabel()}</span>
            </div>
          )}
        </div>

        {profile && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-500">{profile.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
