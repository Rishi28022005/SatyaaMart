"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { Package, ShoppingBag, Star, IndianRupee } from "lucide-react"

type Stats = {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  averageRating: number
  pendingOrders: number
  deliveredOrders: number
}

export function SupplierStats() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile) {
      fetchStats()
    }
  }, [profile])

  const fetchStats = async () => {
    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", profile?.id)

      // Fetch orders data
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          id,
          total_price,
          status,
          order_items!inner (
            product_id,
            products!inner (
              supplier_id
            )
          )
        `)
        .eq("order_items.products.supplier_id", profile?.id)

      // Fetch reviews
      const { data: reviewsData } = await supabase.from("reviews").select("rating").eq("supplier_id", profile?.id)

      // Calculate stats
      const totalOrders = ordersData?.length || 0
      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total_price, 0) || 0
      const pendingOrders = ordersData?.filter((order) => order.status === "pending").length || 0
      const deliveredOrders = ordersData?.filter((order) => order.status === "delivered").length || 0
      const averageRating = reviewsData?.length
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
        : 0

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
        averageRating,
        pendingOrders,
        deliveredOrders,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
          <p className="text-xs text-muted-foreground">Active products in inventory</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingOrders} pending, {stats.deliveredOrders} delivered
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Total earnings from orders</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Based on customer reviews</p>
        </CardContent>
      </Card>
    </div>
  )
}
