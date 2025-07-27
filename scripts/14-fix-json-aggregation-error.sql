-- Drop the existing functions that have JSON issues
DROP FUNCTION IF EXISTS get_vendor_orders(UUID);
DROP FUNCTION IF EXISTS get_supplier_orders(UUID);

-- Create a simpler function to fetch vendor orders without JSON aggregation issues
CREATE OR REPLACE FUNCTION get_vendor_orders(vendor_uuid UUID)
RETURNS TABLE (
  order_id UUID,
  vendor_id UUID,
  total_price DECIMAL,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  item_id UUID,
  product_id UUID,
  quantity INTEGER,
  price DECIMAL,
  product_name TEXT,
  product_image TEXT,
  supplier_id UUID,
  supplier_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.vendor_id,
    o.total_price,
    o.status,
    o.created_at,
    oi.id as item_id,
    oi.product_id,
    oi.quantity,
    oi.price,
    p.name as product_name,
    p.image_url as product_image,
    p.supplier_id,
    s.business_name as supplier_name
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  LEFT JOIN suppliers s ON p.supplier_id = s.id
  WHERE o.vendor_id = vendor_uuid
  ORDER BY o.created_at DESC, oi.id;
END;
$$;

-- Create a simpler function to fetch supplier orders
CREATE OR REPLACE FUNCTION get_supplier_orders(supplier_uuid UUID)
RETURNS TABLE (
  order_id UUID,
  vendor_id UUID,
  vendor_name TEXT,
  vendor_email TEXT,
  total_price DECIMAL,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  item_id UUID,
  product_id UUID,
  quantity INTEGER,
  price DECIMAL,
  product_name TEXT,
  product_image TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    o.id as order_id,
    o.vendor_id,
    u.name as vendor_name,
    u.email as vendor_email,
    o.total_price,
    o.status,
    o.created_at,
    oi.id as item_id,
    oi.product_id,
    oi.quantity,
    oi.price,
    p.name as product_name,
    p.image_url as product_image
  FROM orders o
  JOIN users u ON o.vendor_id = u.id
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  WHERE p.supplier_id = supplier_uuid
  ORDER BY o.created_at DESC, oi.id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_vendor_orders(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_supplier_orders(UUID) TO authenticated, anon;
