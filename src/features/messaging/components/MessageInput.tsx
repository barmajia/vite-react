import { useState, KeyboardEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingChange?: (typing: boolean) => void;
  isSending?: boolean;
}

export const MessageInput = ({ onSend, onTypingChange, isSending }: MessageInputProps) => {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (content.trim() && !isSending) {
      onSend(content);
      setContent('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTypingChange?.(e.target.value.length > 0);
  };

  return (
    <div className="flex gap-2">
      <Textarea
        value={content}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 resize-none min-h-[50px] max-h-[150px]"
        rows={1}
        disabled={isSending}
      />
      <Button
        onClick={handleSend}
        disabled={!content.trim() || isSending}
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};
