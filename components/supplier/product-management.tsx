"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Package, Upload, Loader2 } from "lucide-react"
import Image from "next/image"

type Product = {
  id: string
  name: string
  price: number
  category: "vegetables" | "oil" | "flour" | "spices"
  image_url: string | null
  stock: number
  supplier_id: string
  created_at: string
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "" as "vegetables" | "oil" | "flour" | "spices" | "",
    stock: "",
    image_url: "",
  })

  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchProducts()
    }
  }, [profile])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("supplier_id", profile?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
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

  const uploadProductImage = async (file: File): Promise<string | null> => {
    if (!profile) return null

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}/products/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("images").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(fileName)

      return publicUrl
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: `Failed to upload image: ${error.message}`,
        variant: "destructive",
      })
      return null
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const imageUrl = await uploadProductImage(file)
    if (imageUrl) {
      setFormData({ ...formData, image_url: imageUrl })
      toast({
        title: "Success",
        description: "Product image uploaded successfully!",
      })
    }
    setUploadingImage(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const productData = {
        name: formData.name,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        stock: Number.parseInt(formData.stock),
        image_url: formData.image_url || null,
        supplier_id: profile.id,
      }

      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id)

        if (error) throw error
        toast({ title: "Success", description: "Product updated successfully!" })
      } else {
        const { error } = await supabase.from("products").insert(productData)

        if (error) throw error
        toast({ title: "Success", description: "Product added successfully!" })
      }

      setIsDialogOpen(false)
      setEditingProduct(null)
      setFormData({ name: "", price: "", category: "", stock: "", image_url: "" })
      fetchProducts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      image_url: product.image_url || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error
      toast({ title: "Success", description: "Product deleted successfully!" })
      fetchProducts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "vegetables":
        return "🥬"
      case "oil":
        return "🫒"
      case "flour":
        return "🌾"
      case "spices":
        return "🌶️"
      default:
        return "📦"
    }
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingProduct(null)
                setFormData({ name: "", price: "", category: "", stock: "", image_url: "" })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update your product details" : "Add a new product to your inventory"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹/kg)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock (kg)</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "vegetables" | "oil" | "flour" | "spices") =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetables">🥬 Vegetables</SelectItem>
                    <SelectItem value="oil">🫒 Oil</SelectItem>
                    <SelectItem value="flour">🌾 Flour</SelectItem>
                    <SelectItem value="spices">🌶️ Spices</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_image">Product Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    {formData.image_url ? (
                      <div className="space-y-2">
                        <div className="w-20 h-20 mx-auto relative">
                          <Image
                            src={formData.image_url || "/placeholder.svg"}
                            alt="Product preview"
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <p className="text-sm text-green-600">Image uploaded successfully!</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="product_image" className="cursor-pointer">
                            <span className="text-sm font-medium text-gray-900">Upload Product Image</span>
                            <input
                              id="product_image"
                              type="file"
                              className="sr-only"
                              accept=".jpg,.jpeg,.png"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>
                          {uploadingImage && (
                            <div className="mt-2 flex items-center justify-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-gray-600">Uploading...</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadingImage}>
                  {editingProduct ? "Update Product" : "Add Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first product to your inventory.</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={product.image_url || "/placeholder.svg?height=200&width=300&query=food ingredient"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <Badge className="absolute top-2 right-2 capitalize">
                  {getCategoryEmoji(product.category)} {product.category}
                </Badge>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-600">₹{product.price}/kg</span>
                  <span className="text-sm text-gray-600">{product.stock} kg in stock</span>
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
