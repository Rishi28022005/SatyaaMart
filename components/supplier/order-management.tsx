"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Package, User, Clock } from "lucide-react"

type OrderItem = {
  id: string
  quantity: number
  price: number
  product_name: string
  product_image: string | null
}

type Order = {
  id: string
  vendor_id: string
  vendor_name: string
  vendor_email: string
  total_price: number
  status: "pending" | "accepted" | "out_for_delivery" | "delivered"
  created_at: string
  order_items: OrderItem[]
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchOrders()
    }
  }, [profile])

  const fetchOrders = async () => {
    try {
      console.log("Fetching orders for supplier:", profile?.id)

      // Try the RPC function first
      let data, error

      try {
        const rpcResult = await supabase.rpc("get_supplier_orders", {
          supplier_uuid: profile?.id,
        })
        data = rpcResult.data
        error = rpcResult.error
      } catch (rpcError) {
        console.log("RPC failed, trying view approach:", rpcError)

        // Fallback to using the view
        const viewResult = await supabase
          .from("supplier_order_details")
          .select("*")
          .eq("supplier_id", profile?.id)
          .order("created_at", { ascending: false })

        data = viewResult.data
        error = viewResult.error
      }

      if (error) {
        console.error("Query Error:", error)
        throw error
      }

      console.log("Raw supplier order data:", data)

      if (!data || data.length === 0) {
        setOrders([])
        return
      }

      // Group the flat data by order_id
      const ordersMap = new Map<string, Order>()

      data.forEach((row: any) => {
        const orderId = row.order_id

        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, {
            id: orderId,
            vendor_id: row.vendor_id,
            vendor_name: row.vendor_name,
            vendor_email: row.vendor_email,
            total_price: row.total_price,
            status: row.status,
            created_at: row.created_at,
            order_items: [],
          })
        }

        // Add order item if it exists
        if (row.item_id) {
          const order = ordersMap.get(orderId)!
          order.order_items.push({
            id: row.item_id,
            quantity: row.quantity,
            price: row.price,
            product_name: row.product_name,
            product_image: row.product_image,
          })
        }
      })

      const transformedOrders = Array.from(ordersMap.values())
      console.log("Transformed supplier orders:", transformedOrders)

      setOrders(transformedOrders)
    } catch (error: any) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: `Failed to fetch orders: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Order status updated successfully!",
      })

      fetchOrders()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "accepted":
        return "Accepted"
      case "out_for_delivery":
        return "Out for Delivery"
      case "delivered":
        return "Delivered"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600">
            Orders from vendors will appear here once they start purchasing your products.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order Management</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{order.vendor_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(order.created_at), "PPP")}</span>
                  </div>
                </div>
                <span className="font-semibold text-lg">₹{order.total_price.toFixed(2)}</span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.product_image ? (
                            <img
                              src={item.product_image || "/placeholder.svg"}
                              alt={item.product_name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-2xl">🥬</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} kg × ₹{item.price}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Update Status:</span>
                    <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accept Order</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>Vendor: {order.vendor_email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
