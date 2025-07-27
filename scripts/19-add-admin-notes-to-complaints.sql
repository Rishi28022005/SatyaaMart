-- Add admin_notes column to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Update the complaint management view to include admin notes
CREATE OR REPLACE VIEW admin_complaint_details AS
SELECT 
  c.id,
  c.message,
  c.status,
  c.admin_notes,
  c.created_at,
  v.name as vendor_name,
  v.email as vendor_email,
  s.business_name as supplier_business_name,
  su.name as supplier_user_name,
  su.email as supplier_user_email
FROM complaints c
JOIN users v ON c.vendor_id = v.id
JOIN suppliers s ON c.supplier_id = s.id
JOIN users su ON s.id = su.id;

-- Grant permissions on the view
GRANT SELECT ON admin_complaint_details TO authenticated, anon;
