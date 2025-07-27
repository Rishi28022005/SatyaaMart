"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { SupplierRegistration } from "./supplier-registration"
import { ProductManagement } from "./product-management"
import { OrderManagement } from "./order-management"
import { SupplierStats } from "./supplier-stats"
import { CheckCircle, Clock, Package, ShoppingBag, BarChart3, MapPin, Loader2 } from "lucide-react"

type SupplierProfile = {
  id: string
  business_name: string
  address: string
  phone: string
  fssai_number: string
  fssai_doc_url: string | null
  logo_url: string | null
  is_verified: boolean
  latitude: number | null
  longitude: number | null
  created_at: string
}

export function SupplierDashboard() {
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const [locationData, setLocationData] = useState({
    latitude: "",
    longitude: "",
  })
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchSupplierProfile()
    }
  }, [profile])

  const fetchSupplierProfile = async () => {
    try {
      const { data, error } = await supabase.from("suppliers").select("*").eq("id", profile?.id).single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setSupplierProfile(data)
      if (data) {
        setLocationData({
          latitude: data.latitude?.toString() || "",
          longitude: data.longitude?.toString() || "",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch supplier profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateLocation = async () => {
    if (!supplierProfile) return

    setUpdatingLocation(true)

    try {
      const { error } = await supabase
        .from("suppliers")
        .update({
          latitude: Number.parseFloat(locationData.latitude),
          longitude: Number.parseFloat(locationData.longitude),
        })
        .eq("id", supplierProfile.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Location updated successfully!",
      })

      fetchSupplierProfile()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdatingLocation(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationData({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        })
        toast({
          title: "Location detected",
          description: "Your current location has been detected",
        })
      },
      (error) => {
        toast({
          title: "Error",
          description: "Unable to get your location. Please enter manually.",
          variant: "destructive",
        })
      },
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  // If supplier hasn't registered yet
  if (!supplierProfile) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600 mt-2">Complete your registration to start selling</p>
        </div>
        <SupplierRegistration />
      </div>
    )
  }

  // If supplier is not verified yet
  if (!supplierProfile.is_verified) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600 mt-2">Your registration is under review</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <CardTitle>Registration Under Review</CardTitle>
            <CardDescription>
              Thank you for registering with StreetSupply! Your application is currently being reviewed by our admin
              team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Your Registration Details:</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Business Name:</strong> {supplierProfile.business_name}
                </p>
                <p>
                  <strong>Phone:</strong> {supplierProfile.phone}
                </p>
                <p>
                  <strong>FSSAI Number:</strong> {supplierProfile.fssai_number}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge variant="outline" className="ml-2">
                    Pending Approval
                  </Badge>
                </p>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              <p>You will be notified via email once your registration is approved.</p>
              <p>This process typically takes 1-2 business days.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verified supplier dashboard
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>
        <p className="text-gray-600 mt-2">Welcome back, {supplierProfile.business_name}!</p>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stats" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Stats</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Orders</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Location</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <SupplierStats />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="location" className="mt-6">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Business Location</span>
              </CardTitle>
              <CardDescription>Set your business location to help vendors find you based on distance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={locationData.latitude}
                    onChange={(e) => setLocationData({ ...locationData, latitude: e.target.value })}
                    placeholder="0.000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={locationData.longitude}
                    onChange={(e) => setLocationData({ ...locationData, longitude: e.target.value })}
                    placeholder="0.000000"
                  />
                </div>
              </div>

              <Button type="button" variant="outline" onClick={getCurrentLocation} className="w-full bg-transparent">
                <MapPin className="mr-2 h-4 w-4" />
                Get Current Location
              </Button>

              <Button onClick={updateLocation} disabled={updatingLocation} className="w-full">
                {updatingLocation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Location
              </Button>

              {supplierProfile.latitude && supplierProfile.longitude && (
                <div className="text-sm text-green-600 text-center">
                  ✅ Location set: {supplierProfile.latitude.toFixed(6)}, {supplierProfile.longitude.toFixed(6)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Business Name</Label>
                  <p className="mt-1">{supplierProfile.business_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="mt-1">{supplierProfile.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                  <p className="mt-1">{supplierProfile.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">FSSAI Number</Label>
                  <p className="mt-1">{supplierProfile.fssai_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className="mt-1 bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified Supplier
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
