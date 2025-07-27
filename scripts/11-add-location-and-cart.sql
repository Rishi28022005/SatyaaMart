-- Add location fields to users and suppliers tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create cart table for vendors
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, product_id)
);

-- Enable RLS on cart table
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Vendors can manage their own cart" ON cart
  FOR ALL USING (auth.uid() = vendor_id);

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL, 
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * 
      cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * 
      sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get suppliers within radius
CREATE OR REPLACE FUNCTION get_suppliers_within_radius(
  vendor_lat DECIMAL,
  vendor_lon DECIMAL,
  radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  address TEXT,
  phone TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.business_name,
    s.address,
    s.phone,
    s.latitude,
    s.longitude,
    calculate_distance(vendor_lat, vendor_lon, s.latitude, s.longitude) as distance_km,
    s.is_verified
  FROM suppliers s
  WHERE s.is_verified = true
    AND s.latitude IS NOT NULL 
    AND s.longitude IS NOT NULL
    AND calculate_distance(vendor_lat, vendor_lon, s.latitude, s.longitude) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_suppliers_within_radius(DECIMAL, DECIMAL, DECIMAL) TO authenticated, anon;
GRANT ALL ON cart TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_cart_vendor ON cart(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
