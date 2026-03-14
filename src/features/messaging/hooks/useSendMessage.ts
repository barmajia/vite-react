import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { SendMessageInput } from '../types/messaging';

export const useSendMessage = () => {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async ({
    conversationId,
    content,
    messageType = 'text',
    messageSubtype = 'text',
    attachmentUrl,
  }: SendMessageInput): Promise<boolean> => {
    if (!content.trim() && !attachmentUrl) {
      toast.error('Message cannot be empty');
      return false;
    }

    setIsSending(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError;

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim() || null,
        message_type: messageType,
        message_subtype: messageSubtype,
        attachment_url: attachmentUrl || null,
        read_at: null,
      });

      if (error) throw error;

      // Update conversation's last_message and last_message_at
      await supabase
        .from('conversations')
        .update({
          last_message: content.trim() || 'Attachment sent',
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      toast.success('Message sent');
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return { sendMessage, isSending };
};
