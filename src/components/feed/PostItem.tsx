import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { feedService } from "@/services/feedService";
import type { Post } from "@/types/feed";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, MessageSquare, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface PostItemProps {
  post: Post;
  onLike: () => void;
}

export const PostItem = ({ post, onLike }: PostItemProps) => {
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await feedService.toggleLike(post.id);
      onLike();
    } catch (error: any) {
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const comment = await feedService.addComment(post.id, commentText.trim());
      setComments([...comments, comment]);
      setCommentText("");
      onLike(); // Refresh post stats
      toast.success("Comment added");
    } catch (error: any) {
      toast.error("Failed to add comment");
    }
  };

  const handleLoadComments = async () => {
    try {
      const data = await feedService.getPostComments(post.id);
      setComments(data);
      setShowComments(!showComments);
    } catch (error: any) {
      toast.error("Failed to load comments");
    }
  };

  const handleAuthorClick = () => {
    navigate(`/profile/${post.user_id}`);
  };

  const handleProductClick = () => {
    if (post.product_id) {
      navigate(`/product/${post.product_id}`);
    }
  };

  const handleChatClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigate(`/factory/start-chat`);
      toast.info("Navigate to chat and select this user");
    } catch (error: any) {
      toast.error("Failed to start chat");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* Post Header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            className="h-10 w-10 cursor-pointer"
            onClick={handleAuthorClick}
          >
            {post.author_avatar_url ? (
              <img
                src={post.author_avatar_url}
                alt={post.author_full_name || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
                {post.author_full_name?.charAt(0) || "U"}
              </div>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3
                className="font-semibold cursor-pointer hover:underline"
                onClick={handleAuthorClick}
              >
                {post.author_full_name || "Unknown User"}
              </h3>
              {post.is_verified && (
                <CheckCircle className="h-3 w-3 text-green-600" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(post.created_at)} •{" "}
              <span className="capitalize">{post.post_type}</span>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Product Attachment */}
        {post.product_image && (
          <div className="mb-3 cursor-pointer" onClick={handleProductClick}>
            <div className="border rounded-lg overflow-hidden">
              <img
                src={post.product_image}
                alt={post.product_title || "Product"}
                className="w-full h-48 object-cover"
              />
              <div className="p-3 bg-muted">
                <h4 className="font-semibold text-sm mb-1">
                  {post.product_title}
                </h4>
                <p className="text-primary font-bold">
                  ${Number(post.product_price || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between border-t border-b py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={post.is_liked_by_user ? "text-red-500" : ""}
          >
            <Heart
              className={`h-4 w-4 mr-2 ${
                post.is_liked_by_user ? "fill-current" : ""
              }`}
            />
            {post.likes_count}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleLoadComments}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {post.comments_count}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleChatClick}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <Button size="sm" onClick={handleAddComment}>
                Post
              </Button>
            </div>

            <ScrollArea className="h-40">
              <div className="space-y-2">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="text-sm p-2 bg-muted rounded"
                    >
                      <span className="font-semibold">
                        {comment.author_full_name || "User"}:{" "}
                      </span>
                      {comment.content}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
