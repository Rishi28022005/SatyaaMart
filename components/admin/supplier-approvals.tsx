"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Eye, Check, X, FileText, Building, MapPin, Phone, Mail, Calendar } from "lucide-react"

type PendingSupplier = {
  id: string
  business_name: string
  address: string
  phone: string
  fssai_number: string
  fssai_doc_url: string | null
  logo_url: string | null
  is_verified: boolean
  created_at: string
  users: {
    name: string
    email: string
  }
}

export function SupplierApprovals() {
  const [suppliers, setSuppliers] = useState<PendingSupplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSupplier, setSelectedSupplier] = useState<PendingSupplier | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingSuppliers()
  }, [])

  const fetchPendingSuppliers = async () => {
    try {
      const isHardcodedAdmin = localStorage.getItem("hardcoded_admin")

      if (isHardcodedAdmin) {
        // Use admin RPC function for hardcoded admin
        const { data, error } = await supabase.rpc("get_pending_suppliers_admin")

        if (error) throw error

        // Transform the data to match the expected format
        const transformedData =
          data?.map((row: any) => ({
            id: row.id,
            business_name: row.business_name,
            address: row.address,
            phone: row.phone,
            fssai_number: row.fssai_number,
            fssai_doc_url: row.fssai_doc_url,
            logo_url: row.logo_url,
            is_verified: row.is_verified,
            created_at: row.created_at,
            users: {
              name: row.user_name,
              email: row.user_email,
            },
          })) || []

        setSuppliers(transformedData)
      } else {
        // Regular database query for normal admin users
        const { data, error } = await supabase
          .from("suppliers")
          .select(`
            *,
            users (
              name,
              email
            )
          `)
          .eq("is_verified", false)
          .order("created_at", { ascending: false })

        if (error) throw error
        setSuppliers(data || [])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch pending suppliers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (supplierId: string, approved: boolean) => {
    setProcessingId(supplierId)
    try {
      const isHardcodedAdmin = localStorage.getItem("hardcoded_admin")

      if (isHardcodedAdmin) {
        // Use admin RPC function for hardcoded admin
        const { data, error } = await supabase.rpc("update_supplier_verification_admin", {
          supplier_id: supplierId,
          is_verified: approved,
        })

        if (error) throw error

        if (!data.success) {
          throw new Error(data.message)
        }
      } else {
        // Regular update for normal admin users
        const { error } = await supabase.from("suppliers").update({ is_verified: approved }).eq("id", supplierId)
        if (error) throw error
      }

      toast({
        title: "Success",
        description: `Supplier ${approved ? "approved" : "rejected"} successfully!`,
        variant: approved ? "default" : "destructive",
      })

      // Remove from pending list
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (suppliers.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
          <p className="text-gray-600">All supplier applications have been processed.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplier Approvals</h2>
          <p className="text-gray-600 mt-1">Review and approve supplier applications</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {suppliers.length} pending
        </Badge>
      </div>

      <div className="grid gap-6">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Building className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">{supplier.business_name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Applied on {format(new Date(supplier.created_at), "PPP")}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Pending Review
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                    <Mail className="h-3 w-3" />
                    Contact Person
                  </div>
                  <p className="font-medium text-gray-900">{supplier.users.name}</p>
                  <p className="text-sm text-gray-600">{supplier.users.email}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                    <Phone className="h-3 w-3" />
                    Phone Number
                  </div>
                  <p className="text-gray-900">{supplier.phone}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">FSSAI License</p>
                  <p className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
                    {supplier.fssai_number}
                  </p>
                </div>

                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                    <MapPin className="h-3 w-3" />
                    Business Address
                  </div>
                  <p className="text-sm text-gray-900">{supplier.address}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {supplier.fssai_doc_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(supplier.fssai_doc_url!, "_blank")}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        FSSAI License
                      </Button>
                    )}
                    {supplier.logo_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(supplier.logo_url!, "_blank")}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Business Logo
                      </Button>
                    )}
                    {!supplier.fssai_doc_url && !supplier.logo_url && (
                      <span className="text-xs text-gray-500">No documents uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedSupplier(supplier)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-orange-600" />
                        Supplier Application Review
                      </DialogTitle>
                      <DialogDescription>
                        Review all details before approving or rejecting this supplier application.
                      </DialogDescription>
                    </DialogHeader>

                    {selectedSupplier && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Business Name</Label>
                            <p className="text-base font-medium text-gray-900">{selectedSupplier.business_name}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Contact Person</Label>
                            <p className="text-base text-gray-900">{selectedSupplier.users.name}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Email Address</Label>
                            <p className="text-base text-gray-900">{selectedSupplier.users.email}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                            <p className="text-base text-gray-900">{selectedSupplier.phone}</p>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Business Address</Label>
                            <p className="text-base text-gray-900">{selectedSupplier.address}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">FSSAI License Number</Label>
                            <p className="text-base font-mono bg-gray-50 px-3 py-2 rounded text-gray-900">
                              {selectedSupplier.fssai_number}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Application Date</Label>
                            <p className="text-base text-gray-900">
                              {format(new Date(selectedSupplier.created_at), "PPP")}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-500">Uploaded Documents</Label>
                          <div className="flex flex-wrap gap-3">
                            {selectedSupplier.fssai_doc_url && (
                              <Button
                                variant="outline"
                                onClick={() => window.open(selectedSupplier.fssai_doc_url!, "_blank")}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View FSSAI License
                              </Button>
                            )}
                            {selectedSupplier.logo_url && (
                              <Button
                                variant="outline"
                                onClick={() => window.open(selectedSupplier.logo_url!, "_blank")}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Business Logo
                              </Button>
                            )}
                            {!selectedSupplier.fssai_doc_url && !selectedSupplier.logo_url && (
                              <p className="text-gray-500 italic">No documents uploaded</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                          <Button
                            variant="outline"
                            onClick={() => handleApproval(selectedSupplier.id, false)}
                            disabled={processingId === selectedSupplier.id}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject Application
                          </Button>
                          <Button
                            onClick={() => handleApproval(selectedSupplier.id, true)}
                            disabled={processingId === selectedSupplier.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve Supplier
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  onClick={() => handleApproval(supplier.id, false)}
                  disabled={processingId === supplier.id}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproval(supplier.id, true)}
                  disabled={processingId === supplier.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
