import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Format time distance
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Icon mapping for different notification types
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "booking_request":
      return "📅";
    case "booking_confirmed":
      return "✅";
    case "booking_cancelled":
      return "❌";
    case "order":
      return "📦";
    case "message":
      return "💬";
    case "review_received":
      return "⭐";
    case "system":
      return "⚙️";
    case "promotion":
      return "🎉";
    case "product":
      return "🛍️";
    default:
      return "🔔";
  }
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
  } = useNotifications();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    toast.success("Notification deleted");
  };

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    markAsRead(notification.id);
    if (notification.metadata?.action_url) {
      navigate(notification.metadata.action_url);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notifications
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "Stay updated with your bookings, orders, and messages."}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No notifications yet
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">
                When you get new bookings, orders, or messages, they'll appear
                here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    group flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all
                    ${
                      !notification.is_read
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                        : "bg-card hover:bg-accent"
                    }
                  `}
                >
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`font-semibold text-sm ${!notification.is_read ? "text-blue-700 dark:text-blue-400" : ""}`}
                      >
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>

                    {/* Action Button based on type */}
                    {notification.type === "booking_request" &&
                      notification.metadata?.action_url && (
                        <Button
                          size="sm"
                          className="mt-2"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(notification.metadata!.action_url);
                          }}
                        >
                          View Booking Request
                        </Button>
                      )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => handleDelete(e, notification.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
