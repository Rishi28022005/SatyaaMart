"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Clock, MessageSquare, History } from "lucide-react"

type Supplier = {
  id: string
  business_name: string
  is_verified: boolean
}

type Complaint = {
  id: string
  message: string
  status: "pending" | "resolved" | "dismissed"
  created_at: string
  suppliers: {
    business_name: string
  }
  admin_notes?: string
}

export function ComplaintSection() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchSuppliers()
      fetchComplaints()
    }
  }, [profile])

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, business_name, is_verified")
        .eq("is_verified", true)
        .order("business_name")

      if (error) throw error
      setSuppliers(data || [])
    } catch (error: any) {
      console.error("Error fetching suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch suppliers",
        variant: "destructive",
      })
    }
  }

  const fetchComplaints = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(`
          id,
          message,
          status,
          created_at,
          admin_notes,
          suppliers (
            business_name
          )
        `)
        .eq("vendor_id", profile.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setComplaints(data || [])
    } catch (error: any) {
      console.error("Error fetching complaints:", error)
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComplaint = async () => {
    if (!profile || !selectedSupplier || !message.trim()) {
      toast({
        title: "Error",
        description: "Please select a supplier and enter a message",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("complaints").insert({
        vendor_id: profile.id,
        supplier_id: selectedSupplier,
        message: message.trim(),
        status: "pending",
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Complaint submitted successfully",
      })

      // Reset form
      setSelectedSupplier("")
      setMessage("")
      
      // Refresh complaints list
      await fetchComplaints()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "dismissed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "resolved":
        return <Badge variant="default" className="bg-green-500">Resolved</Badge>
      case "dismissed":
        return <Badge variant="destructive">Dismissed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  return (
    <div className="space-y-6">
      {/* Submit New Complaint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Submit New Complaint</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Supplier</label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a supplier to complain about" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    <div className="flex items-center space-x-2">
                      <span>{supplier.business_name}</span>
                      {supplier.is_verified && (
                        <Badge variant="outline" className="text-xs">Verified</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Complaint Message</label>
            <Textarea
              placeholder="Describe your complaint in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSubmitComplaint} 
            disabled={submitting || !selectedSupplier || !message.trim()}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Complaint"}
          </Button>
        </CardContent>
      </Card>

      {/* Complaint History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Your Complaints</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No complaints submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(complaint.status)}
                      <span className="font-medium">{complaint.suppliers.business_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(complaint.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">{complaint.message}</p>
                  
                  {complaint.admin_notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">Admin Response:</p>
                      <p className="text-sm text-blue-700">{complaint.admin_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 