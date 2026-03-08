import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { Button } from '@/components/ui/button';

export function NotificationBadge() {
  const unreadCount = useUnreadNotifications();

  return (
    <Link to="/notifications" className="relative">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
