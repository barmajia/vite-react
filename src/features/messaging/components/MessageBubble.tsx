import { formatMessageTime } from '../lib/messaging-utils';
import type { Message } from '../types/messaging';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  otherUser?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const MessageBubble = ({ message, isOwn, otherUser }: MessageBubbleProps) => {
  return (
    <div className={cn('flex gap-3', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <img
            src={otherUser?.avatar_url || '/default-avatar.png'}
            alt={otherUser?.full_name || 'User'}
          />
        </Avatar>
      )}
      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2 max-w-full',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        </div>
        <div className={cn('flex items-center gap-2 mt-1 text-xs text-muted-foreground', isOwn ? 'justify-end' : 'justify-start')}>
          <span>{formatMessageTime(message.created_at)}</span>
          {isOwn && message.read_at && (
            <span className="text-primary">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
};
