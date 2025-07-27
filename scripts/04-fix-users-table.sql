-- Ensure the users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vendor', 'supplier', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Add policy for inserting new users (needed for the trigger)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_role TEXT;
BEGIN
  -- Extract name and role from metadata with fallbacks
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'vendor'
  );

  -- Insert the user profile
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, user_name, user_role);
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, update instead
    UPDATE public.users 
    SET 
      email = NEW.email,
      name = user_name,
      role = user_role
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN others THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
