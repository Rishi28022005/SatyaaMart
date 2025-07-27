"use client"

import { useAuth } from "@/hooks/use-auth"
import { AuthForm } from "@/components/auth/auth-form"
import { VendorDashboard } from "@/components/vendor/vendor-dashboard"
import { SupplierDashboard } from "@/components/supplier/supplier-dashboard"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Navbar } from "@/components/layout/navbar"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthForm />
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case "vendor":
        return <VendorDashboard />
      case "supplier":
        return <SupplierDashboard />
      case "admin":
        return <AdminDashboard />
      default:
        return <div>Invalid role</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{renderDashboard()}</main>
    </div>
  )
}
