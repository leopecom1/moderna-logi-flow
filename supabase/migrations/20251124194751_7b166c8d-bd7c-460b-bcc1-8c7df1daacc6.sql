-- Create storage bucket for WooCommerce product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'woocommerce-images',
  'woocommerce-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload WooCommerce images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'woocommerce-images');

-- Allow public read access to images
CREATE POLICY "Public read access to WooCommerce images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'woocommerce-images');

-- Allow authenticated users to delete their uploaded images
CREATE POLICY "Authenticated users can delete WooCommerce images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'woocommerce-images');