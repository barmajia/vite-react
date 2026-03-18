# Services Messaging Feature

## Overview

A dedicated messaging system for the services marketplace, separate from the main e-commerce messaging. This allows service providers and customers to communicate about service bookings independently from product purchases.

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/services/messages` | `ServicesInbox` | Service conversations list |
| `/services/messages/:conversationId` | `ServicesChat` | Individual chat with provider/customer |

## Features

### Services Inbox (`/services/messages`)

- **Service-specific conversations** - Only shows conversations related to service listings
- **Provider information** - Displays provider name and avatar
- **Listing context** - Shows which service the conversation is about
- **Last message preview** - Quick view of the latest message
- **Timestamp** - Shows when the last message was sent
- **Empty state** - Friendly message when no conversations exist

### Services Chat (`/services/messages/:conversationId`)

- **Real-time messaging** - Live message delivery via Supabase Realtime
- **Read receipts** - Shows ✓✓ when messages are read
- **Typing indicators** - See when someone is typing
- **Service context** - Shows the related service listing
- **Message history** - Scrollable history of all messages
- **Auto-scroll** - Automatically scrolls to new messages
- **Timestamp** - Each message shows when it was sent

## Files Created

### Components

1. **`src/pages/messaging/ServicesInbox.tsx`**
   - Main inbox page for service messages
   - Lists all service-related conversations
   - Filters conversations by `listing_id`

2. **`src/pages/messaging/ServicesChat.tsx`**
   - Individual chat interface
   - Real-time message updates
   - Message sending and receiving

### Routes Added

**`src/App.tsx`**
```tsx
<Route path="services/messages" element={<ServicesInbox />} />
<Route path="services/messages/:conversationId" element={<ServicesChat />} />
```

### Navigation

**`src/components/layout/ServicesHeader.tsx`**
- Messages button now links to `/services/messages`
- Separate from general e-commerce messages

## Database Schema

Uses existing `conversations` and `messages` tables:

```sql
conversations (
  id UUID,
  provider_id UUID,
  customer_id UUID,
  listing_id UUID,  -- Links to svc_listings
  last_message TEXT,
  updated_at TIMESTAMPTZ
)

messages (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
)
```

## How It Works

### Creating a Conversation

When a customer books a service or wants to inquire:

1. Check if conversation exists between provider and customer for that listing
2. If not, create new conversation with `listing_id`
3. Navigate to chat

### Filtering Service Conversations

Service conversations are identified by:
- `listing_id IS NOT NULL` - Has associated service listing
- OR involves a user who is a service provider

### Real-time Updates

- Supabase Realtime subscribes to `messages` table
- New messages appear instantly
- Read receipts update in real-time

## Access Points

1. **Services Header** - Click message icon
2. **Service Listing Page** - "Contact Provider" button (to be added)
3. **Provider Dashboard** - Messages section (to be added)
4. **Booking Confirmation** - Link to chat after booking (to be added)

## Differences from Main Messaging

| Feature | Main Messages (`/messages`) | Service Messages (`/services/messages`) |
|---------|----------------------------|----------------------------------------|
| **Purpose** | Product inquiries | Service bookings |
| **Context** | Products | Service listings |
| **Users** | Buyers ↔ Sellers | Customers ↔ Providers |
| **Tables** | `conversations`, `messages` | `conversations`, `messages` + `svc_listings` |

## Future Enhancements

- [ ] "Contact Provider" button on service listings
- [ ] Create conversation from booking page
- [ ] Provider dashboard messages widget
- [ ] Message notifications for new messages
- [ ] Attachment support (images, documents)
- [ ] Message templates for common responses
- [ ] Conversation search and filtering
- [ ] Archive/delete conversations

## Testing

1. **Login as a service provider**
   - Navigate to `/services/messages`
   - Should see conversations with customers

2. **Login as a customer**
   - Book a service or contact a provider
   - Navigate to `/services/messages`
   - Should see conversation with provider

3. **Real-time test**
   - Open chat in two different browsers
   - Send message from one
   - Should appear instantly in the other

## Troubleshooting

**Issue: No conversations showing**
- Ensure you have a service provider profile
- Ensure you have booked or inquired about a service
- Check RLS policies allow viewing conversations

**Issue: Can't send messages**
- Check you're logged in
- Verify conversation exists
- Check RLS policies for messages table

**Issue: Real-time not working**
- Check Supabase Realtime is enabled
- Verify subscription in browser console
- Check network connection

---

**Created:** March 18, 2026
**Status:** ✅ Implemented
