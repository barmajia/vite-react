# 💬 Chat System - Complete Source Code

> Generated: April 6, 2026  
> Route: `/chat`  
> Total Files: 15+

---

## 📑 Table of Contents

1. [Route Configuration](#1-route-configuration)
2. [Main Entry Point](#2-main-entry-point)
3. [ChatLayout](#3-chatlayout)
4. [ChatWindow](#4-chatwindow)
5. [Hooks](#5-hooks)
   - [useConversations](#useconversations)
   - [useMessages](#usemessages)
6. [Components](#6-components)
   - [ConversationItem](#conversationitem)
   - [StartNewChat](#startnewchat)
7. [Types & Config](#7-types--config)
8. [Database Tables](#8-database-tables)

---

## 1. Route Configuration

### Main Chat Route

**File:** `src/routes/index.tsx`

```tsx
import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import { RouteSkeleton } from "@/components/shared/RouteSkeleton";

const Chat = lazy(() =>
  import("@/chats/chat").then((m) => ({ default: m.Chat })),
);

// Chat route (standalone - no Layout wrapper)
const chatRoute: RouteObject = {
  path: "/chat",
  element: (
    <Suspense fallback={<RouteSkeleton />}>
      <Chat />
    </Suspense>
  ),
};

// Combined in appRoutes
export const appRoutes: RouteObject[] = [
  ...authRoutes,
  mainRoutes,
  adminRoute,
  chatRoute, // ← Standalone route
  ...storefrontRoutes,
  ...errorRoutes,
];
```

### Services Chat Routes

**File:** `src/routes/services.routes.tsx`

```tsx
{
  path: "chat",
  element: (
    <Suspense fallback={<RouteSkeleton />}>
      <ServicesMessagesPage />
    </Suspense>
  ),
},
{
  path: "chat/:conversationId",
  element: (
    <Suspense fallback={<RouteSkeleton />}>
      <ServicesMessagesPage />
    </Suspense>
  ),
},
```

---

## 2. Main Entry Point

**File:** `src/chats/chat.tsx`

```tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSession } from "@/lib/supabase";
import { ChatLayout } from "@/pages/chat/ChatLayout";
import { Login } from "@/pages/auth/Login";
import { Loader2 } from "lucide-react";

export const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();

        if (session) {
          setHasSession(true);
          setUserName(
            session.user.user_metadata?.full_name || session.user.email,
          );
          setUserUuid(session.user.id);

          // Auto-populate current user ID in URL if not already set
          const currentUserId = searchParams.get("id");
          if (!currentUserId) {
            navigate(`/chat?id=${session.user.id}`, { replace: true });
          }
        } else {
          setHasSession(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setHasSession(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center pt-16">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign in to Chat</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to access your conversations
          </p>
          <Login />
        </div>
      </div>
    );
  }

  return <ChatLayout />;
};
```

---

## 3. ChatLayout

**File:** `src/pages/chat/ChatLayout.tsx`

```tsx
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { ChatWindow } from "./ChatWindow";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { StartNewChat } from "@/components/chat/StartNewChat";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import {
  Search,
  MessageSquare,
  Menu,
  X,
  RefreshCw,
  MoreVertical,
  Plus,
} from "lucide-react";
import type { ConversationListItem } from "@/lib/chat-types";

export function ChatLayout() {
  const { user } = useAuth();
  const { conversations, loading, error, refresh } = useConversations(
    user?.id || null,
  );
  const [activeConversation, setActiveConversation] =
    useState<ConversationListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.other_user?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.context.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectConversation = (conversation: ConversationListItem) => {
    setActiveConversation(conversation);
    // On mobile, hide sidebar when conversation selected
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleBackToList = () => {
    setActiveConversation(null);
    setShowSidebar(true);
  };

  if (!user) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center pt-16">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view messages</h2>
          <p className="text-muted-foreground">
            You need to be signed in to access your conversations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Chat Header */}
      <ChatHeader />

      {/* Main Content - Sidebar + Chat Window */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Sidebar - Conversation List (WhatsApp Style) */}
        <div
          className={`${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          } fixed md:relative md:translate-x-0 z-10 w-full md:w-96 lg:w-[420px] h-full bg-card border-r flex flex-col transition-transform duration-300 ease-in-out`}
        >
          {/* Sidebar Header */}
          <div className="px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar
                  name={user?.full_name}
                  src={user?.avatar_url}
                  size="md"
                  className="bg-primary"
                />
                <div>
                  <h1 className="text-lg font-bold">Chats</h1>
                  <p className="text-xs text-muted-foreground">
                    {conversations.length} conversations
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title="New Chat"
                  onClick={() => setIsNewChatOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9"
                  title="Start New Chat"
                  onClick={() => setIsNewChatOpen(true)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 md:hidden"
                  onClick={() => setShowSidebar(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title="More Options"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-0"
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading conversations...
                  </p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-destructive">
                  <p>Error loading conversations</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No conversations found"
                      : "No conversations yet"}
                  </p>
                  {!searchQuery && (
                    <p className="text-sm mt-2">
                      Start a conversation from a product or profile
                    </p>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversation?.id === conv.id}
                    onClick={() => handleSelectConversation(conv)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Window */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              onBack={handleBackToList}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/10">
              <div className="text-center p-8 max-w-md">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Aurora Chat</h2>
                <p className="text-muted-foreground mb-6">
                  Send and receive messages with your contacts
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  View Conversations
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Dialog */}
      <StartNewChat open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
    </div>
  );
}
```

---

## 4. ChatWindow

**File:** `src/pages/chat/ChatWindow.tsx`

```tsx
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { Button } from "@/components/ui";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  MessageSquare,
} from "lucide-react";
import type { ConversationListItem } from "@/lib/chat-types";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/chatConfig";
import { toast } from "sonner";

interface ChatWindowProps {
  conversation: ConversationListItem;
  onBack: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationContext =
    conversation.context === "service" ? "services" : conversation.context;

  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    deleteMessage,
    refresh,
  } = useMessages({
    conversationId: conversation.id,
    context: conversationContext,
    currentUserId: user?.id || "",
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (
    content: string,
    type: "text" | "image" | "file",
    attachmentUrl?: string,
    attachmentName?: string,
  ) => {
    await sendMessage(content, type, attachmentUrl, attachmentName);
    scrollToBottom();
  };

  const handleDelete = async (messageId: string) => {
    if (confirm("Delete this message?")) {
      await deleteMessage(messageId);
      toast.success("Message deleted");
    }
  };

  const getOtherUserName = () => {
    if (conversation.other_user?.full_name) {
      return conversation.other_user.full_name;
    }

    const contextNames: Record<string, string> = {
      trading: "Trading Partner",
      health:
        conversation.other_user?.account_type === "doctor"
          ? "Patient"
          : "Doctor",
      services:
        conversation.other_user?.account_type === "service_provider"
          ? "Client"
          : "Provider",
      general: "User",
      product: "User",
    };

    return contextNames[conversation.context] || "User";
  };

  const getOtherUserAccountType = () => {
    return conversation.other_user?.account_type || "user";
  };

  const accountTypeConfig = ACCOUNT_TYPE_CONFIG[getOtherUserAccountType()];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar
            name={getOtherUserName()}
            src={conversation.other_user?.avatar_url}
            size="md"
            className={accountTypeConfig?.color}
          />
          <div>
            <h3 className="font-semibold">{getOtherUserName()}</h3>
            <p className="text-xs text-muted-foreground">
              {accountTypeConfig?.label || "User"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled>
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Error loading messages</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm mt-2">
                Start the conversation with a greeting!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                onDelete={handleDelete}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput onSend={handleSend} disabled={sending || loading} />
    </div>
  );
}
```

---

## 5. Hooks

### useConversations

**File:** `src/hooks/useConversations.ts`

```tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Conversation, User } from "@/types/chat";

interface ConversationWithDetails extends Conversation {
  otherUser?: User | null;
  unreadCount?: number;
}

export const useConversations = (currentUserId: string) => {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // STEP 1: Get conversation IDs user participates in
      const { data: participants, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (participantError) throw participantError;

      const conversationIds = participants?.map((p) => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // STEP 2: Fetch conversations by IDs
      const { data: conversationsData, error: convError } = await supabase
        .from("conversations")
        .select(
          "id, name, type, category, created_at, updated_at, last_message, last_message_at, is_archived",
        )
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      // STEP 3: For each conversation, fetch the OTHER participant separately
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          try {
            const { data: participants, error: partError } = await supabase
              .from("conversation_participants")
              .select(
                `user_id, account_type, users:users!inner (id, email, full_name, avatar_url, account_type)`,
              )
              .eq("conversation_id", conv.id)
              .neq("user_id", currentUserId)
              .limit(1)
              .maybeSingle();

            if (partError) {
              console.warn(
                `Participant fetch error for conv ${conv.id}:`,
                partError,
              );
            }

            const otherUser = (participants?.users as unknown as User) || null;

            return {
              ...conv,
              otherUser,
              unreadCount: 0,
            };
          } catch (err) {
            console.warn(
              `Failed to fetch participant for conversation ${conv.id}:`,
              err,
            );
            return { ...conv, otherUser: null, unreadCount: 0 };
          }
        }),
      );

      setConversations(conversationsWithDetails);
    } catch (err: any) {
      console.error("Failed to fetch conversations:", err);

      let errorMessage = "Failed to load conversations";
      if (err?.code === "PGRST301") {
        errorMessage = "Permission denied. Please check your account settings.";
      } else if (err?.code === "42P01" || err?.code === "42P17") {
        errorMessage = "Database configuration error. Please contact support.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Create new conversation
  const createConversation = useCallback(
    async (otherUserId: string, name?: string): Promise<string | null> => {
      if (!currentUserId) return null;

      try {
        // Check if conversation already exists
        const { data: existingParticipants } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", currentUserId);

        if (existingParticipants) {
          for (const p of existingParticipants) {
            const { data: check } = await supabase
              .from("conversation_participants")
              .select("user_id")
              .eq("conversation_id", p.conversation_id)
              .eq("user_id", otherUserId)
              .maybeSingle();

            if (check) {
              return p.conversation_id; // Already exists
            }
          }
        }

        // Create new conversation
        const { data: conversation, error: convError } = await supabase
          .from("conversations")
          .insert({ product_id: null, name: name || null })
          .select("id")
          .single();

        if (convError) throw convError;

        // Add both participants
        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: conversation.id, user_id: currentUserId },
            { conversation_id: conversation.id, user_id: otherUserId },
          ]);

        if (participantsError) throw participantsError;

        return conversation.id;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return null;
      }
    },
    [currentUserId],
  );

  // Delete conversation (soft delete)
  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("user_id", currentUserId);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        return false;
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refresh: fetchConversations,
    createConversation,
    deleteConversation,
  };
};
```

---

### useMessages

**File:** `src/hooks/useMessages.ts`

```tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Message, ConversationContext } from "@/lib/chat-types";
import { getMessageTable } from "@/lib/chat-utils";

interface UseMessagesProps {
  conversationId: string | null;
  context?: ConversationContext;
  currentUserId: string;
}

export function useMessages({
  conversationId,
  context = "general",
  currentUserId,
}: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tableName = getMessageTable(context);

      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select(
          `*, sender:users!messages_sender_id_fkey (user_id, full_name, avatar_url, account_type)`,
        )
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(
        (data || []).map((msg: any) => ({
          ...msg,
          sender: msg.sender?.[0] || msg.sender,
        })),
      );

      await markMessagesAsRead(conversationId, tableName);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, context, currentUserId]);

  const markMessagesAsRead = useCallback(
    async (convId: string, tableName: string) => {
      try {
        if (!currentUserId) return;
        await supabase
          .from(tableName)
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", convId)
          .neq("sender_id", currentUserId)
          .is("read_at", null);
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    },
    [currentUserId],
  );

  const sendMessage = useCallback(
    async (
      content: string,
      messageType: "text" | "image" | "file" = "text",
      attachmentUrl?: string,
      attachmentName?: string,
    ): Promise<Message | null> => {
      if (!conversationId || !content.trim()) return null;

      setSending(true);
      setError(null);

      try {
        const tableName = getMessageTable(context);

        const { data: message, error: insertError } = await supabase
          .from(tableName)
          .insert({
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: content.trim(),
            message_type: messageType,
            attachment_url: attachmentUrl,
            attachment_name: attachmentName,
            is_deleted: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await updateConversationLastMessage(
          conversationId,
          content,
          messageType,
          context,
        );

        return message;
      } catch (err: any) {
        setError(err.message);
        console.error("Error sending message:", err);
        return null;
      } finally {
        setSending(false);
      }
    },
    [conversationId, context, currentUserId],
  );

  const updateConversationLastMessage = useCallback(
    async (
      convId: string,
      content: string,
      messageType: string,
      contextType: ConversationContext,
    ) => {
      try {
        const tableName =
          contextType === "trading"
            ? "trading_conversations"
            : contextType === "health"
              ? "health_conversations"
              : contextType === "services"
                ? "services_conversations"
                : "conversations";

        const lastMessage =
          messageType === "image"
            ? "📷 Image"
            : messageType === "file"
              ? "📎 Attachment"
              : content.substring(0, 100);

        await supabase
          .from(tableName)
          .update({
            last_message: lastMessage,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", convId);
      } catch (err) {
        console.error("Error updating conversation:", err);
      }
    },
    [],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const tableName = getMessageTable(context);
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ is_deleted: true })
          .eq("id", messageId);

        if (updateError) throw updateError;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, is_deleted: true } : m,
          ),
        );
      } catch (err: any) {
        setError(err.message);
        console.error("Error deleting message:", err);
      }
    },
    [context],
  );

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const tableName = getMessageTable(context);

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tableName,
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          if (newMessage.sender_id !== currentUserId) {
            markMessagesAsRead(conversationId, tableName);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: tableName,
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, context, currentUserId, markMessagesAsRead]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    deleteMessage,
    refresh: fetchMessages,
  };
}
```

---

## 6. Components

### ConversationItem

**File:** `src/components/chat/ConversationItem.tsx`

```tsx
import { Avatar } from "@/components/ui/avatar";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/chatConfig";
import type { ConversationListItem } from "@/lib/chat-types";
import { formatDistanceToNow } from "date-fns";
import { CheckCheck } from "lucide-react";

interface ConversationItemProps {
  conversation: ConversationListItem;
  isActive?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isActive = false,
  onClick,
}: ConversationItemProps) {
  const otherUser = conversation.other_user;
  const accountType = otherUser?.account_type || "user";
  const accountTypeConfig = ACCOUNT_TYPE_CONFIG[accountType];

  const getTimeAgo = () => {
    if (!conversation.last_message_at) return "";
    try {
      const date = new Date(conversation.last_message_at);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "";
    }
  };

  const getName = () => otherUser?.full_name || "Unknown User";

  const getLastMessage = () => {
    if (conversation.context === "product" && conversation.product) {
      return `Product: ${conversation.product.title}`;
    }
    return conversation.last_message || "No messages yet";
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 flex items-center gap-3 transition-colors text-left border-b border-muted/50
        ${isActive ? "bg-primary/10" : "hover:bg-muted/50"}
      `}
    >
      <Avatar
        name={getName()}
        src={otherUser?.avatar_url}
        size="lg"
        className={accountTypeConfig?.color || "bg-muted"}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm truncate flex-1">{getName()}</h3>
          <span className="text-xs text-muted-foreground ml-2 shrink-0">
            {getTimeAgo()}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {accountTypeConfig && (
              <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-secondary text-secondary-foreground font-medium">
                {accountTypeConfig.label}
              </span>
            )}
            <p className="text-xs text-muted-foreground truncate flex-1">
              {getLastMessage()}
            </p>
          </div>

          {conversation.unread_count && conversation.unread_count > 0 ? (
            <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 min-w-[20px] text-center">
              {conversation.unread_count}
            </div>
          ) : (
            <div className="text-muted-foreground shrink-0">
              <CheckCheck className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
```

---

### StartNewChat

**File:** `src/components/chat/StartNewChat.tsx`

```tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/chatConfig";

interface StartNewChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserResult {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
  account_type: string;
}

const mapAccountTypeToRole = (accountType: string): string => {
  const roleMap: Record<string, string> = {
    user: "customer",
    customer: "customer",
    patient: "customer",
    seller: "seller",
    factory: "factory",
    middleman: "middleman",
    broker: "middleman",
    delivery: "delivery",
    delivery_driver: "delivery",
    freelancer: "seller",
    service_provider: "seller",
    doctor: "seller",
    pharmacy: "seller",
    admin: "seller",
  };
  return roleMap[accountType.toLowerCase()] || "customer";
};

export function StartNewChat({ open, onOpenChange }: StartNewChatProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const currentUserId = searchParams.get("id") || user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserAccountType, setCurrentUserAccountType] = useState<
    string | null
  >(null);

  useEffect(() => {
    const run = async () => {
      if (!currentUserId) return;

      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("user_id, account_type")
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (profileError) {
        console.warn(
          "Failed to fetch from public.users:",
          profileError.message,
        );
      }

      const accountType =
        profileData?.account_type ||
        user?.user_metadata?.account_type ||
        "customer";

      setCurrentUserAccountType(accountType);
    };

    run();
  }, [currentUserId, user?.user_metadata?.account_type]);

  useEffect(() => {
    const abortController = new AbortController();

    const searchUsers = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2 || !currentUserId) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const q = searchQuery.trim();

        // Try RPC first
        const { data: rpcResults, error: rpcError } = await supabase.rpc(
          "search_users",
          {
            p_query: q,
            p_exclude_user_id: currentUserId,
            p_limit: 50,
          },
        );

        if (!rpcError && rpcResults && rpcResults.length > 0) {
          const mappedResults: UserResult[] = rpcResults.map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            email: r.email,
            full_name: r.display_name || r.full_name,
            avatar_url: r.avatar_url,
            account_type: r.actual_account_type || r.account_type || "customer",
          }));
          setSearchResults(mappedResults);
          return;
        }

        // Fallback: Direct query
        const { data: directResults, error: directError } = await supabase
          .from("users")
          .select("user_id, email, full_name, avatar_url, account_type")
          .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
          .neq("user_id", currentUserId)
          .neq("account_type", "admin")
          .limit(50);

        if (directError) {
          setSearchResults([]);
          return;
        }

        const mappedResults: UserResult[] = (directResults || []).map(
          (r: any) => ({
            id: r.user_id,
            user_id: r.user_id,
            email: r.email,
            full_name: r.full_name,
            avatar_url: r.avatar_url,
            account_type: r.account_type || "customer",
          }),
        );

        setSearchResults(mappedResults);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Search error:", err);
          setSearchResults([]);
        }
      } finally {
        if (!abortController.signal.aborted) setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => {
      clearTimeout(debounceTimer);
      abortController.abort();
    };
  }, [searchQuery, currentUserId]);

  const handleStartConversation = async () => {
    if (!selectedUser || !currentUserId) return;

    setIsCreating(true);

    try {
      let conversationId: string | null = null;

      // Try RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_or_create_direct_conversation_v2",
        {
          p_user1_id: currentUserId,
          p_user2_id: selectedUser.user_id,
          p_display_name: `Chat with ${selectedUser.full_name || selectedUser.email}`,
          p_context_type: "general",
          p_context_id: undefined,
        },
      );

      if (!rpcError && rpcData?.success) {
        conversationId = rpcData.conversation_id;
      } else {
        // Fallback: Manual creation
        const newConversationId =
          crypto.randomUUID?.() || Math.random().toString(36).substring(7);

        await supabase.from("conversations").insert({
          id: newConversationId,
          name: `Chat with ${selectedUser.full_name || selectedUser.email}`,
          type: "direct",
        });

        const role1 = mapAccountTypeToRole(
          currentUserAccountType || "customer",
        );
        const role2 = mapAccountTypeToRole(
          selectedUser.account_type || "customer",
        );

        await supabase.from("conversation_participants").insert([
          {
            conversation_id: newConversationId,
            user_id: currentUserId,
            role: role1,
            account_type: currentUserAccountType || "customer",
            joined_at: new Date().toISOString(),
          },
          {
            conversation_id: newConversationId,
            user_id: selectedUser.user_id,
            role: role2,
            account_type: selectedUser.account_type || "customer",
            joined_at: new Date().toISOString(),
          },
        ]);

        conversationId = newConversationId;
      }

      if (!conversationId)
        throw new Error("Failed to create or find conversation");

      onOpenChange(false);
      navigate(
        `/Chat?id=${currentUserId}&connectedTo=${selectedUser.user_id}&conversationId=${conversationId}`,
      );

      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      alert(
        `Failed to start conversation: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Start New Chat
          </DialogTitle>
          <DialogDescription>
            Search for a user to start a conversation with
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
          {searchQuery && (
            <Button
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Results */}
        <ScrollArea className="h-[300px]">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Start typing to search for users</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.user_id === result.user_id
                      ? "bg-primary/10 border-2 border-primary"
                      : "hover:bg-muted border-2 border-transparent"
                  }`}
                  onClick={() => setSelectedUser(result)}
                >
                  <Avatar
                    name={result.full_name || result.email}
                    src={result.avatar_url}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {result.full_name || "Unknown User"}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {result.email}
                      </p>
                      {ACCOUNT_TYPE_CONFIG[
                        result.account_type as keyof typeof ACCOUNT_TYPE_CONFIG
                      ] && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {
                            ACCOUNT_TYPE_CONFIG[
                              result.account_type as keyof typeof ACCOUNT_TYPE_CONFIG
                            ].label
                          }
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedUser?.user_id === result.user_id && (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleStartConversation}
            disabled={!selectedUser || isCreating}
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                Starting...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Start Chat
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 7. Types & Config

### chat-types.ts

**File:** `src/lib/chat-types.ts`

```typescript
export type ConversationContext =
  | "general"
  | "product"
  | "trading"
  | "health"
  | "services";
export type MessageType = "text" | "image" | "file";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  attachment_url?: string;
  attachment_name?: string;
  is_deleted: boolean;
  read_at?: string;
  created_at: string;
  sender?: {
    user_id: string;
    full_name: string;
    avatar_url: string;
    account_type: string;
  };
}

export interface Conversation {
  id: string;
  name: string | null;
  type: string;
  category: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  is_archived: boolean;
  context: ConversationContext;
}

export interface ConversationListItem extends Conversation {
  other_user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    account_type: string;
  } | null;
  unreadCount?: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  account_type: string;
}
```

### chatConfig.ts

**File:** `src/lib/chatConfig.ts`

```typescript
export interface AccountTypeConfig {
  label: string;
  color: string;
}

export type AccountType =
  | "customer"
  | "seller"
  | "factory"
  | "middleman"
  | "delivery"
  | "admin"
  | "doctor"
  | "service_provider"
  | "user";

export const ACCOUNT_TYPE_CONFIG: Record<AccountType, AccountTypeConfig> = {
  customer: { label: "Customer", color: "bg-blue-500" },
  seller: { label: "Seller", color: "bg-emerald-500" },
  factory: { label: "Factory", color: "bg-purple-500" },
  middleman: { label: "Middleman", color: "bg-amber-500" },
  delivery: { label: "Delivery", color: "bg-orange-500" },
  admin: { label: "Admin", color: "bg-red-500" },
  doctor: { label: "Doctor", color: "bg-teal-500" },
  service_provider: { label: "Provider", color: "bg-indigo-500" },
  user: { label: "User", color: "bg-gray-500" },
};
```

---

## 8. Database Tables

### conversations

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type TEXT DEFAULT 'direct',
  category TEXT,
  context TEXT DEFAULT 'general',
  product_id UUID REFERENCES products(id),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### conversation_participants

```sql
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT,
  role TEXT DEFAULT 'member',
  last_read_message_id UUID,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);
```

### messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT,
  message_type TEXT DEFAULT 'text',
  attachment_url TEXT,
  attachment_name TEXT,
  is_deleted BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

---

## Architecture

```
/chat
  └── Chat (entry - session check)
       └── ChatLayout (WhatsApp-style layout)
            ├── ChatHeader (top bar)
            ├── Sidebar
            │    ├── Search
            │    ├── ConversationItem (list)
            │    └── StartNewChat (dialog)
            └── ChatWindow
                 ├── Header (contact info)
                 ├── MessageBubble (list)
                 └── MessageInput (send)

Hooks:
  ├── useConversations (fetch/create/delete)
  └── useMessages (send/receive/delete + realtime)
```

---

_Total: ~3,500+ lines_  
_Generated: April 6, 2026_
