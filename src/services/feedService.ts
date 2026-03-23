// src/services/feedService.ts
import { supabase } from '@/lib/supabase';
import type { Post, PostComment, CreatePostInput } from '@/types/feed';

export const feedService = {
  /**
   * Get feed posts
   */
  getFeedPosts: async (params?: {
    limit?: number;
    offset?: number;
    userId?: string;
    postType?: string;
  }): Promise<Post[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.rpc('get_feed_posts', {
      p_limit: params?.limit || 20,
      p_offset: params?.offset || 0,
      p_user_id: params?.userId || user?.id || null,
      p_post_type: params?.postType || null,
    });

    if (error) {
      console.error('Error fetching feed posts:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Create a new post
   */
  createPost: async (input: CreatePostInput): Promise<Post> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        seller_id: user.id,
        content: input.content,
        media_urls: input.media_urls || [],
        post_type: input.post_type || 'announcement',
        product_id: input.product_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }
    return data;
  },

  /**
   * Like/unlike a post
   */
  toggleLike: async (postId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already liked
    const { data: existing, error: fetchError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existing) {
      // Unlike
      await supabase.from('post_likes').delete().eq('id', existing.id);
      return false;
    } else {
      // Like
      await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: user.id,
      });
      return true;
    }
  },

  /**
   * Add comment to post
   */
  addComment: async (postId: string, content: string): Promise<PostComment> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
    return data;
  },

  /**
   * Get comments for a post
   */
  getPostComments: async (postId: string): Promise<PostComment[]> => {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        author:user_id (full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Delete a post (soft delete)
   */
  deletePost: async (postId: string): Promise<void> => {
    await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', postId);
  },
};
