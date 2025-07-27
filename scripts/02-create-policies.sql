-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Suppliers policies
CREATE POLICY "Anyone can view verified suppliers" ON suppliers
  FOR SELECT USING (is_verified = true);

CREATE POLICY "Suppliers can view their own data" ON suppliers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Suppliers can update their own data" ON suppliers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all suppliers" ON suppliers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update suppliers" ON suppliers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Products policies
CREATE POLICY "Anyone can view products from verified suppliers" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM suppliers 
      WHERE suppliers.id = products.supplier_id AND suppliers.is_verified = true
    )
  );

CREATE POLICY "Suppliers can manage their own products" ON products
  FOR ALL USING (auth.uid() = supplier_id);

-- Orders policies
CREATE POLICY "Vendors can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Suppliers can view orders for their products" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id AND p.supplier_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can update order status" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id AND p.supplier_id = auth.uid()
    )
  );

-- Order items policies
CREATE POLICY "Order items are viewable by order participants" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.vendor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = order_items.product_id AND p.supplier_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.vendor_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Vendors can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

-- Complaints policies
CREATE POLICY "Users can view their own complaints" ON complaints
  FOR SELECT USING (auth.uid() = vendor_id OR auth.uid() = supplier_id);

CREATE POLICY "Vendors can create complaints" ON complaints
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
