"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

type CartItem = {
  id: string
  product_id: string
  quantity: number
  products: {
    id: string
    name: string
    price: number
    image_url: string | null
    stock: number
    supplier_id: string
    suppliers: {
      business_name: string
      is_verified: boolean
    }
  }
}

type CartContextType = {
  cartItems: CartItem[]
  loading: boolean
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotalPrice: () => number
  getTotalItems: () => number
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile?.role === "vendor") {
      fetchCart()
    } else {
      setLoading(false)
    }
  }, [profile])

  const fetchCart = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from("cart")
        .select(`
          *,
          products (
            id,
            name,
            price,
            image_url,
            stock,
            supplier_id,
            suppliers (
              business_name,
              is_verified
            )
          )
        `)
        .eq("vendor_id", profile.id)

      if (error) throw error
      setCartItems(data || [])
    } catch (error: any) {
      console.error("Error fetching cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: string, quantity = 1) => {
    if (!profile) return

    try {
      const { error } = await supabase.from("cart").upsert({
        vendor_id: profile.id,
        product_id: productId,
        quantity,
      })

      if (error) throw error

      await fetchCart()
      toast({
        title: "Added to cart",
        description: "Item added to cart successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!profile) return

    try {
      if (quantity === 0) {
        await removeFromCart(productId)
        return
      }

      const { error } = await supabase
        .from("cart")
        .update({ quantity })
        .eq("vendor_id", profile.id)
        .eq("product_id", productId)

      if (error) throw error
      await fetchCart()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const removeFromCart = async (productId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase.from("cart").delete().eq("vendor_id", profile.id).eq("product_id", productId)

      if (error) throw error
      await fetchCart()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const clearCart = async () => {
    if (!profile) return

    try {
      const { error } = await supabase.from("cart").delete().eq("vendor_id", profile.id)

      if (error) throw error
      setCartItems([])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.products.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const refreshCart = fetchCart

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getTotalPrice,
        getTotalItems,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
