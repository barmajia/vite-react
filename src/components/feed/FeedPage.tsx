import { useEffect, useState, useCallback } from "react";
import { feedService } from "@/services/feedService";
import type { Post } from "@/types/feed";
import { CreatePost } from "./CreatePost";
import { PostItem } from "./PostItem";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feedService.getFeedPosts({
        limit: 20,
        postType: filter === "all" ? undefined : filter,
      });
      setPosts(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to load posts:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPosts();
  }, [filter, loadPosts]);

  const handlePostCreated = () => {
    loadPosts();
  };

  const handleLike = () => {
    loadPosts();
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Marketplace Feed</h1>
          <p className="text-muted-foreground">
            Stay updated with new products, announcements, and promotions
          </p>
        </div>

        {/* Filter Tabs */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="announcement">📢</TabsTrigger>
                <TabsTrigger value="product">📦</TabsTrigger>
                <TabsTrigger value="update">🔄</TabsTrigger>
                <TabsTrigger value="promotion">🏷️</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Create Post */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Posts List */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading posts...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {posts.map((post) => (
              <PostItem key={post.id} post={post} onLike={handleLike} />
            ))}
            {posts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No posts yet. Be the first to share!
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
