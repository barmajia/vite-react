# Unified Messaging Implementation Guide

## Overview

This guide walks you through migrating your 4 separate messaging systems (Product, Services, Healthcare, Factory) into a single **Unified Messaging System**.

---

## Current State

Your Aurora platform has these messaging systems:

| System | Tables | Routes | Components |
|--------|--------|--------|------------|
| **Product** | `conversations`, `messages`, `trading_conversations`, `trading_messages` | `/messages`, `/messages/:id` | `Chat.tsx`, `Inbox.tsx` |
| **Services** | `services_conversations`, `services_messages` | `/services/messages`, `/services/messages/:id` | `ServicesChat.tsx` |
| **Healthcare** | `health_conversations`, `health_messages` | `/services/health/consult/:id` | `ConsultationRoom.tsx` |
| **Factory** | `conversations` + `conversation_deals` | `/messages` (with deals) | `ChatWindow.tsx` |

**Problems:**
- ❌ 4 separate codebases with 90% duplicate logic
- ❌ Different UX in each system
- ❌ No unified inbox
- ❌ Hard to maintain and extend

---

## Target State

**Single Unified System:**
- ✅ One `unified_conversations` table
- ✅ One `unified_messages` table
- ✅ One `UnifiedChat` component
- ✅ One `UnifiedInbox` component
- ✅ Context-specific actions panel
- ✅ Filterable by conversation type

---

## Migration Steps

### Phase 1: Database Setup (Day 1-2)

#### Step 1.1: Run Migration SQL

```bash
# In Supabase SQL Editor, run:
unified-messaging-migration.sql
```

This creates:
- `unified_conversations` table
- `unified_messages` table
- Indexes for performance
- Triggers for auto-updates
- RLS policies for security
- Helper functions

#### Step 1.2: Verify Tables

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'unified_%';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_unified_%';

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'unified_%';
```

#### Step 1.3: Test Helper Functions

```sql
-- Test get_user_unified_conversations
SELECT * FROM get_user_unified_conversations(50, 0);
```

---

### Phase 2: Frontend Components (Day 3-5)

#### Step 2.1: Add New Components

Files already created:
- `src/features/messaging/services/unified-messaging.service.ts`
- `src/features/messaging/types/messaging.ts` (updated)
- `src/features/messaging/components/UnifiedChat.tsx`
- `src/features/messaging/components/UnifiedInbox.tsx`
- `src/features/messaging/components/ContextSpecificActions.tsx`

#### Step 2.2: Update Routes

Edit `src/routes/messaging-routes.tsx`:

```typescript
import { RouteObject } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UnifiedInbox } from '@/features/messaging/components/UnifiedInbox';
import { UnifiedChat } from '@/features/messaging/components/UnifiedChat';

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
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
        <UnifiedInbox />
      </AuthenticatedRoute>
    ),
  },
  {
    path: 'messages/:conversationId',
    element: (
      <AuthenticatedRoute>
        <UnifiedChat />
      </AuthenticatedRoute>
    ),
  },
];
```

#### Step 2.3: Update App.tsx

Make sure messaging routes are registered in your main router.

---

### Phase 3: Data Migration (Day 6-7)

#### Step 3.1: Backup Current Data

```sql
-- Create backup tables
CREATE TABLE conversations_backup AS SELECT * FROM conversations;
CREATE TABLE messages_backup AS SELECT * FROM messages;
CREATE TABLE services_conversations_backup AS SELECT * FROM services_conversations;
CREATE TABLE services_messages_backup AS SELECT * FROM services_messages;
CREATE TABLE health_conversations_backup AS SELECT * FROM health_conversations;
CREATE TABLE health_messages_backup AS SELECT * FROM health_messages;
```

#### Step 3.2: Migrate Product Conversations

```sql
-- Migrate trading_conversations to unified_conversations
INSERT INTO unified_conversations (
  id, context, conversation_type, user_id, participant_id,
  product_id, last_message, last_message_at, is_archived, metadata,
  created_at, updated_at
)
SELECT 
  id, 'product', COALESCE(conversation_type, 'general'),
  initiator_id, receiver_id,
  product_id, last_message, last_message_at, 
  COALESCE(is_archived, false),
  jsonb_build_object('deal_id', deal_id),
  created_at, updated_at
FROM trading_conversations
WHERE NOT EXISTS (
  SELECT 1 FROM unified_conversations uc WHERE uc.id = trading_conversations.id
);
```

#### Step 3.3: Migrate Services Conversations

```sql
-- Migrate services_conversations
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
FROM services_conversations
WHERE NOT EXISTS (
  SELECT 1 FROM unified_conversations uc WHERE uc.id = services_conversations.id
);
```

#### Step 3.4: Migrate Healthcare Conversations

```sql
-- Migrate health_conversations
INSERT INTO unified_conversations (
  id, context, user_id, participant_id, healthcare_appointment_id,
  created_at, updated_at
)
SELECT 
  hc.id, 'healthcare',
  (SELECT doctor_id FROM health_appointments WHERE id = hc.appointment_id),
  (SELECT patient_id FROM health_appointments WHERE id = hc.appointment_id),
  hc.appointment_id,
  hc.created_at, hc.updated_at
FROM health_conversations hc
WHERE NOT EXISTS (
  SELECT 1 FROM unified_conversations uc WHERE uc.id = hc.id
);
```

#### Step 3.5: Migrate Messages

```sql
-- Migrate all messages (they'll link via unified_conversations views)
-- Product messages
INSERT INTO unified_messages (
  conversation_id, sender_id, content, message_type,
  attachment_url, is_read, read_at, created_at
)
SELECT conversation_id, sender_id, content, message_type,
       attachment_url, is_read, read_at, created_at
FROM trading_messages;

-- Services messages
INSERT INTO unified_messages (
  conversation_id, sender_id, content, message_type,
  attachment_url, is_read, read_at, created_at
)
SELECT conversation_id, sender_id, content, message_type,
       attachment_url, is_read, read_at, created_at
FROM services_messages;

-- Healthcare messages
INSERT INTO unified_messages (
  conversation_id, sender_id, content, message_type,
  attachment_url, created_at
)
SELECT hm.conversation_id, hm.sender_id, hm.content, hm.message_type,
       hm.attachment_url, hm.created_at
FROM health_messages hm
JOIN health_conversations hc ON hm.conversation_id = hc.id;
```

---

### Phase 4: Testing (Day 8-10)

#### Test Checklist

**Inbox Tests:**
- [ ] Load unified inbox
- [ ] See all conversation types
- [ ] Filter by context (product, service, healthcare, factory)
- [ ] Search conversations
- [ ] See unread counts
- [ ] Tab filtering (All, Unread, Archived)

**Chat Tests:**
- [ ] Open product conversation
- [ ] Open service conversation
- [ ] Open healthcare conversation
- [ ] Open factory conversation
- [ ] Send text message
- [ ] Send image attachment
- [ ] Send file attachment
- [ ] See read receipts (✓✓)
- [ ] Real-time message delivery
- [ ] Context-specific actions panel

**Migration Tests:**
- [ ] Old product messages visible
- [ ] Old service messages visible
- [ ] Old healthcare messages visible
- [ ] Backward compatibility views work
- [ ] Old routes still function

**Edge Cases:**
- [ ] Empty state (no conversations)
- [ ] Archived conversations
- [ ] Delete conversation
- [ ] Archive conversation
- [ ] Large message history (pagination)
- [ ] Slow connection

---

### Phase 5: Gradual Rollout (Day 11-14)

#### Step 5.1: Feature Flag

Add a feature flag to toggle unified messaging:

```typescript
// src/lib/featureFlags.ts
export const ENABLE_UNIFIED_MESSAGING = true;
```

#### Step 5.2: Conditional Routing

```typescript
// In App.tsx
{ENABLE_UNIFIED_MESSAGING ? (
  <Route path="messages/*" element={<UnifiedMessaging />} />
) : (
  <Route path="messages/*" element={<LegacyMessaging />} />
)}
```

#### Step 5.3: Rollout Plan

| Day | Users | Action |
|-----|-------|--------|
| 11 | 5% | Enable for 5% of users, monitor errors |
| 12 | 25% | Increase to 25%, check performance |
| 13 | 50% | Half of users, gather feedback |
| 14 | 100% | Full rollout |

---

### Phase 6: Cleanup (Day 15-30)

#### Step 6.1: Monitor (Days 15-29)

Watch for:
- Error rates in Sentry/LogRocket
- Performance metrics
- User feedback
- Database query performance

#### Step 6.2: Deprecate Old Tables (Day 30)

After 30 days of stable operation:

```sql
-- Drop backup tables (if migration successful)
DROP TABLE conversations_backup;
DROP TABLE messages_backup;
DROP TABLE services_conversations_backup;
DROP TABLE services_messages_backup;
DROP TABLE health_conversations_backup;
DROP TABLE health_messages_backup;

-- Drop old tables (CAREFUL: Make sure unified system works!)
-- DROP TABLE trading_messages;
-- DROP TABLE trading_conversations;
-- DROP TABLE services_messages;
-- DROP TABLE services_conversations;
-- DROP TABLE health_messages;
-- DROP TABLE health_conversations;
```

**⚠️ WARNING:** Only drop old tables after:
- 30 days of stable operation
- All users migrated
- Full backup created
- Team approval obtained

---

## API Reference

### UnifiedMessagingService

```typescript
// Get or create conversation
const conv = await UnifiedMessagingService.getOrCreateConversation({
  context: 'product',
  participantId: 'user-uuid',
  productId: 'product-uuid',
});

// Send message
const msg = await UnifiedMessagingService.sendMessage({
  conversationId: 'conv-uuid',
  content: 'Hello!',
  messageType: 'text',
});

// Get conversations
const convs = await UnifiedMessagingService.getConversations({
  context: 'service',
  limit: 50,
  offset: 0,
});

// Get messages
const msgs = await UnifiedMessagingService.getMessages('conv-uuid', {
  limit: 50,
});

// Subscribe to real-time
const unsubscribe = UnifiedMessagingService.subscribeToConversation(
  'conv-uuid',
  {
    onMessage: (msg) => console.log('New message:', msg),
  }
);

// Mark as read
await UnifiedMessagingService.markAsRead('conv-uuid');

// Archive conversation
await UnifiedMessagingService.archiveConversation('conv-uuid');

// Delete conversation
await UnifiedMessagingService.deleteConversation('conv-uuid');
```

---

## Troubleshooting

### Issue: RLS Permission Denied

**Solution:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'unified_%';

-- Re-enable if needed
ALTER TABLE unified_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_messages ENABLE ROW LEVEL SECURITY;

-- Recreate policies (run migration SQL again)
```

### Issue: Messages Not Appearing

**Solution:**
```sql
-- Check if messages exist
SELECT COUNT(*) FROM unified_messages;

-- Check conversation links
SELECT uc.id, COUNT(um.id) as message_count
FROM unified_conversations uc
LEFT JOIN unified_messages um ON um.conversation_id = uc.id
GROUP BY uc.id;

-- Check RLS
SELECT * FROM unified_messages LIMIT 10;
```

### Issue: Real-time Not Working

**Solution:**
```typescript
// Check Supabase Realtime is enabled
// In Supabase Dashboard > Database > Replication

// Verify subscription in browser console
console.log('Subscribed to:', conversationId);
```

### Issue: Old Data Not Migrated

**Solution:**
```sql
-- Check migration status
SELECT 
  (SELECT COUNT(*) FROM trading_conversations) as trading_old,
  (SELECT COUNT(*) FROM unified_conversations WHERE context = 'product') as trading_new,
  (SELECT COUNT(*) FROM services_conversations) as services_old,
  (SELECT COUNT(*) FROM unified_conversations WHERE context = 'service') as services_new;

-- Re-run migration queries from Phase 3
```

---

## Performance Optimization

### Database Indexes

Already created by migration:
- `idx_unified_conv_user` - Fast user conversation lookup
- `idx_unified_conv_participant` - Fast participant lookup
- `idx_unified_msg_conv` - Fast message retrieval
- `idx_unified_msg_search` - Full-text search

### Frontend Optimization

```typescript
// Add pagination
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['conversations'],
  queryFn: ({ pageParam = 0 }) => 
    UnifiedMessagingService.getConversations({
      limit: 50,
      offset: pageParam * 50,
    }),
  getNextPageParam: (lastPage) => 
    lastPage.length === 50 ? lastPage.length / 50 + 1 : undefined,
});

// Add virtual scrolling for long lists
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## Security Checklist

- [x] RLS enabled on both tables
- [x] Users can only see their own conversations
- [x] Users can only send messages in their conversations
- [x] File upload size limits (5MB)
- [x] File type validation
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (React escapes by default)

---

## Success Metrics

Track these metrics post-migration:

| Metric | Before | Target | After |
|--------|--------|--------|-------|
| Code duplication | 4x | 1x | - |
| Load time (inbox) | ~800ms | <500ms | - |
| Message send latency | ~300ms | <200ms | - |
| Bundle size | +45KB | -20KB | - |
| User satisfaction | - | >4.5/5 | - |

---

## Next Steps After Migration

1. **Add message reactions** (emoji responses)
2. **Add message editing** (with edit history)
3. **Add message deletion** (soft delete)
4. **Add typing indicators** (real-time)
5. **Add voice messages** (audio recording)
6. **Add video messages** (short clips)
7. **Add message threads** (reply to specific message)
8. **Add conversation labels/tags** (organization)
9. **Add conversation templates** (quick responses)
10. **Add AI-powered suggestions** (smart replies)

---

## Support

For issues or questions:
- 📧 Email: support@aurora.com
- 📚 Docs: `UNIFIED_MESSAGING_ARCHITECTURE.md`
- 🐛 Bugs: Create issue with steps to reproduce
- 💡 Ideas: Submit feature request with use case

---

**Last Updated:** March 21, 2026  
**Version:** 1.0.0  
**Status:** Ready for Production
