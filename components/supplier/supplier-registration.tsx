"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2, FileText, ImageIcon } from "lucide-react"

export function SupplierRegistration() {
  const [loading, setLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [formData, setFormData] = useState({
    business_name: "",
    address: "",
    phone: "",
    fssai_number: "",
  })
  const [fssaiDoc, setFssaiDoc] = useState<File | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [fssaiDocUrl, setFssaiDocUrl] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const { profile } = useAuth()
  const { toast } = useToast()

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${folder}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName)

      return publicUrl
    } catch (error: any) {
      console.error("File upload failed:", error)
      toast({
        title: "Upload Error",
        description: `Failed to upload file: ${error.message}`,
        variant: "destructive",
      })
      return null
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingDoc(true)
    const url = await uploadFile(file, "documents", profile.id)
    if (url) {
      setFssaiDoc(file)
      setFssaiDocUrl(url)
      toast({
        title: "Success",
        description: "FSSAI document uploaded successfully!",
      })
    }
    setUploadingDoc(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingLogo(true)
    const url = await uploadFile(file, "images", profile.id)
    if (url) {
      setLogo(file)
      setLogoUrl(url)
      toast({
        title: "Success",
        description: "Logo uploaded successfully!",
      })
    }
    setUploadingLogo(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    if (!fssaiDocUrl) {
      toast({
        title: "Error",
        description: "Please upload your FSSAI license document.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log("Submitting supplier registration for user:", profile.id)

      // Method 1: Try direct insert first
      const supplierData = {
        id: profile.id,
        business_name: formData.business_name,
        address: formData.address,
        phone: formData.phone,
        fssai_number: formData.fssai_number,
        fssai_doc_url: fssaiDocUrl,
        logo_url: logoUrl,
        is_verified: false,
      }

      const { data, error } = await supabase.from("suppliers").insert(supplierData).select()

      // Method 2: If direct insert fails due to RLS, try RPC function
      if (error) {
        console.log("Direct insert failed, trying RPC function:", error)

        const { data: rpcData, error: rpcError } = await supabase.rpc("register_supplier", {
          supplier_id: profile.id,
          business_name: formData.business_name,
          address: formData.address,
          phone: formData.phone,
          fssai_number: formData.fssai_number,
          fssai_doc_url: fssaiDocUrl,
          logo_url: logoUrl,
        })

        if (rpcError) {
          console.error("RPC function error:", rpcError)
          throw rpcError
        }

        if (!rpcData.success) {
          throw new Error(rpcData.message)
        }

        console.log("Supplier registration successful via RPC:", rpcData)
      } else {
        console.log("Supplier registration successful via direct insert:", data)
      }

      toast({
        title: "Success",
        description: "Registration submitted successfully! Please wait for admin approval.",
      })

      // Reset form
      setFormData({
        business_name: "",
        address: "",
        phone: "",
        fssai_number: "",
      })
      setFssaiDoc(null)
      setLogo(null)
      setFssaiDocUrl(null)
      setLogoUrl(null)

      // Refresh the page to show the pending status
      window.location.reload()
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        title: "Error",
        description: `Registration failed: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Supplier Registration</CardTitle>
          <CardDescription>
            Complete your registration to start selling on StreetSupply. Your application will be reviewed by our admin
            team.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Enter your business name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter your complete business address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fssai_number">FSSAI License Number *</Label>
              <Input
                id="fssai_number"
                value={formData.fssai_number}
                onChange={(e) => setFormData({ ...formData, fssai_number: e.target.value })}
                placeholder="Enter your FSSAI license number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fssai_doc">FSSAI License Document *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  {fssaiDocUrl ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <FileText className="h-8 w-8" />
                      <div>
                        <p className="font-medium">Document uploaded successfully!</p>
                        <p className="text-sm">{fssaiDoc?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="fssai_doc" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Upload FSSAI License (PDF or Image)
                          </span>
                          <input
                            id="fssai_doc"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleDocumentUpload}
                            disabled={uploadingDoc}
                          />
                        </label>
                        {uploadingDoc && (
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

            <div className="space-y-2">
              <Label htmlFor="logo">Business Logo (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  {logoUrl ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <ImageIcon className="h-8 w-8" />
                      <div>
                        <p className="font-medium">Logo uploaded successfully!</p>
                        <p className="text-sm">{logo?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="logo" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">Upload Business Logo</span>
                          <input
                            id="logo"
                            type="file"
                            className="sr-only"
                            accept=".jpg,.jpeg,.png"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                          />
                        </label>
                        {uploadingLogo && (
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

            <Button type="submit" className="w-full" disabled={loading || !fssaiDocUrl}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Registration
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
