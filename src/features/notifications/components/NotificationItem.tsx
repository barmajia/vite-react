import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, ShoppingBag, Tag, Package, X } from 'lucide-react';
import type { Notification } from '@/types/database';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
  isMarkingRead?: boolean;
  isDeleting?: boolean;
}

const typeIcons: Record<string, any> = {
  order_update: ShoppingBag,
  product: Package,
  message: MessageSquare,
  promotion: Tag,
  system: Bell,
  review: Package,
};

const typeColors: Record<string, string> = {
  order_update: 'bg-blue-500',
  product: 'bg-green-500',
  message: 'bg-purple-500',
  promotion: 'bg-orange-500',
  system: 'bg-gray-500',
  review: 'bg-pink-500',
};

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  isMarkingRead,
  isDeleting,
}: NotificationItemProps) {
  const Icon = notification.type ? typeIcons[notification.type] : Bell;
  const colorClass = notification.type ? typeColors[notification.type] : 'bg-gray-500';

  const timeAgo = new Date(notification.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex gap-4 p-4 border-b last:border-b-0 transition-colors ${
        notification.is_read ? 'bg-surface' : 'bg-accent/5'
      }`}
    >
      {/* Icon */}
      <div className={`shrink-0 w-10 h-10 rounded-full ${colorClass} flex items-center justify-center`}>
        <Icon className="h-5 w-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={`font-medium ${!notification.is_read ? 'text-accent' : ''}`}>
              {notification.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkRead}
                disabled={isMarkingRead}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Mark as read</span>
                <div className="w-2 h-2 rounded-full bg-accent" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-2">
          {notification.type && (
            <Badge variant="outline" className="text-xs">
              {notification.type}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
          {notification.metadata?.link && (
            <Link
              to={notification.metadata.link}
              className="text-xs text-accent hover:underline"
            >
              View →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
