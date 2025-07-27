-- Drop existing policies for suppliers table
DROP POLICY IF EXISTS "Anyone can view verified suppliers" ON suppliers;
DROP POLICY IF EXISTS "Suppliers can view their own data" ON suppliers;
DROP POLICY IF EXISTS "Suppliers can update their own data" ON suppliers;
DROP POLICY IF EXISTS "Admins can view all suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can update suppliers" ON suppliers;

-- Create new policies for suppliers table
CREATE POLICY "Anyone can view verified suppliers" ON suppliers
  FOR SELECT USING (is_verified = true);

CREATE POLICY "Suppliers can view their own data" ON suppliers
  FOR SELECT USING (auth.uid() = id);

-- Allow suppliers to insert their own registration data
CREATE POLICY "Suppliers can insert their own data" ON suppliers
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Suppliers can update their own data" ON suppliers
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all suppliers
CREATE POLICY "Admins can view all suppliers" ON suppliers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Allow admins to update suppliers (for verification)
CREATE POLICY "Admins can update suppliers" ON suppliers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.suppliers TO anon, authenticated;
