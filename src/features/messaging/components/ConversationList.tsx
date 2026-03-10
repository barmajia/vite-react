import { Link } from 'react-router-dom';
import { useConversations } from '../hooks/useConversations';
import { formatMessageTime, formatLastMessagePreview } from '../lib/messaging-utils';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export const ConversationList = () => {
  const { conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start a conversation from a product page
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            to={`/messages/${conversation.id}`}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-12 w-12">
              <img
                src={conversation.otherUser?.avatar_url || '/default-avatar.png'}
                alt={conversation.otherUser?.full_name || 'User'}
              />
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold truncate">
                  {conversation.otherUser?.full_name || 'Unknown User'}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {conversation.last_message_at
                    ? formatMessageTime(conversation.last_message_at)
                    : ''}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {formatLastMessagePreview(conversation.last_message || null)}
              </p>
            </div>
            {conversation.unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {conversation.unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </ScrollArea>
  );
};
