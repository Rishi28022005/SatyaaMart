"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { ShoppingCart, Star, Plus, Minus, MapPin } from "lucide-react"
import Image from "next/image"

type Product = {
  id: string
  name: string
  price: number
  category: string
  image_url: string | null
  stock: number
  supplier_id: string
  suppliers: {
    business_name: string
    is_verified: boolean
    latitude: number | null
    longitude: number | null
  }
  distance?: number
}

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [radiusFilter, setRadiusFilter] = useState([10])
  const [radiusFilterEnabled, setRadiusFilterEnabled] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)

  const { profile } = useAuth()
  const { cartItems, addToCart, updateQuantity } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchUserLocation()
      fetchProducts()
    }
  }, [profile])

  useEffect(() => {
    filterProducts()
  }, [products, categoryFilter, searchQuery, radiusFilter, radiusFilterEnabled, userLocation])

  const fetchUserLocation = async () => {
    try {
      const { data, error } = await supabase.from("users").select("latitude, longitude").eq("id", profile?.id).single()

      if (error) throw error

      if (data?.latitude && data?.longitude) {
        setUserLocation({ lat: data.latitude, lon: data.longitude })
      }
    } catch (error: any) {
      console.error("Error fetching user location:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          suppliers (
            business_name,
            is_verified,
            latitude,
            longitude
          )
        `)
        .gt("stock", 0)

      if (error) throw error

      // Calculate distances if user location is available
      const productsWithDistance =
        data?.map((product) => {
          if (userLocation && product.suppliers.latitude && product.suppliers.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lon,
              product.suppliers.latitude,
              product.suppliers.longitude,
            )
            return { ...product, distance }
          }
          return product
        }) || []

      setProducts(productsWithDistance)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const filterProducts = () => {
    let filtered = products

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.suppliers.business_name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Radius filter (only apply if enabled and user location is available)
    if (radiusFilterEnabled && userLocation) {
      filtered = filtered.filter((product) => {
        if (product.distance === undefined) return true
        return product.distance <= radiusFilter[0]
      })
    }

    // Sort by distance if available
    filtered.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }
      return 0
    })

    setFilteredProducts(filtered)
  }

  const getCartItemQuantity = (productId: string) => {
    const item = cartItems.find((item) => item.product_id === productId)
    return item ? item.quantity : 0
  }

  const handleAddToCart = async (product: Product) => {
    await addToCart(product.id, 1)
  }

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    await updateQuantity(productId, newQuantity)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search products or suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="vegetables">🥬 Vegetables</SelectItem>
              <SelectItem value="oil">🫒 Oil</SelectItem>
              <SelectItem value="flour">🌾 Flour</SelectItem>
              <SelectItem value="spices">🌶️ Spices</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Radius Filter */}
        {userLocation && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="radius-filter"
                  checked={radiusFilterEnabled}
                  onCheckedChange={setRadiusFilterEnabled}
                />
                <Label htmlFor="radius-filter" className="text-sm font-medium">
                  Filter by distance
                </Label>
              </div>
              <MapPin className="h-4 w-4 text-gray-500" />
            </div>
            
            {radiusFilterEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Search Radius: {radiusFilter[0]} km</span>
                </div>
                <Slider value={radiusFilter} onValueChange={setRadiusFilter} max={50} min={1} step={1} className="w-full" />
              </div>
            )}
          </div>
        )}

        {!userLocation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Set your location in settings to find suppliers near you and filter by distance.
            </p>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const quantity = getCartItemQuantity(product.id)
          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <Image
                  src={product.image_url || "/placeholder.svg?height=200&width=300&query=food ingredient"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.suppliers.is_verified && (
                  <Badge className="absolute top-2 right-2 bg-green-500">✅ Verified</Badge>
                )}
                {product.distance !== undefined && (
                  <Badge className="absolute top-2 left-2 bg-blue-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {product.distance.toFixed(1)} km
                  </Badge>
                )}
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-600">₹{product.price}/kg</span>
                  <Badge variant="outline" className="capitalize">
                    {product.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{product.suppliers.business_name}</span>
                  <span>{product.stock} kg available</span>
                </div>
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-sm">4.5 (23 reviews)</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                {quantity === 0 ? (
                  <Button onClick={() => handleAddToCart(product)} className="w-full" disabled={product.stock === 0}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <Button variant="outline" size="sm" onClick={() => handleUpdateQuantity(product.id, quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="mx-4 font-medium">{quantity} kg</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
