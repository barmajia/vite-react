-- ============================================
-- SUPABASE STORAGE BUCKET SETUP
-- For Seller Storefront Assets (Logos, Banners, etc.)
-- ============================================

-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql

-- ── 1. Create Storage Bucket ────────────────────────────────────────

-- Create the 'store-assets' bucket for seller uploads
-- Public = true means anyone can view the assets (needed for storefronts)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-assets',
  'store-assets',
  true,
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Storage Policies for Upload ─────────────────────────────────

-- Allow authenticated sellers to upload to store-assets bucket
CREATE POLICY "Sellers can upload store assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-assets'
);

-- Allow authenticated sellers to update their own assets
CREATE POLICY "Sellers can update own store assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-assets'
  AND owner = auth.uid()
);

-- Allow authenticated sellers to delete their own assets
CREATE POLICY "Sellers can delete own store assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-assets'
  AND owner = auth.uid()
);

-- ── 3. Storage Policies for Public Access ──────────────────────────

-- Allow anyone to view store assets (needed for public storefronts)
CREATE POLICY "Anyone can view store assets"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'store-assets'
);

-- ── 4. Verification Query ─────────────────────────────────────────

-- Run this to verify the bucket was created correctly
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'store-assets';

-- Run this to verify policies were created
SELECT 
  schemaname,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%store assets%';

-- ── 5. Test Upload (Optional) ─────────────────────────────────────

-- To test the storage setup, you can use this SQL to list objects
-- after uploading a file via the Supabase Dashboard or API:
/*
SELECT 
  name,
  bucket_id,
  owner,
  metadata,
  created_at
FROM storage.objects
WHERE bucket_id = 'store-assets'
ORDER BY created_at DESC
LIMIT 10;
*/
