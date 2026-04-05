-- =====================================================
-- Website Marketplace Schema Migration
-- =====================================================
-- Creates tables for:
-- - website_marketplace: Template listings
-- - marketplace_purchases: Purchase tracking
-- - website_pages: Dynamic storefront pages
-- =====================================================

-- 1. Website Marketplace Table
CREATE TABLE IF NOT EXISTS "public"."website_marketplace" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "target_role" "text",
    "price" numeric(10, 2) NOT NULL DEFAULT 0,
    "thumbnail_url" "text",
    "preview_url" "text",
    "theme_config" "jsonb" DEFAULT '{}'::"jsonb",
    "version" "text" DEFAULT '1.0.0',
    "rating" numeric(3, 2) DEFAULT 0,
    "total_sales" integer DEFAULT 0,
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "website_marketplace_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "price_non_negative" CHECK ("price" >= 0)
);

ALTER TABLE "public"."website_marketplace" OWNER TO "postgres";

-- RLS Policies for website_marketplace
ALTER TABLE "public"."website_marketplace" ENABLE ROW LEVEL SECURITY;

-- Anyone can view published templates
CREATE POLICY "public_view_published_marketplace" 
ON "public"."website_marketplace" 
FOR SELECT 
TO "anon" 
USING ("is_published" = true);

-- Sellers can manage their own templates
CREATE POLICY "sellers_manage_own_marketplace" 
ON "public"."website_marketplace" 
TO "authenticated" 
USING ("seller_id" = "auth"."uid"()) 
WITH CHECK ("seller_id" = "auth"."uid"());

-- 2. Marketplace Purchases Table
CREATE TABLE IF NOT EXISTS "public"."marketplace_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "buyer_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "template_id" "uuid" NOT NULL REFERENCES "public"."website_marketplace"("id") ON DELETE CASCADE,
    "amount_paid" numeric(10, 2) NOT NULL,
    "payment_method" "text" DEFAULT 'wallet',
    "payment_status" "text" DEFAULT 'completed',
    "downloaded" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "marketplace_purchases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "amount_paid_positive" CHECK ("amount_paid" >= 0)
);

ALTER TABLE "public"."marketplace_purchases" OWNER TO "postgres";

-- RLS Policies for marketplace_purchases
ALTER TABLE "public"."marketplace_purchases" ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own purchases
CREATE POLICY "users_view_own_purchases" 
ON "public"."marketplace_purchases" 
FOR SELECT 
TO "authenticated" 
USING ("buyer_id" = "auth"."uid"());

-- Insert purchases (authenticated users)
CREATE POLICY "users_insert_own_purchases" 
ON "public"."marketplace_purchases" 
FOR INSERT 
TO "authenticated" 
WITH CHECK ("buyer_id" = "auth"."uid"());

-- 3. Website Pages Table (for dynamic storefront content)
CREATE TABLE IF NOT EXISTS "public"."website_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "website_id" "uuid" NOT NULL REFERENCES "public"."websites"("id") ON DELETE CASCADE,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb",
    "is_published" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "website_pages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "website_pages_website_slug_key" UNIQUE ("website_id", "slug")
);

ALTER TABLE "public"."website_pages" OWNER TO "postgres";

-- RLS Policies for website_pages
ALTER TABLE "public"."website_pages" ENABLE ROW LEVEL SECURITY;

-- Public can view published pages
CREATE POLICY "public_view_published_pages" 
ON "public"."website_pages" 
FOR SELECT 
TO "anon" 
USING ("is_published" = true);

-- Website owners can manage their pages
CREATE POLICY "owners_manage_own_pages" 
ON "public"."website_pages" 
TO "authenticated" 
USING (
    EXISTS (
        SELECT 1 FROM "public"."websites" 
        WHERE "websites"."id" = "website_pages"."website_id" 
        AND "websites"."seller_id" = "auth"."uid"()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."websites" 
        WHERE "websites"."id" = "website_pages"."website_id" 
        AND "websites"."seller_id" = "auth"."uid"()
    )
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_marketplace_published" 
ON "public"."website_marketplace" ("is_published", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_marketplace_category" 
ON "public"."website_marketplace" ("category");

CREATE INDEX IF NOT EXISTS "idx_marketplace_seller" 
ON "public"."website_marketplace" ("seller_id");

CREATE INDEX IF NOT EXISTS "idx_purchases_buyer" 
ON "public"."marketplace_purchases" ("buyer_id");

CREATE INDEX IF NOT EXISTS "idx_purchases_template" 
ON "public"."marketplace_purchases" ("template_id");

CREATE INDEX IF NOT EXISTS "idx_website_pages_website" 
ON "public"."website_pages" ("website_id", "sort_order");

-- 5. Trigger to update updated_at
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "update_website_marketplace_updated_at"
    BEFORE UPDATE ON "public"."website_marketplace"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE TRIGGER "update_website_pages_updated_at"
    BEFORE UPDATE ON "public"."website_pages"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();
