// Chat Utility Functions for Aurora E-commerce Platform
import { supabase } from '@/lib/supabase';
import type { ConversationContext, MessageType } from './chat-types';

/**
 * Get the appropriate table name based on conversation context
 */
export function getContextTable(context: ConversationContext): string {
  const tables: Record<ConversationContext, string> = {
    general: 'conversations',
    trading: 'trading_conversations',
    health: 'health_conversations',
    services: 'services_conversations',
    product: 'conversations'
  };
  return tables[context] || 'conversations';
}

/**
 * Get the appropriate messages table name based on conversation context
 */
export function getMessageTable(context: ConversationContext): string {
  const tables: Record<ConversationContext, string> = {
    general: 'messages',
    trading: 'trading_messages',
    health: 'health_messages',
    services: 'services_messages',
    product: 'messages'
  };
  return tables[context] || 'messages';
}

/**
 * Format message time for display
 */
export function formatMessageTime(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  } else {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

/**
 * Format message date for grouping
 */
export function formatMessageDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === now.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  }
}

/**
 * Upload a file to chat attachments storage
 */
export async function uploadChatAttachment(file: File, conversationId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `chat/${conversationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('chat-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Determine message type from file
 */
export function getMessageTypeFromFile(file: File): MessageType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'file';
  return 'file';
}

/**
 * Get file icon based on type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
  if (fileType.includes('zip') || fileType.includes('compressed')) return '📦';
  return '📎';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if user can send messages in a conversation
 */
export function canSendMessages(
  context: ConversationContext,
  currentUserId: string,
  conversation: any
): boolean {
  if (conversation.is_archived) return false;

  switch (context) {
    case 'health':
      // Only allow messages during active appointments
      return conversation.status === 'scheduled' || conversation.status === 'completed';
    case 'services':
      // Both provider and client can message
      return conversation.provider_id === currentUserId || conversation.client_id === currentUserId;
    case 'trading':
      // Both initiator and receiver can message
      return conversation.initiator_id === currentUserId || conversation.receiver_id === currentUserId;
    default:
      return true;
  }
}

/**
 * Get conversation partner info
 */
export function getConversationPartner(conversation: any, currentUserId: string) {
  if (conversation.context === 'trading') {
    const isInitiator = conversation.initiator_id === currentUserId;
    return {
      id: isInitiator ? conversation.receiver_id : conversation.initiator_id,
      role: isInitiator ? conversation.receiver_role : conversation.initiator_role
    };
  }

  if (conversation.context === 'services') {
    const isProvider = conversation.provider_id === currentUserId;
    return {
      id: isProvider ? conversation.client_id : conversation.provider_id,
      role: isProvider ? 'client' : 'service_provider'
    };
  }

  if (conversation.context === 'health') {
    const isDoctor = conversation.doctor_id === currentUserId;
    return {
      id: isDoctor ? conversation.patient_id : conversation.doctor_id,
      role: isDoctor ? 'patient' : 'doctor'
    };
  }

  // For general conversations, get from participants
  const participant = conversation.participants?.find(
    (p: any) => p.user_id !== currentUserId
  );
  return {
    id: participant?.user_id,
    role: participant?.role
  };
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/') && !file.type.startsWith('text/')) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

/**
 * Truncate message content for preview
 */
export function truncateMessage(content: string, maxLength: number = 50): string {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

/**
 * Get context badge color
 */
export function getContextBadgeColor(context: ConversationContext): string {
  const colors: Record<ConversationContext, string> = {
    general: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    trading: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    health: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    services: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    product: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  };
  return colors[context] || colors.general;
}

/**
 * Get context label
 */
export function getContextLabel(context: ConversationContext): string {
  const labels: Record<ConversationContext, string> = {
    general: 'Chat',
    trading: 'Trading',
    health: 'Health',
    services: 'Service',
    product: 'Product'
  };
  return labels[context] || 'Chat';
}
