-- Create an RPC function for supplier registration to bypass RLS issues
CREATE OR REPLACE FUNCTION register_supplier(
  supplier_id UUID,
  business_name TEXT,
  address TEXT,
  phone TEXT,
  fssai_number TEXT,
  fssai_doc_url TEXT,
  logo_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user exists and has supplier role
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = supplier_id AND role = 'supplier'
  ) THEN
    SELECT json_build_object(
      'success', false,
      'message', 'User not found or not a supplier'
    ) INTO result;
    RETURN result;
  END IF;

  -- Insert supplier data
  INSERT INTO public.suppliers (
    id, 
    business_name, 
    address, 
    phone, 
    fssai_number, 
    fssai_doc_url, 
    logo_url,
    is_verified
  )
  VALUES (
    supplier_id, 
    business_name, 
    address, 
    phone, 
    fssai_number, 
    fssai_doc_url, 
    logo_url,
    false
  );
  
  -- Return success
  SELECT json_build_object(
    'success', true,
    'message', 'Supplier registration submitted successfully'
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN unique_violation THEN
    SELECT json_build_object(
      'success', false,
      'message', 'Supplier registration already exists'
    ) INTO result;
    RETURN result;
  WHEN others THEN
    SELECT json_build_object(
      'success', false,
      'message', SQLERRM
    ) INTO result;
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION register_supplier(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;
