-- Drop existing problematic policies for orders table
DROP POLICY IF EXISTS "Vendors can view their own orders" ON orders;
DROP POLICY IF EXISTS "Vendors can create orders" ON orders;
DROP POLICY IF EXISTS "Suppliers can view orders for their products" ON orders;
DROP POLICY IF EXISTS "Suppliers can update order status" ON orders;

-- Create new simplified policies for orders table
CREATE POLICY "Vendors can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

-- Allow suppliers to view orders that contain their products (simplified)
CREATE POLICY "Suppliers can view relevant orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id AND p.supplier_id = auth.uid()
    )
  );

-- Allow suppliers to update order status (simplified)
CREATE POLICY "Suppliers can update relevant orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id AND p.supplier_id = auth.uid()
    )
  );

-- Fix order_items policies to prevent recursion
DROP POLICY IF EXISTS "Order items are viewable by order participants" ON order_items;
DROP POLICY IF EXISTS "Vendors can create order items" ON order_items;

-- Create new order_items policies
CREATE POLICY "Vendors can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can view their product order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = order_items.product_id AND p.supplier_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create order items for their orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.vendor_id = auth.uid()
    )
  );

-- Create a function to place orders that bypasses RLS issues
CREATE OR REPLACE FUNCTION place_order(
  vendor_id UUID,
  cart_items JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id UUID;
  cart_item JSON;
  total_price DECIMAL := 0;
  result JSON;
BEGIN
  -- Calculate total price from cart items
  FOR cart_item IN SELECT * FROM json_array_elements(cart_items)
  LOOP
    total_price := total_price + (cart_item->>'price')::DECIMAL * (cart_item->>'quantity')::INTEGER;
  END LOOP;

  -- Create the order
  INSERT INTO orders (vendor_id, total_price, status)
  VALUES (vendor_id, total_price, 'pending')
  RETURNING id INTO new_order_id;

  -- Insert order items
  FOR cart_item IN SELECT * FROM json_array_elements(cart_items)
  LOOP
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (
      new_order_id,
      (cart_item->>'product_id')::UUID,
      (cart_item->>'quantity')::INTEGER,
      (cart_item->>'price')::DECIMAL
    );
  END LOOP;

  -- Clear the vendor's cart
  DELETE FROM cart WHERE cart.vendor_id = place_order.vendor_id;

  -- Return success with order ID
  SELECT json_build_object(
    'success', true,
    'order_id', new_order_id,
    'message', 'Order placed successfully'
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION place_order(UUID, JSON) TO authenticated, anon;
