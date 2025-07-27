-- Create a function that can be called via RPC to create user profiles
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated, anon;
