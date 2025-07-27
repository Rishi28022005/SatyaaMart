"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductGrid } from "./product-grid"
import { OrderHistory } from "./order-history"
import { LocationSetup } from "./location-setup"
import { ComplaintSection } from "./complaint-section"
import { CartSidebar } from "./cart-sidebar"
import { ShoppingCart, History, MapPin, Settings, MessageSquare } from "lucide-react"

export function VendorDashboard() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="text-gray-600 mt-2">Browse products and manage your orders</p>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="products" className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Browse Products</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>Order History</span>
              </TabsTrigger>
              <TabsTrigger value="complaints" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Complaints</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-6">
              <ProductGrid />
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <OrderHistory />
            </TabsContent>

            <TabsContent value="complaints" className="mt-6">
              <ComplaintSection />
            </TabsContent>

            <TabsContent value="location" className="mt-6">
              <LocationSetup />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="text-center py-12">
                <p className="text-gray-500">Settings panel coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-80">
          <CartSidebar />
        </div>
      </div>
    </div>
  )
}
