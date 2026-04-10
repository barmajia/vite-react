-- ============================================
-- PRODUCT REVIEWS SYSTEM - COMPLETE SCHEMA
-- Safe Re-Run (Drops and recreates all objects)
-- ============================================

-- ============================================
-- 1. PRODUCT REVIEWS TABLE
-- ============================================
DROP TABLE IF EXISTS public.product_reviews CASCADE;
CREATE TABLE public.product_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user can only review a product once
    UNIQUE(product_id, user_id)
);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.product_reviews IS 'Product reviews and ratings from customers';

-- ============================================
-- 2. REVIEW HELPFULNESS TRACKING
-- ============================================
DROP TABLE IF EXISTS public.review_helpful_votes CASCADE;
CREATE TABLE public.review_helpful_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(review_id, user_id)
);
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.review_helpful_votes IS 'Track which users found reviews helpful';

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_approved ON product_reviews(is_approved);
CREATE INDEX idx_product_reviews_verified ON product_reviews(is_verified_purchase);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_product_reviews_created ON product_reviews(created_at DESC);
CREATE INDEX idx_review_helpful_votes_review ON review_helpful_votes(review_id);

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Calculate average rating for a product
CREATE OR REPLACE FUNCTION calculate_product_rating(p_product_id UUID)
RETURNS TABLE(
    average_rating NUMERIC,
    review_count BIGINT,
    rating_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(r.rating), 0)::NUMERIC(3,2) as average_rating,
        COUNT(*)::BIGINT as review_count,
        JSONB_BUILD_OBJECT(
            '5', COUNT(*) FILTER (WHERE r.rating = 5),
            '4', COUNT(*) FILTER (WHERE r.rating = 4),
            '3', COUNT(*) FILTER (WHERE r.rating = 3),
            '2', COUNT(*) FILTER (WHERE r.rating = 2),
            '1', COUNT(*) FILTER (WHERE r.rating = 1)
        )::JSONB as rating_breakdown
    FROM product_reviews r
    WHERE r.product_id = p_product_id
    AND r.is_approved = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if user purchased a product
CREATE OR REPLACE FUNCTION is_verified_purchase(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = p_user_id
        AND oi.asin IN (
            SELECT p.asin 
            FROM products p 
            WHERE p.id = p_product_id
        )
        AND o.payment_status = 'paid'
        AND o.status != 'cancelled'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Product Reviews Policies
CREATE POLICY "Anyone can view approved reviews"
ON product_reviews
FOR SELECT
USING (is_approved = true);

CREATE POLICY "Users can view their own reviews"
ON product_reviews
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews"
ON product_reviews
FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    -- Check if user actually purchased the product (optional, can be removed for demo)
    -- is_verified_purchase(auth.uid(), product_id) AND
    NOT EXISTS (
        SELECT 1 FROM product_reviews pr
        WHERE pr.product_id = product_id AND pr.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own reviews"
ON product_reviews
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON product_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON product_reviews
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.account_type = 'admin'
    )
);

-- Review Helpful Votes Policies
CREATE POLICY "Anyone can view helpful votes"
ON review_helpful_votes
FOR SELECT
USING (true);

CREATE POLICY "Users can vote on reviews"
ON review_helpful_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their votes"
ON review_helpful_votes
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Update product rating on review change
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the products table with new average
    UPDATE products
    SET 
        average_rating = (SELECT average_rating FROM calculate_product_rating(NEW.product_id)),
        review_count = (SELECT review_count FROM calculate_product_rating(NEW.product_id))
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- Increment helpful count
CREATE OR REPLACE FUNCTION increment_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE product_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_helpful_count
AFTER INSERT ON review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION increment_helpful_count();

-- ============================================
-- 7. RPC FUNCTIONS FOR FRONTEND
-- ============================================

-- Get product reviews with pagination
CREATE OR REPLACE FUNCTION get_product_reviews(
    p_product_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_sort_by TEXT DEFAULT 'created_at',
    p_sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE(
    id UUID,
    product_id UUID,
    user_id UUID,
    rating INTEGER,
    title TEXT,
    content TEXT,
    is_verified_purchase BOOLEAN,
    helpful_count INTEGER,
    images TEXT[],
    created_at TIMESTAMPTZ,
    user_name TEXT,
    user_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.product_id,
        pr.user_id,
        pr.rating,
        pr.title,
        pr.content,
        pr.is_verified_purchase,
        pr.helpful_count,
        pr.images,
        pr.created_at,
        COALESCE(u.full_name, u.email)::TEXT as user_name,
        (u.raw_user_meta_data->>'avatar_url')::TEXT as user_avatar
    FROM product_reviews pr
    LEFT JOIN users u ON u.id = pr.user_id
    WHERE pr.product_id = p_product_id
    AND (pr.is_approved = true OR pr.user_id = auth.uid())
    ORDER BY 
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'DESC' THEN pr.created_at END DESC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'ASC' THEN pr.created_at END ASC,
        CASE WHEN p_sort_by = 'rating' AND p_sort_order = 'DESC' THEN pr.rating END DESC,
        CASE WHEN p_sort_by = 'rating' AND p_sort_order = 'ASC' THEN pr.rating END ASC,
        CASE WHEN p_sort_by = 'helpful' AND p_sort_order = 'DESC' THEN pr.helpful_count END DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Submit a review
CREATE OR REPLACE FUNCTION submit_product_review(
    p_product_id UUID,
    p_rating INTEGER,
    p_title TEXT,
    p_content TEXT,
    p_images TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_review_id UUID;
    v_is_verified BOOLEAN;
BEGIN
    -- Check if verified purchase
    SELECT is_verified_purchase(auth.uid(), p_product_id) INTO v_is_verified;
    
    -- Insert review
    INSERT INTO product_reviews (
        product_id,
        user_id,
        rating,
        title,
        content,
        is_verified_purchase,
        images
    ) VALUES (
        p_product_id,
        auth.uid(),
        p_rating,
        p_title,
        p_content,
        v_is_verified,
        p_images
    )
    RETURNING id INTO v_review_id;
    
    RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

-- Mark review as helpful
CREATE OR REPLACE FUNCTION mark_review_helpful(p_review_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO review_helpful_votes (review_id, user_id)
    VALUES (p_review_id, auth.uid())
    ON CONFLICT (review_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

-- Report review for moderation
CREATE OR REPLACE FUNCTION report_review(p_review_id UUID, p_reason TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        event,
        severity,
        description,
        metadata,
        user_id
    ) VALUES (
        'REVIEW_REPORTED',
        'medium',
        'User reported a review',
        jsonb_build_object(
            'review_id', p_review_id,
            'reason', p_reason
        ),
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

-- ============================================
-- 8. SEED DATA (FOR TESTING)
-- ============================================

-- Uncomment to add test reviews
/*
INSERT INTO product_reviews (product_id, user_id, rating, title, content, is_verified_purchase, is_approved)
SELECT 
    (SELECT id FROM products LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    (floor(random() * 5) + 1)::int,
    'Great product!',
    'I really enjoyed using this product. Highly recommended!',
    true,
    true;
*/

-- ============================================
-- END OF REVIEWS SYSTEM SCHEMA
-- ============================================
