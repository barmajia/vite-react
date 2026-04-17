-- ============================================
-- MIDDLEMAN LAYER - Product Sourcing & Commission
-- ============================================
-- This layer allows middlemen to:
-- 1. Browse and select products by ASIN
-- 2. Set margins with sellers (by seller UUID)
-- 3. Track commissions and payments

-- ============================================
-- 1. MIDDLEMAN DEALS (links product ASIN + seller UUID + margin)
-- ============================================
CREATE TABLE IF NOT EXISTS "public"."middleman_deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "middle_man_id" "uuid" NOT NULL,
    "product_asin" "text" NOT NULL,
    "product_id" "uuid",
    "seller_id" "uuid" NOT NULL,
    "commission_rate" numeric(5,2) DEFAULT 5.00,
    "margin_amount" numeric(10,2) DEFAULT 0,
    "margin_type" "text" DEFAULT 'percentage',
    "unique_slug" "text" NOT NULL,
    "clicks" integer DEFAULT 0,
    "conversions" integer DEFAULT 0,
    "total_revenue" numeric(10,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "approval_status" "text" DEFAULT 'pending_approval'::"text",
    "promo_tags" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    CONSTRAINT "middleman_deals_margin_type_check" CHECK (("margin_type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text"]))),
    CONSTRAINT "middleman_deals_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending_approval'::"text", 'approved'::"text", 'rejected'::"text", 'archived'::"text"])))
);

ALTER TABLE "public"."middleman_deals" OWNER TO "postgres";

-- ============================================
-- 2. COMMISSIONS (tracks earnings per order)
-- ============================================
CREATE TABLE IF NOT EXISTS "public"."middleman_commissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "middle_man_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "deal_id" "uuid",
    "product_asin" "text" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "commission_rate" numeric(5,2),
    "status" "text" DEFAULT 'pending'::"text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "middleman_commissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'paid'::"text", 'cancelled'::"text"])))
);

ALTER TABLE "public"."middleman_commissions" OWNER TO "postgres";

-- ============================================
-- 3. MIDDLEMAN PRODUCTS (products middleman selected for their website)
-- ============================================
CREATE TABLE IF NOT EXISTS "public"."middleman_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "middle_man_id" "uuid" NOT NULL,
    "product_asin" "text" NOT NULL,
    "product_id" "uuid",
    "seller_id" "uuid" NOT NULL,
    "selected_price" numeric(10,2),
    "selling_price" numeric(10,2),
    "is_published" boolean DEFAULT false,
    "publish_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."middleman_products" OWNER TO "postgres";

-- ============================================
-- 4. PRIMARY KEYS
-- ============================================
ALTER TABLE ONLY "public"."middleman_deals"
    ADD CONSTRAINT "middleman_deals_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."middleman_commissions"
    ADD CONSTRAINT "middleman_commissions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."middleman_products"
    ADD CONSTRAINT "middleman_products_pkey" PRIMARY KEY ("id");

-- ============================================
-- 5. UNIQUE CONSTRAINTS
-- ============================================
ALTER TABLE ONLY "public"."middleman_deals"
    ADD CONSTRAINT "middleman_deals_middle_man_product_unique" UNIQUE ("middle_man_id", "product_asin");

ALTER TABLE ONLY "public"."middleman_deals"
    ADD CONSTRAINT "middleman_deals_unique_slug_key" UNIQUE ("unique_slug");

ALTER TABLE ONLY "public"."middleman_products"
    ADD CONSTRAINT "middleman_products_middle_man_asin_unique" UNIQUE ("middle_man_id", "product_asin");

-- ============================================
-- 6. FOREIGN KEYS
-- ============================================
ALTER TABLE ONLY "public"."middleman_deals"
    ADD CONSTRAINT "middleman_deals_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."middleman_deals"
    ADD CONSTRAINT "middleman_deals_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");

ALTER TABLE ONLY "public"."middleman_commissions"
    ADD CONSTRAINT "middleman_commissions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."middleman_deals"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."middleman_commissions"
    ADD CONSTRAINT "middleman_commissions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."middleman_products"
    ADD CONSTRAINT "middleman_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."middleman_products"
    ADD CONSTRAINT "middleman_products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id");

-- ============================================
-- 7. INDEXES
-- ============================================
CREATE INDEX "idx_middleman_deals_middle_man" ON "public"."middleman_deals" USING "btree" ("middle_man_id");
CREATE INDEX "idx_middleman_deals_asin" ON "public"."middleman_deals" USING "btree" ("product_asin");
CREATE INDEX "idx_middleman_deals_seller" ON "public"."middleman_deals" USING "btree" ("seller_id");
CREATE INDEX "idx_middleman_deals_slug" ON "public"."middleman_deals" USING "btree" ("unique_slug");
CREATE INDEX "idx_middleman_deals_active" ON "public"."middleman_deals" USING "btree" ("is_active", "approval_status");

CREATE INDEX "idx_middleman_commissions_middle_man" ON "public"."middleman_commissions" USING "btree" ("middle_man_id");
CREATE INDEX "idx_middleman_commissions_seller" ON "public"."middleman_commissions" USING "btree" ("seller_id");
CREATE INDEX "idx_middleman_commissions_status" ON "public"."middleman_commissions" USING "btree" ("status");

CREATE INDEX "idx_middleman_products_middle_man" ON "public"."middleman_products" USING "btree" ("middle_man_id");
CREATE INDEX "idx_middleman_products_asin" ON "public"."middleman_products" USING "btree" ("product_asin");
CREATE INDEX "idx_middleman_products_seller" ON "public"."middleman_products" USING "btree" ("seller_id");

-- ============================================
-- 8. FUNCTIONS
-- ============================================

-- Create deal: middleman selects product by ASIN and sets margin with seller
CREATE OR REPLACE FUNCTION "public"."middleman_create_deal"(
    "p_product_asin" "text",
    "p_seller_id" "uuid",
    "p_commission_rate" numeric DEFAULT 5.00,
    "p_margin_amount" numeric DEFAULT 0,
    "p_margin_type" "text" DEFAULT 'percentage'
) RETURNS "uuid"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    v_deal_id uuid;
    v_middle_man_id uuid;
    v_product_id uuid;
    v_unique_slug text;
BEGIN
    v_middle_man_id := auth.uid();
    
    IF v_middle_man_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    SELECT id INTO v_product_id FROM public.products WHERE asin = p_product_asin;
    
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Product not found with ASIN: %', p_product_asin;
    END IF;
    
    v_unique_slug := 'mm-' || LEFT(v_middle_man_id::TEXT, 8) || '-' || p_product_asin;
    
    INSERT INTO public.middleman_deals (
        middle_man_id,
        product_asin,
        product_id,
        seller_id,
        commission_rate,
        margin_amount,
        margin_type,
        unique_slug,
        is_active,
        approval_status
    ) VALUES (
        v_middle_man_id,
        p_product_asin,
        v_product_id,
        p_seller_id,
        p_commission_rate,
        p_margin_amount,
        p_margin_type,
        v_unique_slug,
        true,
        'pending_approval'
    )
    ON CONFLICT (middle_man_id, product_asin) DO UPDATE SET
        commission_rate = EXCLUDED.commission_rate,
        margin_amount = EXCLUDED.margin_amount,
        margin_type = EXCLUDED.margin_type,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_deal_id;
    
    RETURN v_deal_id;
END;
$$;

-- Select product for middleman website
CREATE OR REPLACE FUNCTION "public"."middleman_select_product"(
    "p_product_asin" "text",
    "p_selling_price" numeric
) RETURNS "uuid"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    v_product_id uuid;
    v_seller_id uuid;
    v_selection_id uuid;
    v_middle_man_id uuid;
BEGIN
    v_middle_man_id := auth.uid();
    
    IF v_middle_man_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    SELECT id, seller_id INTO v_product_id, v_seller_id 
    FROM public.products WHERE asin = p_product_asin;
    
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    INSERT INTO public.middleman_products (
        middle_man_id,
        product_asin,
        product_id,
        seller_id,
        selected_price,
        selling_price,
        is_published
    ) VALUES (
        v_middle_man_id,
        p_product_asin,
        v_product_id,
        v_seller_id,
        (SELECT price FROM public.products WHERE asin = p_product_asin),
        p_selling_price,
        false
    )
    ON CONFLICT (middle_man_id, product_asin) DO UPDATE SET
        selling_price = EXCLUDED.selling_price,
        updated_at = NOW()
    RETURNING id INTO v_selection_id;
    
    RETURN v_selection_id;
END;
$$;

-- Get products available for middleman (from sellers who allow middleman)
CREATE OR REPLACE VIEW "public"."middleman_available_products" AS
SELECT 
    p.asin,
    p.id as product_id,
    p.title,
    p.description,
    p.price,
    p.images,
    p.seller_id,
    s.full_name as seller_name,
    s.is_verified as seller_verified,
    p.category,
    p.status,
    p.average_rating,
    p.review_count
FROM public.products p
JOIN public.sellers s ON s.user_id = p.seller_id
WHERE p.status = 'active' 
AND p.is_deleted = false
AND COALESCE(p.allow_middleman, true) = true;

-- Get middleman's own deals
CREATE OR REPLACE VIEW "public"."middleman_my_deals" AS
SELECT 
    d.id,
    d.product_asin,
    d.seller_id,
    d.commission_rate,
    d.margin_amount,
    d.margin_type,
    d.unique_slug,
    d.clicks,
    d.conversions,
    d.total_revenue,
    d.is_active,
    d.approval_status,
    d.created_at,
    p.title as product_title,
    p.price as product_price,
    p.images as product_images,
    s.full_name as seller_name
FROM public.middleman_deals d
LEFT JOIN public.products p ON p.asin = d.product_asin
LEFT JOIN public.sellers s ON s.user_id = d.seller_id;

-- Get middleman's selected products
CREATE OR REPLACE VIEW "public"."middleman_my_products" AS
SELECT 
    mp.id,
    mp.product_asin,
    mp.seller_id,
    mp.selected_price,
    mp.selling_price,
    mp.is_published,
    mp.created_at,
    p.title as product_title,
    p.images as product_images,
    s.full_name as seller_name
FROM public.middleman_products mp
LEFT JOIN public.products p ON p.asin = mp.product_asin
LEFT JOIN public.sellers s ON s.user_id = mp.seller_id;

-- Get commissions for a middleman
CREATE OR REPLACE VIEW "public"."middleman_my_commissions" AS
SELECT 
    mc.id,
    mc.product_asin,
    mc.seller_id,
    mc.amount,
    mc.commission_rate,
    mc.status,
    mc.paid_at,
    mc.created_at,
    mc.order_id,
    s.full_name as seller_name
FROM public.middleman_commissions mc
LEFT JOIN public.sellers s ON s.user_id = mc.seller_id;

-- ============================================
-- 9. GRANTS
-- ============================================
GRANT SELECT ON public.middleman_deals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.middleman_deals TO authenticated;
GRANT SELECT ON public.middleman_commissions TO authenticated;
GRANT SELECT ON public.middleman_products TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.middleman_products TO authenticated;
GRANT SELECT ON public.middleman_available_products TO authenticated;
GRANT SELECT ON public.middleman_my_deals TO authenticated;
GRANT SELECT ON public.middleman_my_products TO authenticated;
GRANT SELECT ON public.middleman_my_commissions TO authenticated;

GRANT EXECUTE ON FUNCTION public.middleman_create_deal TO authenticated;
GRANT EXECUTE ON FUNCTION public.middleman_select_product TO authenticated;

-- ============================================
-- 10. RLS POLICIES
-- ============================================
ALTER TABLE public.middleman_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.middleman_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.middleman_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "middleman_deals_own" ON public.middleman_deals
FOR ALL TO authenticated USING (middle_man_id = auth.uid());

CREATE POLICY "middleman_commissions_own" ON public.middleman_commissions
FOR SELECT TO authenticated USING (middle_man_id = auth.uid());

CREATE POLICY "middleman_products_own" ON public.middleman_products
FOR ALL TO authenticated USING (middle_man_id = auth.uid());
