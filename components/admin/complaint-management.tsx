"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { MessageSquare, Eye, CheckCircle, XCircle, Clock } from "lucide-react"

type Complaint = {
  id: string
  message: string
  status: "pending" | "resolved" | "dismissed"
  created_at: string
  vendor: {
    name: string
    email: string
  }
  supplier: {
    business_name: string
    users: {
      name: string
      email: string
    }
  }
}

export function ComplaintManagement() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const isHardcodedAdmin = localStorage.getItem("hardcoded_admin")

      if (isHardcodedAdmin) {
        // Use admin RPC function for hardcoded admin
        const { data, error } = await supabase.rpc("get_all_complaints_admin")

        if (error) throw error

        // Transform the data to match the expected format
        const transformedData =
          data?.map((row: any) => ({
            id: row.id,
            message: row.message,
            status: row.status,
            created_at: row.created_at,
            vendor: {
              name: row.vendor_name,
              email: row.vendor_email,
            },
            supplier: {
              business_name: row.supplier_business_name,
              users: {
                name: row.supplier_user_name,
                email: row.supplier_user_email,
              },
            },
          })) || []

        setComplaints(transformedData)
      } else {
        // Regular query for normal admin users
        const { data, error } = await supabase
          .from("complaints")
          .select(`
            *,
            vendor:vendor_id (
              name,
              email
            ),
            supplier:supplier_id (
              business_name,
              users (
                name,
                email
              )
            )
          `)
          .order("created_at", { ascending: false })

        if (error) throw error
        setComplaints(data || [])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (complaintId: string, status: "resolved" | "dismissed") => {
    try {
      const isHardcodedAdmin = localStorage.getItem("hardcoded_admin")

      if (isHardcodedAdmin) {
        // Use admin RPC function for hardcoded admin
        const { data, error } = await supabase.rpc("update_complaint_status_admin", {
          complaint_id: complaintId,
          new_status: status,
          admin_notes: adminNotes,
        })

        if (error) throw error

        if (!data.success) {
          throw new Error(data.message)
        }
      } else {
        // Regular update for normal admin users
        const { error } = await supabase
          .from("complaints")
          .update({ status, admin_notes: adminNotes })
          .eq("id", complaintId)

        if (error) throw error
      }

      toast({
        title: "Success",
        description: `Complaint ${status} successfully!`,
      })

      fetchComplaints()
      setAdminNotes("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        )
      case "dismissed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Dismissed
          </Badge>
        )
      default:
        return null
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

  if (complaints.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No complaints</h3>
          <p className="text-gray-600">No complaints have been filed yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complaint Management</h2>
          <p className="text-gray-600 mt-1">Review and resolve user complaints</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {complaints.filter((c) => c.status === "pending").length} pending
        </Badge>
      </div>

      <div className="grid gap-6">
        {complaints.map((complaint) => (
          <Card key={complaint.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Complaint from {complaint.vendor.name}
                </CardTitle>
                {getStatusBadge(complaint.status)}
              </div>
              <div className="text-sm text-gray-600">Filed on {format(new Date(complaint.created_at), "PPP")}</div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Complainant</p>
                  <p>{complaint.vendor.name}</p>
                  <p className="text-sm text-gray-600">{complaint.vendor.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Against Supplier</p>
                  <p>{complaint.supplier.business_name}</p>
                  <p className="text-sm text-gray-600">{complaint.supplier.users.email}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Complaint Message</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{complaint.message}</p>
              </div>

              <div className="flex justify-end space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedComplaint(complaint)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review & Resolve
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Complaint Resolution</DialogTitle>
                      <DialogDescription>Review the complaint details and take appropriate action.</DialogDescription>
                    </DialogHeader>

                    {selectedComplaint && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Complainant</Label>
                            <p className="mt-1">{selectedComplaint.vendor.name}</p>
                            <p className="text-sm text-gray-600">{selectedComplaint.vendor.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Against Supplier</Label>
                            <p className="mt-1">{selectedComplaint.supplier.business_name}</p>
                            <p className="text-sm text-gray-600">{selectedComplaint.supplier.users.email}</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Complaint Message</Label>
                          <p className="mt-1 bg-gray-50 p-3 rounded-lg text-sm">{selectedComplaint.message}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Admin Notes</Label>
                          <Textarea
                            placeholder="Add your resolution notes here..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        {selectedComplaint.status === "pending" && (
                          <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button
                              variant="outline"
                              onClick={() => handleStatusUpdate(selectedComplaint.id, "dismissed")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Dismiss
                            </Button>
                            <Button onClick={() => handleStatusUpdate(selectedComplaint.id, "resolved")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
