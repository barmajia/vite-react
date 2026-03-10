import { RouteObject } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Inbox } from '@/pages/messaging/Inbox';
import { Chat } from '@/pages/messaging/Chat';

// Simple authenticated route wrapper
function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  
  return children;
}

export const messagingRoutes: RouteObject[] = [
  {
    path: 'messages',
    element: (
      <AuthenticatedRoute>
        <Inbox />
      </AuthenticatedRoute>
    ),
  },
  {
    path: 'messages/:conversationId',
    element: (
      <AuthenticatedRoute>
        <Chat />
      </AuthenticatedRoute>
    ),
  },
];
