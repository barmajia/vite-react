# 🌌 AuroraChat: Complete Implementation Guide

**Version:** 1.0.0  
**Date:** March 30, 2026  
**Status:** ✅ Ready for Production

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [File Structure](#file-structure)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [TypeScript Types](#typescript-types)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## 📖 Overview

AuroraChat is a **unified conversation system** that allows any account type in your Aurora platform to communicate with any other account type. It's designed to work seamlessly with your existing multi-vertical e-commerce platform.

### Supported Account Types

- 👤 **user** - General users
- 🛒 **customer** - Product buyers
- 🏪 **seller** - Product sellers
- 🏭 **factory** - Manufacturing providers
- 💼 **middleman** - Trade facilitators
- 🛠️ **freelancer** - Service providers
- 🚚 **delivery_driver** - Logistics
- 👨‍⚕️ **doctor** - Healthcare providers
- 🧑‍🤝‍🧑 **patient** - Healthcare recipients
- 💊 **pharmacy** - Medical suppliers
- 🔧 **service_provider** - General services
- 👑 **admin** - Platform administrators

### Key Features

| Feature | Description |
|---------|-------------|
| **Smart Room Creation** | Automatically checks if conversation exists before creating |
| **Account Type Detection** | Auto-populates account types via database triggers |
| **Secure by Default** | Row Level Security (RLS) policies protect all data |
| **Real-time Updates** | Supabase realtime for instant message delivery |
| **Direct & Group Chats** | Support for both 1-on-1 and group conversations |
| **Context Aware** | Supports multiple chat contexts (ecommerce, health, trading, etc.) |

---

## 🚀 Installation

### Prerequisites

- ✅ Supabase project with existing Aurora schema
- ✅ React/TypeScript project setup
- ✅ `@supabase/supabase-js` installed

### Step 1: Install Dependencies (if needed)

```bash
npm install @supabase/supabase-js
```

### Step 2: Environment Variables

Ensure your `.env` file contains:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄️ Database Setup

### Quick Setup

1. **Open Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your Aurora project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Setup Script**
   - Copy the contents of `aurorachat-setup.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

### What the Setup Script Does

| Step | Description |
|------|-------------|
| **1** | Creates `conversations` table if not exists |
| **2** | Creates `conversation_participants` table |
| **3** | Creates `messages` table |
| **4** | Adds performance indexes for fast queries |
| **5** | Creates trigger to auto-populate account types |
| **6** | Creates helper functions for conversation management |
| **7** | Sets up Row Level Security (RLS) policies |
| **8** | Enables realtime for live updates |
| **9** | Creates storage bucket for file attachments |

### Verify Setup

Run these validation queries:

```sql
-- Check tables exist
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'conversations'
) AS conversations_exists;

-- Check trigger exists
SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_participant_account_type_trigger'
) AS trigger_exists;

-- Test creating a conversation
SELECT public.find_or_create_direct_conversation(
    'your-user-id-1',
    'your-user-id-2'
);
```

---

## 📁 File Structure

```
src/
├── types/
│   └── chat.ts                    # TypeScript type definitions
│
├── services/
│   └── conversation.service.ts    # Core conversation logic
│
├── hooks/
│   └── useConversation.ts         # React hook for conversation management
│
├── lib/
│   └── supabase.ts                # Supabase client (already exists)
│
├── examples/
│   └── AuroraChatExamples.tsx     # Usage examples and components
│
└── aurorachat-setup.sql           # Database setup script
```

---

## 📚 API Reference

### ConversationService

The main service class for all conversation operations.

#### `startConversation(currentUserId, otherUserId)`

Starts a new conversation or returns existing one.

```typescript
const result = await ConversationService.startConversation(
    userId1,
    userId2
);

// Returns:
{
    success: boolean;
    conversation: ConversationWithParticipants | null;
    error: string | null;
}
```

#### `findExistingConversation(userId1, userId2)`

Finds an existing conversation between two users.

```typescript
const conversation = await ConversationService.findExistingConversation(
    userId1,
    userId2
);

// Returns: ConversationWithParticipants | null
```

#### `createConversation(currentUserId, otherUserId)`

Creates a new conversation and adds participants.

```typescript
const conversation = await ConversationService.createConversation(
    userId1,
    userId2
);

// Returns: ConversationWithParticipants | null
```

#### `getConversationWithParticipants(conversationId)`

Gets full conversation details with all participants.

```typescript
const conversation = await ConversationService.getConversationWithParticipants(
    conversationId
);

// Returns: ConversationWithParticipants | null
```

#### `getUserInfo(userId)`

Gets user information with account type.

```typescript
const user = await ConversationService.getUserInfo(userId);

// Returns: User | null
```

#### `joinRoom(conversationId, userId)`

Joins an existing room (for group chats or aurora_room).

```typescript
const success = await ConversationService.joinRoom(
    conversationId,
    userId
);

// Returns: boolean
```

---

### useConversation Hook

React hook for managing conversation state.

```typescript
import { useConversation } from '@/hooks/useConversation';

function MyComponent() {
    const {
        // State
        loading,
        error,
        currentConversation,
        
        // Actions
        startConversation,
        joinRoom,
        clearConversation,
        clearError,
        
        // Computed
        hasConversation,
        participantCount
    } = useConversation();
}
```

#### Hook Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `startConversation` | `currentUserId: string`, `otherUserId: string` | `Promise<StartConversationResult>` | Start or get existing conversation |
| `joinRoom` | `conversationId: string`, `userId: string` | `Promise<boolean>` | Join existing room |
| `clearConversation` | none | `void` | Clear current conversation state |
| `clearError` | none | `void` | Clear error state |

---

## 💡 Usage Examples

### Example 1: Basic Chat Button

```tsx
import React from 'react';
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/hooks/useAuth';

export function ChatButton({ otherUserId }: { otherUserId: string }) {
    const { user } = useAuth();
    const { loading, startConversation } = useConversation();

    const handleStartChat = async () => {
        if (!user?.id) return;

        const result = await startConversation(user.id, otherUserId);

        if (result.success) {
            // Navigate to chat
            window.location.href = `/chat/${result.conversation?.id}`;
        } else {
            alert(`Error: ${result.error}`);
        }
    };

    return (
        <button 
            onClick={handleStartChat} 
            disabled={loading}
        >
            {loading ? 'Starting...' : '💬 Start Chat'}
        </button>
    );
}
```

### Example 2: Chat with User Info Display

```tsx
import React, { useEffect, useState } from 'react';
import { useConversation } from '@/hooks/useConversation';
import { supabase } from '@/lib/supabase';

export function ChatWithUserInfo({ otherUserId }: { otherUserId: string }) {
    const { user } = useAuth();
    const { loading, startConversation } = useConversation();
    const [userInfo, setUserInfo] = useState<any>(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            const { data } = await supabase
                .from('users')
                .select('id, email, full_name, avatar_url, account_type')
                .eq('id', otherUserId)
                .single();
            setUserInfo(data);
        };

        fetchUserInfo();
    }, [otherUserId]);

    const handleStartChat = async () => {
        if (!user?.id) return;

        const result = await startConversation(user.id, otherUserId);

        if (result.success) {
            window.location.href = `/chat/${result.conversation?.id}`;
        }
    };

    if (!userInfo) return <div>Loading...</div>;

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
                {userInfo.avatar_url ? (
                    <img 
                        src={userInfo.avatar_url} 
                        alt={userInfo.full_name}
                        className="w-12 h-12 rounded-full"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        {userInfo.full_name?.[0]}
                    </div>
                )}
                <div>
                    <h3 className="font-semibold">{userInfo.full_name}</h3>
                    <p className="text-sm text-gray-500">{userInfo.account_type}</p>
                </div>
            </div>

            <button 
                onClick={handleStartChat}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded"
            >
                {loading ? 'Starting...' : '💬 Start Chat'}
            </button>
        </div>
    );
}
```

### Example 3: Join Aurora Room

```tsx
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/hooks/useAuth';

export function JoinAuroraRoom() {
    const { user } = useAuth();
    const { loading, joinRoom } = useConversation();

    const AURORA_ROOM_ID = 'your-aurora-room-id';

    const handleJoin = async () => {
        if (!user?.id) return;

        const success = await joinRoom(AURORA_ROOM_ID, user.id);

        if (success) {
            alert('Joined aurora_room successfully!');
            window.location.href = `/chat/${AURORA_ROOM_ID}`;
        } else {
            alert('Failed to join room');
        }
    };

    return (
        <button 
            onClick={handleJoin} 
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded"
        >
            {loading ? 'Joining...' : '🎉 Join aurora_room'}
        </button>
    );
}
```

### Example 4: Product Card Chat Button

```tsx
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/hooks/useAuth';

export function ProductChatButton({ 
    sellerId, 
    productId 
}: { 
    sellerId: string;
    productId?: string;
}) {
    const { user } = useAuth();
    const { loading, startConversation } = useConversation();

    const handleClick = async () => {
        if (!user?.id) return;

        const result = await startConversation(user.id, sellerId);

        if (result.success && result.conversation) {
            // Optionally store product_id in conversation
            // and navigate to chat
            window.location.href = `/chat/${result.conversation.id}`;
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded text-sm"
        >
            💬 {loading ? '...' : 'Chat with Seller'}
        </button>
    );
}
```

---

## 🔷 TypeScript Types

### Core Types

```typescript
// Account types supported in the system
export type AccountType =
  | "user"
  | "customer"
  | "seller"
  | "admin"
  | "factory"
  | "middleman"
  | "freelancer"
  | "service_provider"
  | "delivery_driver"
  | "doctor"
  | "patient"
  | "pharmacy";

// Conversation types
export type ConversationType = "direct" | "group";
```

### Interfaces

```typescript
// User interface
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: AccountType;
}

// Conversation with participants
export interface ConversationWithParticipants {
  id: string;
  name: string;
  type: ConversationType;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
}

// Participant in a conversation
export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  account_type: AccountType;
  joined_at: string;
}

// Result of starting a conversation
export interface StartConversationResult {
  success: boolean;
  conversation: ConversationWithParticipants | null;
  error: string | null;
}
```

---

## 🔐 Security

### Row Level Security (RLS)

All tables have RLS policies that ensure:

1. **Conversations**: Users can only access conversations they're participants of
2. **Participants**: Users can only manage their own participation
3. **Messages**: Users can only send/read messages in their conversations
4. **Storage**: Users can only upload/delete their own attachments

### RLS Policy Examples

```sql
-- Users can only view their conversations
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Users can only send messages in their conversations
CREATE POLICY "Users can insert messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );
```

### Account Type Auto-Population

The system uses a database trigger to automatically populate the `account_type` field from the `users` table:

```sql
CREATE TRIGGER set_participant_account_type_trigger
    BEFORE INSERT OR UPDATE OF user_id ON conversation_participants
    FOR EACH ROW
    EXECUTE FUNCTION set_participant_account_type();
```

This ensures:
- ✅ Account types are always accurate
- ✅ No manual account_type management needed
- ✅ Account type changes propagate automatically

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Conversation not created"

**Problem:** Conversation doesn't get created when clicking chat button.

**Solution:**
```sql
-- Check if trigger exists
SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_participant_account_type_trigger'
);

-- If returns false, run aurorachat-setup.sql again
```

#### 2. "403 Permission Denied"

**Problem:** Getting 403 errors when trying to access conversations.

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'conversations';

-- Verify user is authenticated
-- Check browser console for auth errors
```

#### 3. "Account type is null"

**Problem:** Participant account_type is null.

**Solution:**
```sql
-- Check if users table has account_type
SELECT user_id, account_type FROM users LIMIT 5;

-- Manually update if needed
UPDATE conversation_participants cp
SET account_type = u.account_type
FROM users u
WHERE cp.user_id = u.user_id
AND cp.account_type IS NULL;
```

#### 4. "Realtime not working"

**Problem:** Messages don't appear in real-time.

**Solution:**
```sql
-- Check realtime publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Ensure tables are included
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

#### 5. "File upload fails"

**Problem:** Can't upload attachments.

**Solution:**
```sql
-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'chat-attachments';

-- Create if missing
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false);
```

### Debug Mode

Enable debug logging in your components:

```typescript
const result = await startConversation(user.id, otherUserId);
console.log('Chat debug:', {
    success: result.success,
    conversationId: result.conversation?.id,
    participants: result.conversation?.participants,
    error: result.error
});
```

### Database Debug Queries

```sql
-- Find conversation between two users
SELECT c.*, cp1.user_id as user1, cp2.user_id as user2
FROM conversations c
JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
WHERE cp1.user_id = 'user-id-1'
AND cp2.user_id = 'user-id-2';

-- Get all conversations for a user
SELECT c.*, cp.account_type
FROM conversations c
JOIN conversation_participants cp ON cp.conversation_id = c.id
WHERE cp.user_id = 'your-user-id'
ORDER BY c.updated_at DESC;

-- Check participant account types
SELECT cp.*, u.account_type 
FROM conversation_participants cp
JOIN users u ON cp.user_id = u.user_id
WHERE cp.conversation_id = 'conversation-id';
```

---

## 📊 Testing Checklist

Before deploying to production:

- [ ] Run `aurorachat-setup.sql` in Supabase SQL Editor
- [ ] Verify all tables exist
- [ ] Test creating a conversation between two test users
- [ ] Verify account types auto-populate
- [ ] Test RLS policies (try accessing other user's conversations)
- [ ] Test realtime message delivery
- [ ] Test file upload (if using attachments)
- [ ] Test on different account types (seller, customer, etc.)
- [ ] Test mobile responsiveness
- [ ] Check browser console for errors

---

## 🎯 Next Steps

### Phase 1 (Current) ✅
- Core conversation system
- Account type support
- Security policies
- Basic UI components

### Phase 2 (Coming Soon)
- Message sending/receiving implementation
- Voice/video calls
- Typing indicators
- Online status
- Message reactions

### Phase 3 (Future)
- Group chats
- Message threading
- File sharing enhancements
- Admin moderation tools

---

## 📞 Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the debug queries
3. Check Supabase logs for errors
4. Verify RLS policies are correct

---

**Happy Chatting! 💬**

*Last Updated: March 30, 2026*
