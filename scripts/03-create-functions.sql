-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email_confirmed_at::text, 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendor')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get supplier rating
CREATE OR REPLACE FUNCTION get_supplier_rating(supplier_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE supplier_id = supplier_uuid
  );
END;
$$ LANGUAGE plpgsql;
