-- Create RPC functions specifically for admin operations that bypass RLS

-- Function to get all pending suppliers (for hardcoded admin)
CREATE OR REPLACE FUNCTION get_pending_suppliers_admin()
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  address TEXT,
  phone TEXT,
  fssai_number TEXT,
  fssai_doc_url TEXT,
  logo_url TEXT,
  is_verified BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.business_name,
    s.address,
    s.phone,
    s.fssai_number,
    s.fssai_doc_url,
    s.logo_url,
    s.is_verified,
    s.created_at,
    u.name as user_name,
    u.email as user_email
  FROM suppliers s
  JOIN users u ON s.id = u.id
  WHERE s.is_verified = false
  ORDER BY s.created_at DESC;
END;
$$;

-- Function to get all complaints (for hardcoded admin)
CREATE OR REPLACE FUNCTION get_all_complaints_admin()
RETURNS TABLE (
  id UUID,
  message TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  vendor_name TEXT,
  vendor_email TEXT,
  supplier_business_name TEXT,
  supplier_user_name TEXT,
  supplier_user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.message,
    c.status,
    c.created_at,
    v.name as vendor_name,
    v.email as vendor_email,
    s.business_name as supplier_business_name,
    su.name as supplier_user_name,
    su.email as supplier_user_email
  FROM complaints c
  JOIN users v ON c.vendor_id = v.id
  JOIN suppliers s ON c.supplier_id = s.id
  JOIN users su ON s.id = su.id
  ORDER BY c.created_at DESC;
END;
$$;

-- Function to approve/reject supplier (for hardcoded admin)
CREATE OR REPLACE FUNCTION update_supplier_verification_admin(
  supplier_id UUID,
  is_verified BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE suppliers 
  SET is_verified = update_supplier_verification_admin.is_verified
  WHERE id = supplier_id;
  
  SELECT json_build_object(
    'success', true,
    'message', 'Supplier verification updated successfully'
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN others THEN
    SELECT json_build_object(
      'success', false,
      'message', SQLERRM
    ) INTO result;
    RETURN result;
END;
$$;

-- Function to update complaint status (for hardcoded admin)
CREATE OR REPLACE FUNCTION update_complaint_status_admin(
  complaint_id UUID,
  new_status TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE complaints 
  SET 
    status = new_status,
    admin_notes = COALESCE(update_complaint_status_admin.admin_notes, complaints.admin_notes)
  WHERE id = complaint_id;
  
  SELECT json_build_object(
    'success', true,
    'message', 'Complaint status updated successfully'
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN others THEN
    SELECT json_build_object(
      'success', false,
      'message', SQLERRM
    ) INTO result;
    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pending_suppliers_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_complaints_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_supplier_verification_admin(UUID, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_complaint_status_admin(UUID, TEXT, TEXT) TO anon, authenticated;
