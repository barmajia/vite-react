# Trading Chat System Documentation

A specialized chat system for the **4 core trading roles**: Customer, Seller, Factory, and Middle Man with **product-level chat permissions**.

---

## Features

- **4 Core Trading Roles**: Customer, Seller, Factory, Middle Man
- **Product-Level Permissions**: Sellers control `products.allow_chat`
- **B2B Always Allowed**: Factory, Middle Man, Seller can always chat
- **Customer Restrictions**: Customers can only chat if `products.allow_chat = true`
- **Product-Linked Conversations**: Chat threads linked to specific products
- **Deal Negotiations**: Support for middleman deal conversations
- **Real-time Messaging**: Using Supabase Realtime
- **Role-Based UI**: Different colors/icons for each account type

---

## Account Types & Permissions

| Role | Table | `account_type` | Can Chat With | Product Chat Permission |
|------|-------|----------------|---------------|------------------------|
| **Customer** | `public.users` | `'user'` / `'customer'` | Seller, Factory, Middle Man | ✅ Requires `products.allow_chat = true` |
| **Seller** | `public.sellers` | `'seller'` | Customer, Factory, Middle Man | ✅ Controls `products.allow_chat` |
| **Factory** | `public.factories` | `'factory'` | Customer, Seller, Middle Man | ❌ Always allowed (B2B) |
| **Middle Man** | `public.middle_men` | `'middleman'` | Customer, Seller, Factory | ❌ Always allowed (B2B) |

---

## Installation

### 1. Run Database Migration

Execute the SQL file in your Supabase SQL Editor:

```sql
-- Run this in Supabase SQL Editor
-- File: create-trading-chat-system.sql
```

This will create:
- `trading_conversations` table
- Updated `conversation_participants` role constraint
- `check_product_chat_permission()` function
- `create_trading_conversation()` function
- `get_my_trading_conversations()` function
- RLS policies
- Triggers for auto-updating last message

### 2. Ensure Products Table Has `allow_chat` Column

The migration automatically adds this column if it doesn't exist:

```sql
ALTER TABLE public.products
ADD COLUMN allow_chat boolean DEFAULT true;
```

---

## Components

### TradingChatBox Component

Main chat interface with product info banner.

```tsx
import { TradingChatBox } from '@/components/chat/TradingChatBox';

<TradingChatBox
  currentUserId={user.id}
  currentUserType={user.account_type}
  targetUserId={sellerId}
  targetUserType="seller"
  productId={product.id}
  onClose={() => setIsOpen(false)}
  className="w-[380px]"
/>
```

### TradingChatWidget Component

Floating chat button for trading roles.

```tsx
import { TradingChatWidget } from '@/components/chat/TradingChatWidget';

<TradingChatWidget
  currentUserId={user.id}
  currentUserType={user.account_type}
/>
```

### ProductChatButton Component

Conditional button that respects `products.allow_chat`.

```tsx
import { ProductChatButton } from '@/components/chat/ProductChatButton';

<ProductChatButton
  currentUserId={customer.id}
  currentUserType="customer"
  productId={product.id}
  sellerId={seller.id}
  sellerUserType="seller"
/>
```

### ProductChatStatus Component

Shows chat availability status for a product.

```tsx
import { ProductChatStatus } from '@/components/chat/ProductChatButton';

<ProductChatStatus allowChat={product.allow_chat} />
```

---

## Hooks

### useChatPermission

Checks if chat is allowed based on roles and product settings.

```tsx
import { useChatPermission } from '@/hooks/useChatPermission';

const { permission, product, loading } = useChatPermission(
  currentUserId,
  currentUserType,
  targetUserId,
  targetUserType,
  productId
);

if (permission.allowed) {
  // Show chat button
} else {
  // Show "Chat Disabled" message
  console.log(permission.reason); // "Seller has disabled chat for this product"
}
```

### useTradingChat

Manages messages, participants, and realtime updates.

```tsx
import { useTradingChat } from '@/hooks/useTradingChat';

const { messages, conversation, participants, product, loading, sendMessage } = useTradingChat(
  conversationId,
  currentUserId,
  currentUserType
);
```

### useCreateTradingConversation

Creates conversations in `trading_conversations` table.

```tsx
import { useCreateTradingConversation } from '@/hooks/useCreateTradingConversation';

const { createConversation, loading, error } = useCreateTradingConversation();

const conversationId = await createConversation(
  sellerId,
  'customer',
  'seller',
  productId,
  'product_inquiry'
);
```

### useUserAccountType

Gets the user's account type from the users table.

```tsx
import { useUserAccountType } from '@/hooks/useUserAccountType';

const { accountType, loading, error } = useUserAccountType(user?.id);
```

---

## Usage Examples

### Product Page (Customer View)

```tsx
import { ProductChatButton, ProductChatStatus } from '@/components/chat';

export const ProductDetail = ({ product, currentUser }) => {
  return (
    <div>
      <h1>{product.title}</h1>
      <p>${product.price}</p>
      
      {/* Show chat status */}
      <ProductChatStatus allowChat={product.allow_chat} />
      
      {/* Chat button - only enabled if allow_chat is true */}
      {currentUser && (
        <ProductChatButton
          currentUserId={currentUser.id}
          currentUserType={currentUser.account_type}
          productId={product.id}
          sellerId={product.seller_id}
          sellerUserType="seller"
        />
      )}
      
      {!product.allow_chat && (
        <p className="text-sm text-gray-500 mt-2">
          This seller has disabled chat inquiries for this product.
        </p>
      )}
    </div>
  );
};
```

### Seller Dashboard - Product Settings

```tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const ProductSettings = ({ product }) => {
  const [allowChat, setAllowChat] = useState(product.allow_chat);

  const toggleChat = async () => {
    const { error } = await supabase
      .from('products')
      .update({ allow_chat: !allowChat })
      .eq('id', product.id);
    
    if (error) {
      toast.error('Failed to update chat settings');
    } else {
      setAllowChat(!allowChat);
      toast.success(`Chat ${!allowChat ? 'enabled' : 'disabled'} for this product`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="allow-chat"
        checked={allowChat}
        onChange={toggleChat}
      />
      <label htmlFor="allow-chat">
        Allow customers to chat about this product
      </label>
    </div>
  );
};
```

### Factory Profile Page

```tsx
import { ContactButton } from '@/components/chat/ContactButton';

export const FactoryProfile = ({ factory, currentUser }) => {
  return (
    <div className="p-6">
      <h1>{factory.company_name}</h1>
      <p>{factory.specialization}</p>
      <p>Capacity: {factory.production_capacity}</p>
      
      {/* Factory can always chat (B2B) */}
      {currentUser && (
        <ContactButton
          targetUserId={factory.user_id}
          targetAccountType="factory"
          context="trading"
        />
      )}
    </div>
  );
};
```

### Middleman Profile Page

```tsx
import { ContactButton } from '@/components/chat/ContactButton';

export const MiddlemanProfile = ({ middleman, currentUser }) => {
  return (
    <div className="p-6">
      <h1>{middleman.display_name}</h1>
      <p>Commission Rate: {middleman.commission_rate}%</p>
      <p>Total Deals: {middleman.total_deals}</p>
      
      {/* Middleman can always chat (B2B) */}
      {currentUser && (
        <ContactButton
          targetUserId={middleman.user_id}
          targetAccountType="middleman"
          context="brokerage"
        />
      )}
    </div>
  );
};
```

### Seller Dashboard - Bulk Chat Settings

```tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const BulkChatSettings = ({ products }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);

  const bulkEnableChat = async () => {
    const { error } = await supabase
      .from('products')
      .update({ allow_chat: true })
      .in('id', selectedProducts);
    
    if (error) {
      toast.error('Failed to enable chat');
    } else {
      toast.success(`Chat enabled for ${selectedProducts.length} products`);
      setSelectedProducts([]);
    }
  };

  const bulkDisableChat = async () => {
    const { error } = await supabase
      .from('products')
      .update({ allow_chat: false })
      .in('id', selectedProducts);
    
    if (error) {
      toast.error('Failed to disable chat');
    } else {
      toast.success(`Chat disabled for ${selectedProducts.length} products`);
      setSelectedProducts([]);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={bulkEnableChat}
          disabled={selectedProducts.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Enable Chat for Selected
        </button>
        <button
          onClick={bulkDisableChat}
          disabled={selectedProducts.length === 0}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Disable Chat for Selected
        </button>
      </div>
      
      {/* Product list with checkboxes */}
      {products.map((product) => (
        <div key={product.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedProducts.includes(product.id)}
            onChange={() => {
              if (selectedProducts.includes(product.id)) {
                setSelectedProducts(selectedProducts.filter(id => id !== product.id));
              } else {
                setSelectedProducts([...selectedProducts, product.id]);
              }
            }}
          />
          <span>{product.title}</span>
          <Badge variant={product.allow_chat ? 'success' : 'secondary'}>
            {product.allow_chat ? 'Chat Enabled' : 'Chat Disabled'}
          </Badge>
        </div>
      ))}
    </div>
  );
};
```

---

## API Reference

### check_product_chat_permission(p_user_id, p_product_id)

Checks if a user can chat about a specific product.

**Parameters:**
- `p_user_id` (uuid): The user to check
- `p_product_id` (uuid): The product to check

**Returns:** `boolean` - True if chat is allowed

**Example:**
```sql
SELECT check_product_chat_permission(
  'user-uuid-here',
  'product-uuid-here'
);
```

### create_trading_conversation(...)

Creates a new trading conversation.

**Parameters:**
- `p_target_user_id` (uuid): The user to chat with
- `p_initiator_role` (text): Your role ('customer', 'seller', etc.)
- `p_receiver_role` (text): Their role
- `p_product_id` (uuid, optional): Product being discussed
- `p_conversation_type` (text, default: 'product_inquiry'): Type of conversation

**Returns:** `uuid` - Conversation ID

**Example:**
```sql
SELECT create_trading_conversation(
  'seller-uuid-here',
  'customer',
  'seller',
  'product-uuid-here',
  'product_inquiry'
);
```

### get_my_trading_conversations()

Gets all trading conversations for the current user.

**Returns:** Table with:
- conversation_id
- conversation_type
- other_user_id, other_user_name, other_user_account_type
- product_id, product_title, product_price
- last_message, last_message_at
- unread_count

**Example:**
```sql
SELECT * FROM get_my_trading_conversations();
```

---

## Conversation Types

| Type | Description | Use Case |
|------|-------------|----------|
| `product_inquiry` | Questions about a product | Customer → Seller |
| `custom_request` | Custom product request | Customer → Factory |
| `deal_negotiation` | Negotiating a deal | Any → Middle Man |
| `factory_order` | Factory production order | Seller → Factory |

---

## File Structure

```
src/
├── components/
│   └── chat/
│       ├── TradingChatBox.tsx           # Main trading chat interface
│       ├── TradingChatWidget.tsx        # Floating chat button
│       ├── ProductChatButton.tsx        # Product chat button
│       └── index.ts                     # Exports
├── hooks/
│   ├── useChatPermission.ts             # Permission checking
│   ├── useTradingChat.ts                # Chat logic
│   ├── useCreateTradingConversation.ts  # Create conversation
│   └── useUserAccountType.ts            # Get account type
├── lib/
│   └── tradingConfig.ts                 # Trading account configuration
└── types/
    └── trading-chat.ts                  # TypeScript types
```

---

## Permission Flow

```
Customer wants to chat with Seller about Product
           ↓
Check products.allow_chat
           ↓
    ┌──────┴──────┐
    │             │
   true         false
    │             │
    ↓             ↓
Allow Chat   Show "Chat Disabled"
             (Seller control)

Factory/Middle Man wants to chat
           ↓
Always Allowed (B2B)
```

---

## Security

All tables have Row Level Security (RLS) enabled:

- **trading_conversations**: Users can only read conversations they're part of
- **messages**: Users can only read messages in their conversations
- **Product permission check**: Enforced at database level via `check_product_chat_permission()`
- **Conversation creation**: Only allowed if product permission check passes

---

## Realtime Updates

Uses Supabase Realtime for instant message delivery:

```typescript
const channel = supabase
  .channel(`messages:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`,
  }, (payload) => {
    setMessages((prev) => [...prev, payload.new as TradingMessage]);
  })
  .subscribe();
```

---

## Troubleshooting

### "Chat is not enabled for this product"
- Seller has set `products.allow_chat = false`
- Seller can enable it in product settings

### "Conversation not created"
- Ensure `create_trading_conversation` function exists
- Run the SQL migration file
- Check RLS policies are enabled

### "Invalid role" error
- Ensure account_type is one of: 'user', 'customer', 'seller', 'factory', 'middleman'
- Check the users table has correct account_type

---

## Next Steps

1. Run `create-trading-chat-system.sql` migration
2. Test with Customer and Seller accounts
3. Verify `products.allow_chat` permission works
4. Test B2B chat (Factory, Middle Man always allowed)
5. Customize UI to match your design

---

## Comparison: Universal vs Trading Chat

| Feature | Universal Chat | Trading Chat |
|---------|---------------|--------------|
| Account Types | 11+ types | 4 core types |
| Product Permissions | ❌ | ✅ |
| B2B Always Allowed | ❌ | ✅ (Factory, Middle Man) |
| Product-Linked Chats | ✅ | ✅ |
| Deal Negotiations | ❌ | ✅ |
| Use Case | General platform | Trading-focused |

---

## Support

For issues or questions, check the Supabase documentation or reach out to the development team.
