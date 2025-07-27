-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('documents', 'documents', true),
  ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for documents bucket
CREATE POLICY "Anyone can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policies for images bucket
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
