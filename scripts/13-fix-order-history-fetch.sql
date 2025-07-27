-- Create a function to fetch vendor orders that bypasses RLS issues
CREATE OR REPLACE FUNCTION get_vendor_orders(vendor_uuid UUID)
RETURNS TABLE (
  id UUID,
  vendor_id UUID,
  total_price DECIMAL,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  order_items JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.vendor_id,
    o.total_price,
    o.status,
    o.created_at,
    COALESCE(
      json_agg(
        json_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'price', oi.price,
          'product_name', p.name,
          'product_image', p.image_url,
          'supplier_id', p.supplier_id,
          'supplier_name', s.business_name
        )
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::json
    ) as order_items
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  LEFT JOIN suppliers s ON p.supplier_id = s.id
  WHERE o.vendor_id = vendor_uuid
  GROUP BY o.id, o.vendor_id, o.total_price, o.status, o.created_at
  ORDER BY o.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_vendor_orders(UUID) TO authenticated, anon;

-- Create a function to fetch supplier orders
CREATE OR REPLACE FUNCTION get_supplier_orders(supplier_uuid UUID)
RETURNS TABLE (
  id UUID,
  vendor_id UUID,
  vendor_name TEXT,
  vendor_email TEXT,
  total_price DECIMAL,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  order_items JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    o.id,
    o.vendor_id,
    u.name as vendor_name,
    u.email as vendor_email,
    o.total_price,
    o.status,
    o.created_at,
    COALESCE(
      json_agg(
        json_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'price', oi.price,
          'product_name', p.name,
          'product_image', p.image_url
        )
      ) FILTER (WHERE oi.id IS NOT NULL AND p.supplier_id = supplier_uuid),
      '[]'::json
    ) as order_items
  FROM orders o
  JOIN users u ON o.vendor_id = u.id
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  WHERE p.supplier_id = supplier_uuid
  GROUP BY o.id, o.vendor_id, u.name, u.email, o.total_price, o.status, o.created_at
  ORDER BY o.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_supplier_orders(UUID) TO authenticated, anon;
