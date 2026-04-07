-- services_expansion.sql
-- Expansion of service provider profiles for specialized verticals

-- 1. Programmer Profiles
CREATE TABLE IF NOT EXISTS "public"."svc_programmer_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider_id" "uuid", -- Link to general svc_providers if needed
    "tech_stack" "jsonb" DEFAULT '[]'::"jsonb", -- ['react', 'node', 'postgresql']
    "github_url" "text",
    "portfolio_url" "text",
    "years_of_experience" integer,
    "specialization" "text", -- 'frontend', 'backend', 'fullstack', 'mobile'
    "hourly_rate" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "availability_status" "text" DEFAULT 'available'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "svc_programmer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);

-- 2. Translator Profiles
CREATE TABLE IF NOT EXISTS "public"."svc_translator_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "native_language" "text",
    "languages" "jsonb" DEFAULT '[]'::"jsonb", -- [{'from': 'en', 'to': 'ar', 'level': 'expert'}]
    "certifications" "jsonb" DEFAULT '[]'::"jsonb",
    "specialization_areas" "jsonb" DEFAULT '[]'::"jsonb", -- ['legal', 'medical', 'technical']
    "rate_per_word" numeric(10,4),
    "currency" "text" DEFAULT 'USD'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "svc_translator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);

-- 3. Designer Profiles
CREATE TABLE IF NOT EXISTS "public"."svc_designer_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "design_tools" "jsonb" DEFAULT '[]'::"jsonb", -- ['figma', 'photoshop', 'illustrator']
    "portfolio_url" "text",
    "behance_url" "text",
    "dribbble_url" "text",
    "specializations" "jsonb" DEFAULT '[]'::"jsonb", -- ['uiux', 'branding', 'illustration']
    "style_tags" "jsonb" DEFAULT '[]'::"jsonb", -- ['minimalist', 'brutalist', 'cyberpunk']
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "svc_designer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);

-- 4. Home Service Profiles
CREATE TABLE IF NOT EXISTS "public"."svc_home_service_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_types" "jsonb" DEFAULT '[]'::"jsonb", -- ['plumbing', 'electrical', 'cleaning']
    "coverage_area" "text", -- 'Cairo', 'New York'
    "latitude" numeric,
    "longitude" numeric,
    "license_number" "text",
    "years_in_business" integer,
    "has_insurance" boolean DEFAULT false,
    "emergency_service" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "svc_home_service_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);

-- Enable RLS
ALTER TABLE "public"."svc_programmer_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."svc_translator_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."svc_designer_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."svc_home_service_profiles" ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now - proper policies should be added)
CREATE POLICY "Public Programmer Profiles are viewable by everyone" ON "public"."svc_programmer_profiles" FOR SELECT USING (true);
CREATE POLICY "Users can update their own programmer profile" ON "public"."svc_programmer_profiles" FOR UPDATE USING ("auth"."uid"() = "user_id");

CREATE POLICY "Public Translator Profiles are viewable by everyone" ON "public"."svc_translator_profiles" FOR SELECT USING (true);
CREATE POLICY "Users can update their own translator profile" ON "public"."svc_translator_profiles" FOR UPDATE USING ("auth"."uid"() = "user_id");

CREATE POLICY "Public Designer Profiles are viewable by everyone" ON "public"."svc_designer_profiles" FOR SELECT USING (true);
CREATE POLICY "Users can update their own designer profile" ON "public"."svc_designer_profiles" FOR UPDATE USING ("auth"."uid"() = "user_id");

CREATE POLICY "Public Home Service Profiles are viewable by everyone" ON "public"."svc_home_service_profiles" FOR SELECT USING (true);
CREATE POLICY "Users can update their own home service profile" ON "public"."svc_home_service_profiles" FOR UPDATE USING ("auth"."uid"() = "user_id");
