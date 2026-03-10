import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, X, ChevronUp, MapPin } from 'lucide-react';
import { useConversations } from '@/features/messaging';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatMessageTime } from '@/features/messaging/lib/messaging-utils';
import { StartConversationDialog } from './StartConversationDialog';
import { cn } from '@/lib/utils';

export const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const { conversations } = useConversations();
  const navigate = useNavigate();
  const unreadCount = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleConversationCreated = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {/* Chat Preview Panel */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 w-80 bg-background border rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-semibold">Messages</h3>
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleOpen}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* New Conversation Button */}
            <div className="p-3 border-b bg-muted/30">
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setShowNewConversation(true);
                }}
              >
                <MapPin className="h-4 w-4" />
                Find Nearby Sellers
              </Button>
            </div>

            {/* Recent Conversations */}
            <div className="max-h-80 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Find sellers near you to start chatting</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.slice(0, 5).map((conversation) => (
                    <Link
                      key={conversation.id}
                      to={`/messages/${conversation.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <img
                          src={conversation.otherUser?.avatar_url || '/default-avatar.png'}
                          alt={conversation.otherUser?.full_name || 'User'}
                        />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-medium text-sm truncate">
                            {conversation.otherUser?.full_name || 'Unknown User'}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {conversation.last_message_at
                              ? formatMessageTime(conversation.last_message_at)
                              : ''}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground flex-shrink-0">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - View All Link */}
            <div className="p-3 border-t bg-muted/30">
              <Link
                to="/messages"
                className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                onClick={() => setIsOpen(false)}
              >
                View all messages
                <ChevronUp className="h-4 w-4 rotate-90" />
              </Link>
            </div>
          </div>
        )}

        {/* FAB Button */}
        <Button
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            "hover:scale-110 hover:shadow-xl",
            isOpen && "rotate-90"
          )}
          onClick={toggleOpen}
          size="icon"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </>
          )}
        </Button>
      </div>

      {/* New Conversation Dialog */}
      <StartConversationDialog
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        onConversationCreated={handleConversationCreated}
      />
    </>
  );
};
