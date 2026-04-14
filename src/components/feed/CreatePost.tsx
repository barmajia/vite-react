import { useState } from "react";
import { feedService } from "@/services/feedService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface CreatePostProps {
  onPostCreated: () => void;
}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<
    "announcement" | "product" | "update" | "promotion"
  >("announcement");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    try {
      setLoading(true);
      await feedService.createPost({
        content: content.trim(),
        post_type: postType,
      });
      setContent("");
      toast.success("Post created successfully!");
      onPostCreated();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to create post:", errorMessage);
      toast.error(errorMessage || "Could not create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-semibold">👤</span>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's new with your products? Share an announcement..."
              className="flex-1 resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Select
              value={postType}
              onValueChange={(v) => setPostType(v as "announcement" | "product" | "update" | "promotion")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">📢 Announcement</SelectItem>
                <SelectItem value="product">📦 New Product</SelectItem>
                <SelectItem value="update">🔄 Update</SelectItem>
                <SelectItem value="promotion">🏷️ Promotion</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" disabled={loading || !content.trim()}>
              {loading ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
