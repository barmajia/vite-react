// src/types/feed.ts

export interface Post {
  id: string;
  user_id: string;
  seller_id: string | null;
  product_id: string | null;
  content: string;
  media_urls: string[];
  post_type: 'announcement' | 'product' | 'update' | 'promotion';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author_full_name: string | null;
  author_avatar_url: string | null;
  author_account_type: string;
  is_verified: boolean;
  product_title: string | null;
  product_price: number | null;
  product_image: string | null;
  is_liked_by_user: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  likes_count: number;
  is_deleted: boolean;
  created_at: string;
  author_full_name: string | null;
  author_avatar_url: string | null;
}

export interface CreatePostInput {
  content: string;
  media_urls?: string[];
  post_type?: 'announcement' | 'product' | 'update' | 'promotion';
  product_id?: string;
}
