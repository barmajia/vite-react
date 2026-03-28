-- Create storage buckets for Health module
-- Run this in your Supabase SQL Editor

-- Create health-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'health-documents',
  'health-documents',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create health-records bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'health-records',
  'health-records',
  false, -- Private bucket for medical records
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create pharmacy-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pharmacy-documents',
  'pharmacy-documents',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS policies for health-documents
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read from health-documents
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'health-documents');

-- Policy: Authenticated users can upload to health-documents
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'health-documents' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own files
CREATE POLICY "Users Can Update Own Files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'health-documents'
  AND auth.uid()::text = owner::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users Can Delete Own Files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'health-documents'
  AND auth.uid()::text = owner::text
);

-- RLS policies for health-records (private)
CREATE POLICY "Health Records - Owner Read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'health-records'
  AND auth.uid()::text = owner::text
);

CREATE POLICY "Health Records - Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'health-records'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Health Records - Owner Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'health-records'
  AND auth.uid()::text = owner::text
);

CREATE POLICY "Health Records - Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'health-records'
  AND auth.uid()::text = owner::text
);

-- RLS policies for pharmacy-documents
CREATE POLICY "Pharmacy Documents - Public Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'pharmacy-documents');

CREATE POLICY "Pharmacy Documents - Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pharmacy-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Pharmacy Documents - Owner Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pharmacy-documents'
  AND auth.uid()::text = owner::text
);

CREATE POLICY "Pharmacy Documents - Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pharmacy-documents'
  AND auth.uid()::text = owner::text
);

-- Create function to get bucket name based on document type
CREATE OR REPLACE FUNCTION get_health_bucket(doc_type text)
RETURNS text AS $$
BEGIN
  CASE doc_type
    WHEN 'license' THEN RETURN 'health-documents';
    WHEN 'certificate' THEN RETURN 'health-documents';
    WHEN 'prescription' THEN RETURN 'health-records';
    WHEN 'medical_record' THEN RETURN 'health-records';
    WHEN 'pharmacy_license' THEN RETURN 'pharmacy-documents';
    ELSE RETURN 'health-documents';
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_health_bucket(text) TO authenticated;
