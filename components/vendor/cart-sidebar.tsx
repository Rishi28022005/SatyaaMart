"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { ShoppingCart, Plus, Minus, Trash2, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export function CartSidebar() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems, refreshCart } = useCart()
  const { profile } = useAuth()
  const { toast } = useToast()
  const [placing, setPlacing] = useState(false)

  const placeOrder = async () => {
    if (!profile || cartItems.length === 0) return

    setPlacing(true)

    try {
      // Prepare cart items data for the RPC function
      const cartItemsData = cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products.price,
      }))

      console.log("Placing order with items:", cartItemsData)

      // Use the RPC function to place the order
      const { data, error } = await supabase.rpc("place_order", {
        vendor_id: profile.id,
        cart_items: cartItemsData,
      })

      if (error) {
        console.error("RPC Error:", error)
        throw error
      }

      if (!data.success) {
        throw new Error(data.message)
      }

      console.log("Order placed successfully:", data)

      // Refresh cart to show it's empty
      await refreshCart()

      toast({
        title: "Order Placed!",
        description: `Order #${data.order_id.slice(0, 8)} has been placed successfully.`,
      })
    } catch (error: any) {
      console.error("Order placement error:", error)
      toast({
        title: "Error",
        description: `Failed to place order: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setPlacing(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Cart</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Your cart is empty</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Cart</span>
          </div>
          <Badge variant="secondary">{getTotalItems()} items</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="w-12 h-12 relative">
                <Image
                  src={item.products.image_url || "/placeholder.svg?height=48&width=48&query=food"}
                  alt={item.products.name}
                  fill
                  className="object-cover rounded"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.products.name}</p>
                <p className="text-xs text-gray-600">{item.products.suppliers.business_name}</p>
                <p className="text-sm font-semibold text-orange-600">₹{item.products.price}/kg</p>
              </div>

              <div className="flex flex-col items-end space-y-1">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    disabled={item.quantity >= item.products.stock}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCart(item.product_id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between items-center font-semibold">
            <span>Total:</span>
            <span className="text-lg text-orange-600">₹{getTotalPrice().toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Button onClick={placeOrder} className="w-full" disabled={placing}>
              {placing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place Order
            </Button>
            <Button variant="outline" onClick={clearCart} className="w-full bg-transparent">
              Clear Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
