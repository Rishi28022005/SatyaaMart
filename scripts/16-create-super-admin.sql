-- Create super admin user in auth.users table
-- This needs to be done manually in Supabase Auth dashboard
-- Email: rishimpatel28@gmail.com
-- Password: Rishi@2005

-- Insert the user profile (this will work after auth user is created)
INSERT INTO users (id, email, name, role) 
SELECT 
  auth.uid() as id,
  'rishimpatel28@gmail.com' as email,
  'Super Admin' as name,
  'admin' as role
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'rishimpatel28@gmail.com'
);

-- Alternative: If you know the auth user ID, insert directly
-- Replace 'your-auth-user-id-here' with the actual UUID from Supabase Auth
-- INSERT INTO users (id, email, name, role) 
-- VALUES ('your-auth-user-id-here', 'rishimpatel28@gmail.com', 'Super Admin', 'admin')
-- ON CONFLICT (email) DO NOTHING;
