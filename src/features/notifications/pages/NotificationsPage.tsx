import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from '../components/NotificationItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import type { NotificationType } from '@/types/database';

export function NotificationsPage() {
  const {
    notifications,
    isLoading,
    summary,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingRead,
    isMarkingAllRead,
    isDeleting,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | NotificationType>('all');

  const filteredNotifications = notifications?.filter(
    (n) => filter === 'all' || n.type === filter
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Notifications</h1>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {summary.unread} unread out of {summary.total} total
          </p>
        </div>
        {summary.unread > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAllRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({summary.total})
        </Button>
        <Button
          variant={filter === 'order_update' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('order_update')}
        >
          Orders ({summary.byType.order_update || 0})
        </Button>
        <Button
          variant={filter === 'message' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('message')}
        >
          Messages ({summary.byType.message || 0})
        </Button>
        <Button
          variant={filter === 'promotion' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('promotion')}
        >
          Promotions ({summary.byType.promotion || 0})
        </Button>
        <Button
          variant={filter === 'system' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('system')}
        >
          System ({summary.byType.system || 0})
        </Button>
      </div>

      {/* Notification List */}
      <div className="bg-surface rounded-lg border overflow-hidden">
        {filteredNotifications?.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
              <Bell className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No notifications</h2>
            <p className="text-muted-foreground">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          filteredNotifications?.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkRead={() => markAsRead(notif.id)}
              onDelete={() => deleteNotification(notif.id)}
              isMarkingRead={isMarkingRead}
              isDeleting={isDeleting}
            />
          ))
        )}
      </div>
    </div>
  );
}
