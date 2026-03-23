# Universal Chat System Documentation

A complete chat and calling system that allows **any account type** to communicate with **any other account type** in the Aurora platform.

---

## Features

- **11+ Account Types Supported**: user, customer, seller, admin, factory, middleman, freelancer, service_provider, delivery_driver, doctor, patient, pharmacy
- **Real-time Messaging**: Instant message delivery using Supabase Realtime
- **Multiple Message Types**: text, image, file, call invites
- **Voice & Video Calls**: Ready for integration with Agora/Twilio/LiveKit
- **Context-Aware Chats**: Different contexts for different use cases (ecommerce, health, service, etc.)
- **Floating Chat Widget**: Persistent chat button accessible from anywhere
- **Contact Buttons**: Easy-to-use contact buttons for profile pages

---

## Installation

### 1. Run Database Migration

Execute the SQL file in your Supabase SQL Editor:

```sql
-- Run this in Supabase SQL Editor
-- File: create-chat-system.sql
```

This will create:
- `conversations` table
- `conversation_participants` table
- `messages` table
- `call_sessions` table
- RLS policies
- Helper functions

### 2. Create Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `chat-attachments`
3. Set to public
4. Or run the SQL policies from the migration file

---

## Components

### ChatBox Component

The main chat interface with messages, input, and call buttons.

```tsx
import { ChatBox } from '@/components/chat/ChatBox';

<ChatBox
  currentUserId={user.id}
  targetUserId={otherUserId}
  context="ecommerce"
  onClose={() => setIsOpen(false)}
  className="w-[380px]"
/>
```

### ContactButton Component

Universal button to start chat from any profile page.

```tsx
import { ContactButton } from '@/components/chat/ContactButton';

<ContactButton
  targetUserId={doctor.user_id}
  targetAccountType="doctor"
  context="health"
  showCallButtons={true}
/>
```

### FloatingChatWidget Component

Persistent chat button in the bottom-right corner.

```tsx
import { FloatingChatWidget } from '@/components/chat/FloatingChatWidget';

<FloatingChatWidget
  currentUserId={user.id}
  targetUserId={selectedUserId}
/>
```

---

## Usage Examples

### Doctor Profile Page

```tsx
import { ContactButton } from '@/components/chat/ContactButton';

export const DoctorProfile = ({ doctor }) => {
  return (
    <div className="p-6">
      <h1>Dr. {doctor.full_name}</h1>
      <p>{doctor.specialization}</p>
      
      <ContactButton
        targetUserId={doctor.user_id}
        targetAccountType="doctor"
        context="health"
      />
    </div>
  );
};
```

### Seller Profile Page

```tsx
import { ContactButton } from '@/components/chat/ContactButton';

export const SellerProfile = ({ seller }) => {
  return (
    <div className="p-6">
      <h1>{seller.store_name}</h1>
      
      <ContactButton
        targetUserId={seller.user_id}
        targetAccountType="seller"
        context="ecommerce"
      />
    </div>
  );
};
```

### Freelancer Profile Page

```tsx
import { ContactButton } from '@/components/chat/ContactButton';

export const FreelancerProfile = ({ freelancer }) => {
  return (
    <div className="p-6">
      <h1>{freelancer.display_name}</h1>
      <p>{freelancer.skills.join(', ')}</p>
      
      <ContactButton
        targetUserId={freelancer.user_id}
        targetAccountType="freelancer"
        context="service"
      />
    </div>
  );
};
```

### Factory Profile Page

```tsx
import { ContactButton } from '@/components/chat/ContactButton';

export const FactoryProfile = ({ factory }) => {
  return (
    <div className="p-6">
      <h1>{factory.factory_name}</h1>
      <p>Production Capacity: {factory.production_capacity}</p>
      
      <ContactButton
        targetUserId={factory.user_id}
        targetAccountType="factory"
        context="trading"
      />
    </div>
  );
};
```

---

## Hooks

### useChat

Manages messages, participants, and realtime updates for a conversation.

```tsx
import { useChat } from '@/hooks/useChat';

const { messages, conversation, participants, loading, error, sendMessage } = useChat(
  conversationId,
  currentUserId
);
```

### useCreateConversation

Creates or retrieves an existing conversation.

```tsx
import { useCreateConversation } from '@/hooks/useCreateConversation';

const { createConversation, loading, error } = useCreateConversation();

const conversationId = await createConversation(targetUserId, 'ecommerce');
```

### useCurrentUser

Gets the current user's profile from the users table.

```tsx
import { useCurrentUser } from '@/hooks/useCurrentUser';

const { user, loading, error } = useCurrentUser();
```

---

## Account Types

| Account Type | Label | Color | Icon |
|-------------|-------|-------|------|
| user | Customer | Blue | User |
| customer | Customer | Blue | User |
| seller | Seller | Green | Store |
| admin | Admin | Red | Shield |
| factory | Factory | Orange | Factory |
| middleman | Broker | Purple | Handshake |
| freelancer | Freelancer | Indigo | Laptop |
| service_provider | Provider | Teal | Briefcase |
| delivery_driver | Driver | Yellow | Truck |
| doctor | Doctor | Red | Stethoscope |
| patient | Patient | Pink | Heart |
| pharmacy | Pharmacy | Emerald | Pill |

---

## Chat Contexts

| Context | Description | Use Case |
|---------|-------------|----------|
| general | General Chat | Any conversation |
| ecommerce | Product Inquiry | Customer ↔ Seller |
| health | Health Consultation | Patient ↔ Doctor |
| service | Service Request | Client ↔ Freelancer |
| trading | Trade Discussion | Buyer ↔ Factory |
| logistics | Delivery Coordination | Seller ↔ Driver |

---

## Message Types

- `text`: Plain text messages
- `image`: Image attachments
- `file`: File attachments (PDF, DOC, etc.)
- `call_invite`: Call invitation
- `voice_call`: Voice call metadata
- `video_call`: Video call metadata

---

## API Reference

### create_direct_conversation(p_target_user_id, p_context)

Creates a new conversation or returns existing one.

**Parameters:**
- `p_target_user_id` (uuid): The user to chat with
- `p_context` (text, optional): Conversation context (default: 'general')

**Returns:** `uuid` - Conversation ID

**Example:**
```sql
SELECT create_direct_conversation('123e4567-e89b-12d3-a456-426614174000', 'ecommerce');
```

### get_my_conversations()

Gets all conversations for the current user.

**Returns:** Table with conversation details and unread count

**Example:**
```sql
SELECT * FROM get_my_conversations();
```

---

## File Structure

```
src/
├── components/
│   └── chat/
│       ├── ChatBox.tsx              # Main chat interface
│       ├── ContactButton.tsx        # Contact button for profiles
│       ├── FloatingChatWidget.tsx   # Persistent chat button
│       └── index.ts                 # Exports
├── hooks/
│   ├── useChat.ts                   # Chat logic hook
│   ├── useCreateConversation.ts     # Create conversation hook
│   └── useCurrentUser.ts            # Current user profile hook
├── lib/
│   ├── chatConfig.ts                # Account type configuration
│   └── supabase.ts                  # Supabase client
└── types/
    └── chat.ts                      # TypeScript types
```

---

## Voice/Video Call Integration

The chat system is ready for voice/video call integration. To add actual calling:

### Option 1: Agora

```bash
npm install agora-rtc-react
```

### Option 2: Twilio Video

```bash
npm install twilio-video
```

### Option 3: LiveKit

```bash
npm install livekit-client
```

Update the `handleStartCall` function in `ChatBox.tsx` to integrate with your chosen provider.

---

## Realtime Updates

The chat system uses Supabase Realtime for instant message delivery:

```typescript
// Automatic subscription in useChat hook
const channel = supabase
  .channel(`messages:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`,
  }, (payload) => {
    setMessages((prev) => [...prev, payload.new as Message]);
  })
  .subscribe();
```

---

## Security

All tables have Row Level Security (RLS) enabled with policies that ensure:
- Users can only read conversations they're participants of
- Users can only send messages in conversations they're part of
- Users can only update their own messages
- Call sessions are private to participants

---

## Troubleshooting

### "Conversation not created"
- Ensure `create_direct_conversation` function exists in your database
- Run the SQL migration file

### "Messages not appearing"
- Check RLS policies are enabled
- Verify the conversation has participants
- Check browser console for errors

### "File upload fails"
- Ensure `chat-attachments` storage bucket exists
- Check storage policies allow uploads

### "Realtime not working"
- Verify Supabase realtime is enabled for your project
- Check network tab for websocket connection

---

## Next Steps

1. Run the database migration
2. Create the storage bucket
3. Test with two different user accounts
4. Integrate voice/video calls (optional)
5. Customize the UI to match your design

---

## Support

For issues or questions, check the Supabase documentation or reach out to the development team.
