# 💬 Complete Chat System Implementation Guide

**Date:** March 25, 2026  
**Status:** ✅ Complete  
**Version:** 1.0.0

---

## 📋 Overview

This is a **comprehensive, unified chat system** for the Aurora E-commerce Platform that supports all account types with context-aware conversations:

- **General Chat** - Regular user conversations
- **Trading Chat** - B2B negotiations and deals
- **Health Chat** - Doctor-patient communication
- **Services Chat** - Service provider-client communication
- **Product Chat** - Product inquiries

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── chat-types.ts              # TypeScript types and interfaces
│   └── chat-utils.ts              # Utility functions
│
├── hooks/
│   ├── useConversations.ts        # Fetch all conversations
│   └── useMessages.ts             # Send/receive messages
│
├── components/chat/
│   ├── ConversationItem.tsx       # Conversation list item
│   ├── MessageBubble.tsx          # Message display component
│   └── MessageInput.tsx           # Message input with attachments
│
└── pages/chat/
    ├── ChatLayout.tsx             # Main chat layout with sidebar
    ├── ChatWindow.tsx             # Individual chat window
    └── ConversationInfo.tsx       # Conversation details panel
```

---

## 🚀 Quick Start

### 1. Run SQL Migration

Go to **Supabase Dashboard → SQL Editor** and run:

```bash
# Run this file:
setup-chat-system.sql
```

This will:
- ✅ Enable realtime for all chat tables
- ✅ Create chat attachments storage bucket
- ✅ Set up RLS policies
- ✅ Create helper functions
- ✅ Add performance indexes

### 2. Access the Chat

Navigate to: **`/chat`** in your application

---

## 🎯 Features

### Core Features
- ✅ **Unified Inbox** - All conversations in one place
- ✅ **Real-time Messaging** - Instant message delivery
- ✅ **Multi-Context Support** - General, Trading, Health, Services, Product
- ✅ **File Attachments** - Images, documents, PDFs (max 10MB)
- ✅ **Message Status** - Sent, delivered, read receipts
- ✅ **Typing Indicators** - See when others are typing
- ✅ **Search Conversations** - Find messages quickly
- ✅ **Responsive Design** - Works on mobile and desktop

### Account Type Support
| Account Type | Chat Context | Features |
|--------------|-------------|----------|
| **Customer** | General, Product | Chat with sellers, support |
| **Seller** | General, Product | Customer support, negotiations |
| **Factory** | General, Product | B2B communications |
| **Middleman** | Trading | Deal negotiations |
| **Service Provider** | Services | Client communications |
| **Doctor** | Health | Patient consultations |
| **Patient** | Health | Doctor communications |
| **Delivery** | General | Coordination with customers |

---

## 📊 Component Details

### 1. ChatLayout (`/chat`)
Main chat interface with:
- **Sidebar** - Conversation list with search
- **Main Area** - Active chat window
- **Responsive** - Collapsible sidebar on mobile

### 2. ChatWindow
Individual conversation view:
- **Message Bubbles** - Styled sent/received messages
- **Attachments** - Image and file support
- **Real-time Updates** - Live message delivery
- **Read Receipts** - Double check marks
- **Message Actions** - Delete your messages

### 3. ConversationInfo
Side panel with:
- **User Profile** - Avatar, name, account type
- **Context Info** - Related products, appointments, services
- **Conversation Details** - Created date, last active
- **Actions** - Archive, block, report
- **Safety Tips** - Guidelines for safe communication

### 4. ConversationItem
List item showing:
- **User Avatar** - Profile picture or initials
- **User Name** - Other participant's name
- **Last Message** - Preview of latest message
- **Timestamp** - When last message was sent
- **Unread Badge** - Number of unread messages
- **Context Badge** - Type of conversation
- **Product/Service Info** - Related item details

### 5. MessageInput
Input area with:
- **Text Input** - Type messages (Enter to send)
- **File Upload** - Attach documents
- **Image Upload** - Send photos
- **Emoji Picker** - 24 common emojis
- **Send Button** - Animated when sending
- **Voice Message** - Coming soon

---

## 🔧 Usage Examples

### Starting a Conversation

```typescript
import { supabase } from '@/lib/supabase';

// Create or get existing conversation
const { data: conversationId, error } = await supabase.rpc(
  'create_direct_conversation',
  {
    p_target_user_id: targetUserId,
    p_context: 'general', // or 'trading', 'health', 'services', 'product'
    p_product_id: productId, // optional
    p_appointment_id: appointmentId, // optional
    p_listing_id: listingId // optional
  }
);

if (error) throw error;

// Navigate to chat
navigate(`/chat/${conversationId}`);
```

### Sending a Message

```typescript
import { useMessages } from '@/hooks/useMessages';

function ChatComponent({ conversationId }) {
  const { sendMessage } = useMessages({
    conversationId,
    context: 'general',
    currentUserId: user.id
  });

  // Send text message
  await sendMessage('Hello!', 'text');

  // Send image
  await sendMessage('image.jpg', 'image', imageUrl);

  // Send file
  await sendMessage('document.pdf', 'file', fileUrl);
}
```

### Fetching Conversations

```typescript
import { useConversations } from '@/hooks/useConversations';

function ConversationList() {
  const { conversations, loading, error } = useConversations(user.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {conversations.map(conv => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={activeConv?.id === conv.id}
          onClick={() => setActiveConversation(conv)}
        />
      ))}
    </div>
  );
}
```

---

## 🗄️ Database Schema

### Main Tables

#### conversations
```sql
- id: uuid (PK)
- product_id: uuid (FK → products)
- factory_id: uuid (FK → factories)
- context: text (general|trading|health|services|product)
- last_message: text
- last_message_at: timestamptz
- is_archived: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

#### conversation_participants
```sql
- conversation_id: uuid (FK → conversations)
- user_id: uuid (FK → users)
- role: text
- last_read_message_id: uuid
- is_muted: boolean
- joined_at: timestamptz
- PRIMARY KEY (conversation_id, user_id)
```

#### messages
```sql
- id: uuid (PK)
- conversation_id: uuid (FK → conversations)
- sender_id: uuid (FK → users)
- content: text
- message_type: text (text|image|file)
- attachment_url: text
- attachment_name: text
- attachment_size: numeric
- is_deleted: boolean
- read_at: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

### Specialized Tables

- **trading_conversations** - B2B deal discussions
- **trading_messages** - Trading conversation messages
- **health_conversations** - Medical consultations
- **health_messages** - Health chat messages
- **services_conversations** - Service bookings
- **services_messages** - Service chat messages

---

## 🛡️ Security

### RLS Policies

All chat tables have **Row Level Security** enabled:

#### Conversations
- Users can only view conversations they participate in
- Users can only insert messages to their conversations
- Service role can manage all for moderation

#### Messages
- Users can view messages in their conversations
- Users can insert their own messages
- Users can update (delete) their own messages
- Service role can moderate all content

#### Storage (Attachments)
- Authenticated users can upload to chat-attachments
- Anyone can view chat attachments (public bucket)
- Users can delete their own uploads

### Helper Functions

```sql
-- Get user conversations with product info
get_user_conversations_with_products(p_user_id uuid)

-- Create or get existing conversation
create_direct_conversation(
  p_target_user_id uuid,
  p_context text,
  p_product_id uuid,
  p_appointment_id uuid,
  p_listing_id uuid
)
```

---

## 🎨 Customization

### Context Badge Colors

Edit in `chat-utils.ts`:

```typescript
export function getContextBadgeColor(context: ConversationContext): string {
  const colors: Record<ConversationContext, string> = {
    general: 'bg-blue-100 text-blue-800',
    trading: 'bg-purple-100 text-purple-800',
    health: 'bg-green-100 text-green-800',
    services: 'bg-orange-100 text-orange-800',
    product: 'bg-indigo-100 text-indigo-800'
  };
  return colors[context] || colors.general;
}
```

### File Upload Limits

Edit in `chat-utils.ts`:

```typescript
const maxSize = 10 * 1024 * 1024; // 10MB
const allowedTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  // ... more types
];
```

---

## 🐛 Troubleshooting

### No Conversations Showing

1. **Check authentication:**
   ```typescript
   console.log('User:', user);
   ```

2. **Verify conversation_participants table:**
   ```sql
   SELECT * FROM conversation_participants 
   WHERE user_id = 'your-user-id';
   ```

3. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'conversation_participants';
   ```

### Messages Not Sending

1. **Check console for errors**
2. **Verify storage bucket exists:**
   ```sql
   SELECT * FROM storage.buckets 
   WHERE id = 'chat-attachments';
   ```

3. **Test upload manually:**
   ```typescript
   const { data, error } = await supabase.storage
     .from('chat-attachments')
     .upload('test.txt', new File(['test'], 'test.txt'));
   ```

### Realtime Not Working

1. **Verify realtime is enabled:**
   ```sql
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime';
   ```

2. **Check browser console for connection errors**
3. **Restart dev server**

---

## 📈 Performance

### Indexes Created

- `idx_messages_conversation_id` - Fast message lookup
- `idx_messages_created_at` - Ordered message retrieval
- `idx_conversation_participants_user_id` - User conversations
- `idx_conversations_last_message` - Sort by recent activity

### Optimization Tips

1. **Pagination** - Load messages in batches (50 at a time)
2. **Virtual Scrolling** - For conversations with 1000+ messages
3. **Image Lazy Loading** - Already implemented
4. **Debounce Search** - 300ms delay on search input

---

## 🔮 Future Enhancements

### Phase 2 (Coming Soon)
- [ ] Voice/Video Calls
- [ ] Voice Messages
- [ ] Message Reactions
- [ ] Message Replies/Threading
- [ ] Forward Messages
- [ ] Star/Favorite Messages

### Phase 3 (Future)
- [ ] Group Chats
- [ ] Broadcast Lists
- [ ] Chat Bots
- [ ] AI Auto-Responses
- [ ] Translation
- [ ] Scheduled Messages

---

## 📝 API Reference

### Hooks

| Hook | Parameters | Returns | Description |
|------|-----------|---------|-------------|
| `useConversations` | `userId: string` | `{ conversations, loading, error, refresh }` | Fetch all user conversations |
| `useMessages` | `{ conversationId, context, currentUserId }` | `{ messages, loading, sending, error, sendMessage, deleteMessage }` | Manage messages in a conversation |

### Utility Functions

| Function | Description |
|----------|-------------|
| `getContextTable(context)` | Get table name for conversation context |
| `getMessageTable(context)` | Get messages table for context |
| `formatMessageTime(date)` | Format timestamp for display |
| `formatMessageDate(date)` | Format date for message grouping |
| `uploadChatAttachment(file, conversationId)` | Upload file to storage |
| `getMessageTypeFromFile(file)` | Determine message type from file |
| `validateFile(file)` | Validate file before upload |

---

## ✅ Testing Checklist

- [ ] Create new conversation
- [ ] Send text message
- [ ] Send image attachment
- [ ] Send file attachment
- [ ] Receive real-time messages
- [ ] View read receipts
- [ ] Delete own message
- [ ] Search conversations
- [ ] Switch between conversations
- [ ] Mobile responsive layout
- [ ] Emoji picker works
- [ ] File upload validation
- [ ] Conversation info panel
- [ ] Context badges display correctly
- [ ] Unread message count updates

---

## 📚 Related Documentation

- [DATABASE_ERRORS_FIX.md](./DATABASE_ERRORS_FIX.md) - Database error fixes
- [CHAT_SYSTEM_README.md](./CHAT_SYSTEM_README.md) - Original chat system docs
- [UNIFIED_MESSAGING_SUMMARY.md](./UNIFIED_MESSAGING_SUMMARY.md) - Messaging architecture

---

## 🎯 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/chat` | `ChatLayout` | Main chat interface |
| `/chat/:conversationId` | `ChatLayout` | Specific conversation |
| `/messages` | `Inbox` | Legacy inbox (still works) |
| `/messages/:conversationId` | `ChatPage` | Legacy chat page |

---

## 💡 Tips

1. **Always use `.maybeSingle()`** when querying profile tables (they might not exist)
2. **Handle PGRST116 error** (not found) gracefully
3. **Use conversation_participants** to check user access to conversations
4. **Upload attachments before sending** message
5. **Mark messages as read** when conversation opens
6. **Clean up realtime subscriptions** in useEffect cleanup

---

**Status:** ✅ Production Ready  
**Last Updated:** March 25, 2026  
**Maintained By:** Development Team
