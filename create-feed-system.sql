-- ============================================
-- CREATE POSTS/ANNOUNCEMENTS TABLE FOR FEED
-- ============================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seller_id UUID,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]'::jsonb,
  post_type TEXT DEFAULT 'announcement'::TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create post comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_seller_id ON posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_posts_product_id ON posts(product_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR POSTS
-- ============================================

-- Posts: Anyone can view public posts
DROP POLICY IF EXISTS "posts_view_public" ON public.posts;
CREATE POLICY "posts_view_public" ON public.posts
FOR SELECT TO authenticated
USING (is_deleted = false);

DROP POLICY IF EXISTS "posts_view_public_anon" ON public.posts;
CREATE POLICY "posts_view_public_anon" ON public.posts
FOR SELECT TO anon
USING (is_deleted = false);

-- Posts: Users can create their own posts
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own" ON public.posts
FOR INSERT TO authenticated
WITH CHECK (true);

-- Posts: Users can update/delete their own posts
DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
CREATE POLICY "posts_update_own" ON public.posts
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;
CREATE POLICY "posts_delete_own" ON public.posts
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Post Likes: Anyone can view likes
DROP POLICY IF EXISTS "post_likes_view_public" ON public.post_likes;
CREATE POLICY "post_likes_view_public" ON public.post_likes
FOR SELECT TO authenticated
USING (true);

-- Post Likes: Users can create their own likes
DROP POLICY IF EXISTS "post_likes_insert_own" ON public.post_likes;
CREATE POLICY "post_likes_insert_own" ON public.post_likes
FOR INSERT TO authenticated
WITH CHECK (true);

-- Post Likes: Users can delete their own likes
DROP POLICY IF EXISTS "post_likes_delete_own" ON public.post_likes;
CREATE POLICY "post_likes_delete_own" ON public.post_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Post Comments: Anyone can view comments
DROP POLICY IF EXISTS "post_comments_view_public" ON public.post_comments;
CREATE POLICY "post_comments_view_public" ON public.post_comments
FOR SELECT TO authenticated
USING (is_deleted = false);

-- Post Comments: Users can create their own comments
DROP POLICY IF EXISTS "post_comments_insert_own" ON public.post_comments;
CREATE POLICY "post_comments_insert_own" ON public.post_comments
FOR INSERT TO authenticated
WITH CHECK (true);

-- Post Comments: Users can update/delete their own comments
DROP POLICY IF EXISTS "post_comments_update_own" ON public.post_comments;
CREATE POLICY "post_comments_update_own" ON public.post_comments
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "post_comments_delete_own" ON public.post_comments;
CREATE POLICY "post_comments_delete_own" ON public.post_comments
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- FUNCTION TO GET FEED POSTS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_feed_posts(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_user_id UUID DEFAULT NULL,
  p_post_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  seller_id UUID,
  product_id UUID,
  content TEXT,
  media_urls JSONB,
  post_type TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  created_at TIMESTAMPTZ,
  author_full_name TEXT,
  author_avatar_url TEXT,
  author_account_type TEXT,
  is_verified BOOLEAN,
  product_title TEXT,
  product_price NUMERIC,
  product_image TEXT,
  is_liked_by_user BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.seller_id,
    p.product_id,
    p.content,
    p.media_urls,
    p.post_type,
    p.likes_count,
    p.comments_count,
    p.shares_count,
    p.created_at,
    u.full_name AS author_full_name,
    u.avatar_url AS author_avatar_url,
    u.account_type AS author_account_type,
    COALESCE(s.is_verified, false) AS is_verified,
    prod.title AS product_title,
    prod.price AS product_price,
    (prod.images->>0) AS product_image,
    EXISTS (
      SELECT 1 FROM post_likes pl 
      WHERE pl.post_id = p.id AND pl.user_id = p_user_id
    ) AS is_liked_by_user
  FROM posts p
  LEFT JOIN public.users u ON u.user_id = p.user_id
  LEFT JOIN public.sellers s ON s.user_id = p.user_id
  LEFT JOIN public.products prod ON prod.id = p.product_id
  WHERE p.is_deleted = false
    AND (p_user_id IS NULL OR p.user_id = p_user_id)
    AND (p_post_type IS NULL OR p.post_type = p_post_type)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_feed_posts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_feed_posts TO anon;

-- ============================================
-- TRIGGER TO UPDATE POST STATS ON LIKE
-- ============================================

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count + 1, 0) WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes ON post_likes;
CREATE TRIGGER trigger_update_post_likes
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- ============================================
-- TRIGGER TO UPDATE POST STATS ON COMMENT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count + 1, 0) WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments ON post_comments;
CREATE TRIGGER trigger_update_post_comments
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- ============================================
-- Verification
-- ============================================
-- Test: SELECT * FROM public.get_feed_posts(20, 0, NULL, NULL);
