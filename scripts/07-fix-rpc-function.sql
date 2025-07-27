-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT);

-- Create the RPC function with correct parameter names and order
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert the user profile
  INSERT INTO public.users (id, email, name, role)
  VALUES (user_id, user_email, user_name, user_role);
  
  -- Return success
  SELECT json_build_object(
    'success', true,
    'message', 'User profile created successfully'
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, update instead
    UPDATE public.users 
    SET 
      email = user_email,
      name = user_name,
      role = user_role
    WHERE id = user_id;
    
    SELECT json_build_object(
      'success', true,
      'message', 'User profile updated successfully'
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;

-- Also create a simpler version that just does the insert without RLS issues
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendor')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Don't fail the auth process
    RETURN NEW;
END;
$$;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_signup();
