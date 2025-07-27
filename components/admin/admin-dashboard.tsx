"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SupplierApprovals } from "./supplier-approvals"
import { AdminStats } from "./admin-stats"
import { UserCheck, BarChart3, Shield } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

export function AdminDashboard() {
  const { profile } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshStats = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {profile?.name}</p>
          </div>
        </div>
        <p className="text-gray-600">Manage suppliers and platform oversight</p>
      </div>

      {/* Quick Stats */}
      <AdminStats refreshTrigger={refreshTrigger} />

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suppliers" className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4" />
            <span>Supplier Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-6">
          <SupplierApprovals onActionComplete={refreshStats} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-500">Detailed analytics and reporting features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
