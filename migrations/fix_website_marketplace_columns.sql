-- =====================================================
-- Fix website_marketplace table - Add missing columns
-- =====================================================
-- Run this if your table exists but is missing columns
-- =====================================================

-- Add missing columns (will skip if they already exist)
DO $$ 
BEGIN
  -- Add total_sales column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'total_sales'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "total_sales" integer DEFAULT 0;
  END IF;

  -- Add rating column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'rating'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "rating" numeric(3, 2) DEFAULT 0;
  END IF;

  -- Add preview_url column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'preview_url'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "preview_url" text;
  END IF;

  -- Add theme_config column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'theme_config'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "theme_config" jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add version column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'version'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "version" text DEFAULT '1.0.0';
  END IF;

  -- Add seller_id column if not exists (foreign key)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "seller_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add description column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'description'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "description" text;
  END IF;

  -- Add category column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'category'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "category" text;
  END IF;

  -- Add target_role column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'target_role'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "target_role" text;
  END IF;

  -- Add thumbnail_url column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "thumbnail_url" text;
  END IF;

  -- Add price column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'price'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "price" numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;

  -- Add is_published column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "is_published" boolean DEFAULT false;
  END IF;

  -- Add title column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'title'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "title" text;
  END IF;

  -- Add created_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();
  END IF;

  -- Add updated_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_marketplace' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "public"."website_marketplace" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_marketplace_published" 
ON "public"."website_marketplace" ("is_published", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_marketplace_category" 
ON "public"."website_marketplace" ("category");

CREATE INDEX IF NOT EXISTS "idx_marketplace_seller" 
ON "public"."website_marketplace" ("seller_id");

-- Enable RLS if not already enabled
ALTER TABLE "public"."website_marketplace" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$ 
BEGIN
  -- Drop if exists
  DROP POLICY IF EXISTS "public_view_published_marketplace" ON "public"."website_marketplace";
  DROP POLICY IF EXISTS "sellers_manage_own_marketplace" ON "public"."website_marketplace";
  
  -- Recreate policies
  CREATE POLICY "public_view_published_marketplace" 
  ON "public"."website_marketplace" 
  FOR SELECT 
  TO "anon" 
  USING ("is_published" = true);

  CREATE POLICY "sellers_manage_own_marketplace" 
  ON "public"."website_marketplace" 
  TO "authenticated" 
  USING ("seller_id" = auth.uid()) 
  WITH CHECK ("seller_id" = auth.uid());
END $$;
