-- Ensure complaints table exists with proper structure
CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_vendor_id ON complaints(vendor_id);
CREATE INDEX IF NOT EXISTS idx_complaints_supplier_id ON complaints(supplier_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaints table
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Vendors can view their own complaints" ON complaints;
DROP POLICY IF EXISTS "Vendors can insert complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON complaints;

-- Vendors can only see their own complaints
CREATE POLICY "Vendors can view their own complaints" ON complaints
  FOR SELECT USING (
    auth.uid() = vendor_id
  );

-- Vendors can insert their own complaints
CREATE POLICY "Vendors can insert complaints" ON complaints
  FOR INSERT WITH CHECK (
    auth.uid() = vendor_id
  );

-- Admins can view all complaints
CREATE POLICY "Admins can view all complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admins can update complaint status and add notes
CREATE POLICY "Admins can update complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON complaints TO authenticated;
GRANT USAGE ON SEQUENCE complaints_id_seq TO authenticated; 