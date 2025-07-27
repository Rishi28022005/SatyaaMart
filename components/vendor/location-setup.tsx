"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Loader2 } from "lucide-react"

export function LocationSetup() {
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locationData, setLocationData] = useState({
    address: "",
    latitude: "",
    longitude: "",
  })

  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchUserLocation()
    }
  }, [profile])

  const fetchUserLocation = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("address, latitude, longitude")
        .eq("id", profile?.id)
        .single()

      if (error) throw error

      if (data) {
        setLocationData({
          address: data.address || "",
          latitude: data.latitude?.toString() || "",
          longitude: data.longitude?.toString() || "",
        })
      }
    } catch (error: any) {
      console.error("Error fetching location:", error)
    }
  }

  const getCurrentLocation = () => {
    setGettingLocation(true)

    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      })
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`,
          )
          const data = await response.json()
          const address = data.results?.[0]?.formatted || `${latitude}, ${longitude}`

          setLocationData({
            address,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          })

          toast({
            title: "Location detected",
            description: "Your current location has been detected",
          })
        } catch (error) {
          // Fallback to coordinates if geocoding fails
          setLocationData({
            address: `${latitude}, ${longitude}`,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          })
        }

        setGettingLocation(false)
      },
      (error) => {
        toast({
          title: "Error",
          description: "Unable to get your location. Please enter manually.",
          variant: "destructive",
        })
        setGettingLocation(false)
      },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          address: locationData.address,
          latitude: Number.parseFloat(locationData.latitude),
          longitude: Number.parseFloat(locationData.longitude),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Location updated successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Set Your Location</span>
        </CardTitle>
        <CardDescription>
          Set your location to find suppliers near you and get accurate delivery estimates.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={locationData.address}
              onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
              placeholder="Enter your address"
              required
            />
          </div>

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
                required
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
                required
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="w-full bg-transparent"
          >
            {gettingLocation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <MapPin className="mr-2 h-4 w-4" />
            Get Current Location
          </Button>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Location
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
