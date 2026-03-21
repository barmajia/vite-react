# Unified Messaging Architecture

## Current State Analysis

Your Aurora platform currently has **4 isolated messaging systems**:

| System | Tables | Route | Purpose |
|--------|--------|-------|---------|
| **Product/Trading** | `conversations`, `messages`, `trading_conversations`, `trading_messages` | `/messages` | Buyer-seller product discussions |
| **Services** | `services_conversations`, `services_messages` | `/services/messages` | Service provider-client communication |
| **Healthcare** | `health_conversations`, `health_messages` | `/services/health/consult/:id` | Doctor-patient medical consultations |
| **Factory Deals** | `conversations` + `conversation_deals` | `/messages` (with deals) | Factory-seller deal negotiations |

### Problems with Current Architecture

❌ **Code Duplication**: 4 separate chat UI components with 90% identical logic
❌ **Maintenance Overhead**: Changes must be replicated across 4 systems
❌ **Inconsistent UX**: Different features in different chat types
❌ **Database Complexity**: Multiple tables with similar structures
❌ **No Unified Inbox**: Users can't see all messages in one place

---

## Proposed Unified Architecture

### 1. Unified Database Schema

```sql
-- Single conversations table with type discriminator
CREATE TYPE conversation_context AS ENUM (
  'product',      -- Buyer-seller product chat
  'service',      -- Service provider-client
  'healthcare',   -- Doctor-patient consultation
  'factory',      -- Factory deal negotiation
  'support',      -- Customer support
  'general'       -- General user-to-user
);

CREATE TABLE unified_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Context & Type
  context conversation_context NOT NULL DEFAULT 'general',
  conversation_type TEXT DEFAULT 'general',
  
  -- Participants (always 2 users)
  user_id UUID NOT NULL REFERENCES auth.users(id),
  participant_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Context-specific references (nullable based on context)
  product_id UUID REFERENCES products(id),
  service_listing_id UUID REFERENCES service_listings(id),
  healthcare_appointment_id UUID REFERENCES health_appointments(id),
  factory_deal_id UUID REFERENCES deals(id),
  
  -- State
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Metadata (JSON for flexibility)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_context_product CHECK (
    context != 'product' OR product_id IS NOT NULL
  ),
  CONSTRAINT check_context_service CHECK (
    context != 'service' OR service_listing_id IS NOT NULL
  ),
  CONSTRAINT check_context_healthcare CHECK (
    context != 'healthcare' OR healthcare_appointment_id IS NOT NULL
  ),
  CONSTRAINT unique_conversation UNIQUE (user_id, participant_id, context, product_id, service_listing_id, healthcare_appointment_id)
);

-- Single messages table (all chat types)
CREATE TABLE unified_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES unified_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Content
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'image', 'file', 'system', 
    'deal_proposal', 'deal_counter', 'deal_accepted',
    'prescription', 'appointment_reminder'
  )),
  message_subtype TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size BIGINT,
  
  -- State
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata (reactions, edits, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Full-text search
  content_tsvector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(content, ''))
  ) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_unified_conv_user ON unified_conversations(user_id, updated_at DESC);
CREATE INDEX idx_unified_conv_participant ON unified_conversations(participant_id, updated_at DESC);
CREATE INDEX idx_unified_conv_context ON unified_conversations(context);
CREATE INDEX idx_unified_conv_product ON unified_conversations(product_id);
CREATE INDEX idx_unified_conv_service ON unified_conversations(service_listing_id);
CREATE INDEX idx_unified_conv_health ON unified_conversations(healthcare_appointment_id);

CREATE INDEX idx_unified_msg_conv ON unified_messages(conversation_id, created_at DESC);
CREATE INDEX idx_unified_msg_sender ON unified_messages(sender_id);
CREATE INDEX idx_unified_msg_search ON unified_messages USING GIN(content_tsvector);
CREATE INDEX idx_unified_msg_type ON unified_messages(message_type);
```

### 2. Unified Messaging Service

```typescript
// src/features/messaging/services/unified-messaging.service.ts
import { supabase } from '@/lib/supabase';
import type { ConversationContext, UnifiedConversation, UnifiedMessage } from '../types';

export interface CreateConversationParams {
  context: ConversationContext;
  participantId: string;
  productId?: string;
  serviceListingId?: string;
  healthcareAppointmentId?: string;
  factoryDealId?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageParams {
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system' | 'deal_proposal';
  attachmentUrl?: string;
  metadata?: Record<string, any>;
}

export class UnifiedMessagingService {
  /**
   * Get or create a conversation based on context
   */
  static async getOrCreateConversation(params: CreateConversationParams) {
    const { data: existing } = await this.findConversation(params);
    
    if (existing) {
      return existing;
    }

    return this.createConversation(params);
  }

  /**
   * Find existing conversation
   */
  static async findConversation(params: CreateConversationParams) {
    const query = supabase
      .from('unified_conversations')
      .select('*')
      .eq('user_id', params.participantId)
      .eq('participant_id', params.context === 'service' ? params.participantId : params.participantId)
      .eq('context', params.context);

    if (params.productId) query.eq('product_id', params.productId);
    if (params.serviceListingId) query.eq('service_listing_id', params.serviceListingId);
    if (params.healthcareAppointmentId) query.eq('healthcare_appointment_id', params.healthcareAppointmentId);

    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create new conversation
   */
  static async createConversation(params: CreateConversationParams) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('unified_conversations')
      .insert({
        user_id: user.id,
        participant_id: params.participantId,
        context: params.context,
        product_id: params.productId,
        service_listing_id: params.serviceListingId,
        healthcare_appointment_id: params.healthcareAppointmentId,
        factory_deal_id: params.factoryDealId,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Send message
   */
  static async sendMessage(params: SendMessageParams) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('unified_messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: user.id,
        content: params.content,
        message_type: params.messageType || 'text',
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's conversations with pagination
   */
  static async getConversations(options?: {
    context?: ConversationContext;
    limit?: number;
    offset?: number;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('unified_conversations')
      .select(`
        *,
        other_user:users!participant_id(id, full_name, avatar_url),
        product:products(id, title, price),
        service_listing:service_listings(id, title, price),
        appointment:health_appointments(id, scheduled_at),
        deal:deals(id, title, status)
      `, { count: 'exact' })
      .or(`user_id.eq.${user.id},participant_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (options?.context) {
      query = query.eq('context', options.context);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string, options?: {
    limit?: number;
    before?: string; // timestamp for pagination
  }) {
    let query = supabase
      .from('unified_messages')
      .select(`
        *,
        sender:users!sender_id(id, full_name, avatar_url)
      `, { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.before) {
      query = query.lt('created_at', options.before);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Subscribe to real-time messages
   */
  static subscribeToConversation(
    conversationId: string,
    callbacks: {
      onMessage?: (message: UnifiedMessage) => void;
      onTyping?: (userId: string) => void;
      onRead?: (messageId: string) => void;
    }
  ) {
    const channel = supabase
      .channel(`unified-messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'unified_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callbacks.onMessage?.(payload.new as UnifiedMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('unified_messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('conversation_id', conversationId)
      .eq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  /**
   * Get unread count per conversation
   */
  static async getUnreadCounts(conversationIds: string[], userId: string) {
    const { data, error } = await supabase
      .from('unified_messages')
      .select('conversation_id, count')
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false)
      .group('conversation_id');

    if (error) throw error;
    return data || [];
  }
}
```

### 3. Unified Types

```typescript
// src/features/messaging/types/unified.ts
export type ConversationContext = 
  | 'product'
  | 'service'
  | 'healthcare'
  | 'factory'
  | 'support'
  | 'general';

export type MessageType = 
  | 'text'
  | 'image'
  | 'file'
  | 'system'
  | 'deal_proposal'
  | 'deal_counter'
  | 'deal_accepted'
  | 'prescription'
  | 'appointment_reminder';

export interface UnifiedConversation {
  id: string;
  context: ConversationContext;
  conversation_type: string;
  user_id: string;
  participant_id: string;
  
  // Context references
  product_id?: string;
  service_listing_id?: string;
  healthcare_appointment_id?: string;
  factory_deal_id?: string;
  
  // State
  last_message: string | null;
  last_message_at: string | null;
  is_archived: boolean;
  metadata: Record<string, any>;
  
  // Relations
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  product?: {
    id: string;
    title: string;
    price: number;
  };
  service_listing?: {
    id: string;
    title: string;
    price: number;
  };
  appointment?: {
    id: string;
    scheduled_at: string;
  };
  deal?: {
    id: string;
    title: string;
    status: string;
  };
  
  // Computed
  unread_count?: number;
  context_label?: string;
}

export interface UnifiedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  message_subtype?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  is_read: boolean;
  read_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  
  // Relations
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface MessageMetadata {
  edited?: boolean;
  edited_at?: string;
  reactions?: Array<{
    emoji: string;
    user_id: string;
  }>;
  reply_to?: string; // message_id
  deal_data?: {
    offer_price: number;
    quantity: number;
    expires_at: string;
  };
  prescription_data?: {
    medicine_name: string;
    dosage: string;
    duration_days: number;
  };
}
```

### 4. Unified Chat UI Component

```typescript
// src/features/messaging/components/UnifiedChat.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UnifiedMessagingService } from '../services/unified-messaging.service';
import type { UnifiedConversation, UnifiedMessage } from '../types/unified';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConversationHeader } from './ConversationHeader';
import { ContextSpecificActions } from './ContextSpecificActions';

interface UnifiedChatProps {
  conversationId?: string;
  context?: 'product' | 'service' | 'healthcare' | 'factory';
  contextId?: string; // product_id, listing_id, etc.
}

export const UnifiedChat = ({ 
  conversationId, 
  context, 
  contextId 
}: UnifiedChatProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<UnifiedConversation | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Initialize or load conversation
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      loadMessages(conversationId);
      subscribeToConversation(conversationId);
    } else if (context && contextId && user) {
      initializeConversation(context, contextId);
    }
  }, [conversationId, context, contextId, user]);

  const loadConversation = async (id: string) => {
    try {
      const convs = await UnifiedMessagingService.getConversations();
      const conv = convs.find(c => c.id === id);
      if (conv) setConversation(conv);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeConversation = async (ctx: string, ctxId: string) => {
    try {
      const params: any = {
        context: ctx,
        participantId: 'TODO', // Get from context
      };

      if (ctx === 'product') params.productId = ctxId;
      if (ctx === 'service') params.serviceListingId = ctxId;
      if (ctx === 'healthcare') params.healthcareAppointmentId = ctxId;
      if (ctx === 'factory') params.factoryDealId = ctxId;

      const conv = await UnifiedMessagingService.getOrCreateConversation(params);
      setConversation(conv);
      navigate(`/messages/${conv.id}`);
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await UnifiedMessagingService.getMessages(convId, { limit: 50 });
      setMessages(msgs);
      await markAsRead(convId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToConversation = (convId: string) => {
    return UnifiedMessagingService.subscribeToConversation(convId, {
      onMessage: (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
        if (newMessage.sender_id !== user?.id) {
          markAsRead(convId);
        }
      },
    });
  };

  const markAsRead = async (convId: string) => {
    if (!user) return;
    try {
      await UnifiedMessagingService.markAsRead(convId, user.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendMessage = async (content: string, metadata?: any) => {
    if (!conversation || !content.trim()) return;
    
    setSending(true);
    try {
      await UnifiedMessagingService.sendMessage({
        conversationId: conversation.id,
        content,
        messageType: 'text',
        metadata,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div>Loading conversation...</div>;
  }

  if (!conversation) {
    return <div>Conversation not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader 
        conversation={conversation}
        onBack={() => navigate('/messages')}
      />
      
      <ContextSpecificActions 
        context={conversation.context}
        contextData={{
          product: conversation.product,
          service: conversation.service_listing,
          healthcare: conversation.appointment,
          factory: conversation.deal,
        }}
      />
      
      <MessageList 
        messages={messages}
        currentUserId={user?.id || ''}
      />
      
      <MessageInput 
        onSend={handleSendMessage}
        disabled={sending}
        context={conversation.context}
      />
    </div>
  );
};
```

### 5. Migration Strategy

```sql
-- Migration: Consolidate all messaging systems
-- Run this in stages during low-traffic period

-- Stage 1: Create unified tables (from section 1)
-- [Run unified schema creation SQL]

-- Stage 2: Migrate Product/Trading conversations
INSERT INTO unified_conversations (
  id, context, conversation_type, user_id, participant_id,
  product_id, last_message, last_message_at, is_archived, metadata,
  created_at, updated_at
)
SELECT 
  id, 'product', conversation_type,
  initiator_id, receiver_id,
  product_id, last_message, last_message_at, is_archived,
  jsonb_build_object('deal_id', deal_id),
  created_at, updated_at
FROM trading_conversations;

INSERT INTO unified_messages (
  conversation_id, sender_id, content, message_type,
  is_read, read_at, created_at
)
SELECT 
  tc.id, m.sender_id, m.content, m.message_type,
  m.is_read, m.read_at, m.created_at
FROM trading_messages m
JOIN trading_conversations tc ON m.conversation_id = tc.id;

-- Stage 3: Migrate Services conversations
INSERT INTO unified_conversations (
  id, context, user_id, participant_id, service_listing_id,
  last_message, last_message_at, metadata, created_at, updated_at
)
SELECT 
  id, 'service', provider_id, client_id, listing_id,
  last_message, last_message_at,
  jsonb_build_object(
    'is_read_by_provider', is_read_by_provider,
    'is_read_by_client', is_read_by_client
  ),
  created_at, updated_at
FROM services_conversations;

INSERT INTO unified_messages (
  conversation_id, sender_id, content, message_type,
  attachment_url, is_read, read_at, created_at
)
SELECT 
  conversation_id, sender_id, content, message_type,
  attachment_url, is_read, read_at, created_at
FROM services_messages;

-- Stage 4: Migrate Healthcare conversations
INSERT INTO unified_conversations (
  id, context, user_id, participant_id, healthcare_appointment_id,
  created_at, updated_at
)
SELECT 
  id, 'healthcare',
  (SELECT doctor_id FROM health_appointments WHERE id = hc.appointment_id),
  (SELECT patient_id FROM health_appointments WHERE id = hc.appointment_id),
  hc.appointment_id,
  hc.created_at, hc.updated_at
FROM health_conversations hc;

INSERT INTO unified_messages (
  conversation_id, sender_id, content, message_type,
  attachment_url, created_at
)
SELECT 
  hm.conversation_id, hm.sender_id, hm.content, hm.message_type,
  hm.attachment_url, hm.created_at
FROM health_messages hm
JOIN health_conversations hc ON hm.conversation_id = hc.id;

-- Stage 5: Update RLS policies
-- [Create comprehensive RLS policies for unified tables]

-- Stage 6: Create views for backward compatibility
CREATE VIEW trading_conversations AS
SELECT * FROM unified_conversations WHERE context = 'product';

CREATE VIEW services_conversations AS
SELECT * FROM unified_conversations WHERE context = 'service';

CREATE VIEW health_conversations AS
SELECT * FROM unified_conversations WHERE context = 'healthcare';

-- Stage 7: Deploy new unified UI
-- [Update frontend to use UnifiedChat component]

-- Stage 8: Monitor and verify
-- [Check data integrity, run tests]

-- Stage 9: Deprecate old tables (after 30 days)
-- DROP TABLE trading_conversations CASCADE;
-- DROP TABLE trading_messages CASCADE;
-- DROP TABLE services_conversations CASCADE;
-- DROP TABLE services_messages CASCADE;
-- DROP TABLE health_conversations CASCADE;
-- DROP TABLE health_messages CASCADE;
```

### 6. Benefits of Unified Architecture

✅ **Single Source of Truth**: One conversation table, one message table
✅ **Unified Inbox**: Users see all messages in one place with filtering
✅ **Consistent UX**: Same chat experience across all contexts
✅ **Easier Maintenance**: One codebase to update
✅ **Better Analytics**: Cross-context messaging insights
✅ **Scalable**: Easy to add new contexts (support, general, etc.)
✅ **Backward Compatible**: Views maintain old API for gradual migration

---

## Implementation Roadmap

### Week 1: Database Setup
- [ ] Create unified tables
- [ ] Write migration scripts
- [ ] Test data migration with production snapshot
- [ ] Create RLS policies

### Week 2: Backend Services
- [ ] Implement `UnifiedMessagingService`
- [ ] Write unit tests
- [ ] Create RPC functions for common operations
- [ ] Set up real-time subscriptions

### Week 3: Frontend Components
- [ ] Build `UnifiedChat` component
- [ ] Create context-specific action panels
- [ ] Update conversation list with context badges
- [ ] Implement unified inbox

### Week 4: Migration & Testing
- [ ] Run migration in staging
- [ ] Test all chat scenarios
- [ ] Performance testing
- [ ] Security audit

### Week 5: Gradual Rollout
- [ ] Deploy to 10% of users
- [ ] Monitor errors and performance
- [ ] Gradually increase to 100%
- [ ] Deprecate old system after 30 days

---

## Next Steps

1. **Review this architecture** with your team
2. **Approve the schema design**
3. **Create a test Supabase project** for migration testing
4. **Start with Week 1 tasks**

Would you like me to:
- Create the complete SQL migration file?
- Implement the full `UnifiedMessagingService`?
- Build the unified UI components?
- Create the RLS policies?
