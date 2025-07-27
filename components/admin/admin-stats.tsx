"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { UserCheck, MessageSquare } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

type AdminStats = {
  pendingApprovals: number
  approvedSuppliers: number
}

export function AdminStats({ refreshTrigger }: { refreshTrigger?: number } = {}) {
  const [stats, setStats] = useState<AdminStats>({
    pendingApprovals: 0,
    approvedSuppliers: 0,
  })
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile) {
      fetchStats()
    }
  }, [profile, refreshTrigger])

  const fetchStats = async () => {
    try {
      const isHardcodedAdmin = localStorage.getItem("hardcoded_admin")

      if (isHardcodedAdmin) {
        // Use admin RPC functions for hardcoded admin
        await Promise.all([
          fetchPendingApprovals(),
          fetchApprovedSuppliers(),
        ])
      } else {
        // Regular queries for normal admin users
        await Promise.all([
          fetchPendingApprovals(),
          fetchApprovedSuppliers(),
        ])
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      const { count, error } = await supabase
        .from("suppliers")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", false)

      if (error) throw error
      setStats(prev => ({ ...prev, pendingApprovals: count || 0 }))
    } catch (error) {
      console.error("Error fetching pending approvals:", error)
    }
  }

  const fetchApprovedSuppliers = async () => {
    try {
      const { count, error } = await supabase
        .from("suppliers")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", true)

      if (error) throw error
      setStats(prev => ({ ...prev, approvedSuppliers: count || 0 }))
    } catch (error) {
      console.error("Error fetching approved suppliers:", error)
    }
  }



  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg w-9 h-9"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Approved Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedSuppliers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 