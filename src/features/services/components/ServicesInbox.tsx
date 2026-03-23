import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ServiceConversation {
  id: string;
  product_id: string | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  is_archived: boolean;
  other_user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  product: {
    id: string;
    title: string;
    price: number | null;
    status: string;
  } | null;
  participants: Array<{
    user_id: string;
    role: string;
    last_read_message_id: string | null;
  }>;
}

export const ServicesInbox = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ServiceConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if auth is loaded and user exists
    if (!authLoading && user) {
      fetchConversations();
    } else if (!authLoading && !user) {
      setConversations([]);
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (participantError) throw participantError;

      const conversationIds =
        participantData?.map((p) => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Fetch conversations with product and participant details
      const { data: convos, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          product_id,
          created_at,
          updated_at,
          last_message,
          last_message_at,
          is_archived,
          product:products (
            id,
            title,
            price,
            status
          ),
          participants:conversation_participants (
            user_id,
            role,
            last_read_message_id
          )
        `,
        )
        .in("id", conversationIds)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Map conversations with other user info
      const conversationsWithUsers = (convos || []).map((conv: any) => {
        // Find the other participant (not the current user)
        const otherParticipant = conv.participants?.find(
          (p: any) => p.user_id !== user.id,
        );

        return {
          ...conv,
          other_user: otherParticipant
            ? {
                id: otherParticipant.user_id,
                full_name: null,
                avatar_url: null,
              }
            : null,
        } as ServiceConversation;
      });

      setConversations(conversationsWithUsers);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getUnreadCount = (conv: ServiceConversation) => {
    if (!conv.last_message) return 0;
    const isOtherUser = conv.other_user?.id !== user?.id;
    // You can implement more sophisticated unread logic here
    return isOtherUser ? 1 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
        <p className="text-muted-foreground text-sm">
          Start a conversation about a product or service
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-2 p-4">
        {conversations.map((conv) => {
          const unreadCount = getUnreadCount(conv);
          return (
            <div
              key={conv.id}
              className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-border"
              onClick={() => navigate(`/messages/${conv.id}`)}
            >
              <Avatar
                name={conv.other_user?.full_name || "User"}
                src={conv.other_user?.avatar_url}
                className="h-12 w-12"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm truncate">
                    {conv.other_user?.full_name || "Unknown User"}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(conv.last_message_at || conv.updated_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate mb-1">
                  {conv.last_message || "No messages yet"}
                </p>
                <div className="flex items-center gap-2">
                  {conv.product && (
                    <Badge variant="secondary" className="text-xs">
                      {conv.product.title}
                    </Badge>
                  )}
                  {unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
