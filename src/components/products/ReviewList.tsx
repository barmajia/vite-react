/**
 * Review List Component
 * 
 * Displays product reviews with sorting and pagination
 */

import { useState } from "react";
import { Star, ThumbsUp, MessageSquare, Calendar, User, Verified } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews, useMarkHelpful, type Review } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";

interface ReviewListProps {
  productId: string;
  onWriteReview?: () => void;
}

export function ReviewList({ productId, onWriteReview }: ReviewListProps) {
  const [sortBy, setSortBy] = useState<"created_at" | "rating" | "helpful">("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useReviews({
    productId,
    limit,
    offset: (page - 1) * limit,
    sortBy,
    sortOrder,
  });

  const markHelpful = useMarkHelpful();

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load reviews</p>
      </div>
    );
  }

  const reviews = data?.reviews || [];
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && stats.review_count > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Rating */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold">{stats.average_rating.toFixed(1)}</p>
                  <div className="flex gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(stats.average_rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.review_count} {stats.review_count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Breakdown */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.rating_breakdown[rating as keyof typeof stats.rating_breakdown];
                  const percentage = stats.review_count > 0 ? (count / stats.review_count) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Write Review Button */}
      {onWriteReview && (
        <div className="flex justify-end">
          <Button onClick={onWriteReview}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        </div>
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {reviews.length} of {stats?.review_count || 0} reviews
          </p>
          <div className="flex gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split("-") as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setPage(1);
              }}
              className="text-sm border rounded-md px-2 py-1 bg-background"
            >
              <option value="created_at-DESC">Most Recent</option>
              <option value="created_at-ASC">Oldest First</option>
              <option value="rating-DESC">Highest Rating</option>
              <option value="rating-ASC">Lowest Rating</option>
              <option value="helpful-DESC">Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No reviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to review this product
            </p>
            {onWriteReview && (
              <Button onClick={onWriteReview} className="mt-4">
                Write a Review
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onMarkHelpful={() => markHelpful.mutate(review.id)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {reviews.length > 0 && stats && stats.review_count > limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {Math.ceil(stats.review_count / limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(stats.review_count / limit)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// Individual Review Card
function ReviewCard({ review, onMarkHelpful }: { review: Review; onMarkHelpful: () => void }) {
  const [helpfulClicked, setHelpfulClicked] = useState(false);

  const handleHelpful = () => {
    if (!helpfulClicked) {
      setHelpfulClicked(true);
      onMarkHelpful();
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {review.user_avatar ? (
                <img src={review.user_avatar} alt={review.user_name} className="h-10 w-10 rounded-full" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium">{review.user_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            {review.is_verified_purchase && (
              <Badge variant="secondary" className="text-xs">
                <Verified className="h-3 w-3 mr-1" />
                Verified Purchase
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        {review.title && (
          <p className="font-semibold">{review.title}</p>
        )}
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {review.content}
        </p>

        {/* Images */}
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2">
            {review.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Review image ${i + 1}`}
                className="h-20 w-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
          </div>
        )}

        {/* Helpful Button */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHelpful}
            disabled={helpfulClicked}
            className="text-xs"
          >
            <ThumbsUp className={`h-3 w-3 mr-1 ${helpfulClicked ? "fill-primary text-primary" : ""}`} />
            Helpful ({review.helpful_count + (helpfulClicked ? 1 : 0)})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
