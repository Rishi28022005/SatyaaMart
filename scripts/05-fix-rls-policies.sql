-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- Create new policies that work properly
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (this is the key fix)
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow the trigger function to insert users (service role)
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Grant proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO anon, authenticated, service_role;

-- Update the trigger function to use SECURITY DEFINER properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
