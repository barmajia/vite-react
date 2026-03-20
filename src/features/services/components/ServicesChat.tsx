import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  provider_id: string;
  client_id: string;
  listing_id: string;
  listing: {
    id: string;
    title: string;
    price?: number;
  } | null;
}

export const ServicesChat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{
    name: string;
    avatar: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId && user) {
      fetchConversation();
      fetchMessages();
      subscribeToMessages();
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    if (!conversationId || !user) return;

    try {
      const { data: conv, error: convError } = await supabase
        .from("services_conversations")
        .select(
          `
          id,
          provider_id,
          client_id,
          listing_id,
          listing:service_listings (
            id,
            title,
            price
          )
        `,
        )
        .eq("id", conversationId)
        .single();

      if (convError) throw convError;

      const otherUserId =
        conv.provider_id === user.id ? conv.client_id : conv.provider_id;

      const { data: otherUserData, error: userError } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", otherUserId)
        .single();

      if (userError) throw userError;

      const listing = conv.listing?.[0] || null;
      setConversation({
        id: conv.id,
        provider_id: conv.provider_id,
        client_id: conv.client_id,
        listing_id: conv.listing_id,
        listing,
      });
      setOtherUser({
        name: otherUserData.full_name || t("servicesChat.user"),
        avatar: otherUserData.avatar_url || "",
      });

      const isProvider = conv.provider_id === user.id;
      const updateField = isProvider
        ? "is_read_by_provider"
        : "is_read_by_client";
      await supabase
        .from("services_conversations")
        .update({ [updateField]: true })
        .eq("id", conversationId);
    } catch (error: any) {
      console.error("Error fetching conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from("services_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      const unreadMessages = (data || []).filter(
        (m) => m.sender_id !== user?.id && !m.is_read,
      );
      if (unreadMessages.length > 0) {
        await supabase
          .from("services_messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in(
            "id",
            unreadMessages.map((m) => m.id),
          );
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`service-chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "services_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);

          if (newMsg.sender_id !== user?.id) {
            supabase
              .from("services_messages")
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq("id", newMsg.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("services_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim(),
        message_type: "text",
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!conversation || !otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          {t("servicesChat.loadingConversation")}
        </p>
      </div>
    );
  }

  const listingTitle = conversation.listing?.title || t("servicesChat.service");
  const listingPrice = conversation.listing?.price;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar
            name={otherUser.name}
            src={otherUser.avatar}
            alt={otherUser.name}
            size="md"
          />
          <div className="flex-1">
            <h2 className="font-semibold">{otherUser.name}</h2>
            {listingTitle && (
              <Badge variant="secondary" className="text-xs">
                {listingTitle}
              </Badge>
            )}
            {listingPrice && (
              <Badge variant="outline" className="text-xs">
                ${listingPrice}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("servicesChat.theme.toggle")}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                {t("servicesChat.theme.light")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                {t("servicesChat.theme.dark")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isOwn && message.is_read && " ✓✓"}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewMessage(e.target.value)
            }
            placeholder={t("servicesChat.typeMessage")}
            disabled={sending}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
