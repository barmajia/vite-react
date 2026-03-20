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
  provider_id: string;
  client_id: string;
  listing_id: string;
  last_message: string | null;
  last_message_at: string | null;
  updated_at: string;
  is_read_by_provider: boolean;
  is_read_by_client: boolean;
  other_user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  listing: {
    id: string;
    title: string;
    price: number | null;
  } | null;
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

      const { data: convos, error } = await supabase
        .from("services_conversations")
        .select(
          `
          id,
          provider_id,
          client_id,
          listing_id,
          last_message,
          last_message_at,
          updated_at,
          is_read_by_provider,
          is_read_by_client,
          listing:service_listings (
            id,
            title,
            price
          )
        `,
        )
        .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Map conversations with other user info
      const mapped = (convos || []).map((conv: any) => ({
        ...conv,
        other_user: {
          id: conv.provider_id === user.id ? conv.client_id : conv.provider_id,
          full_name: null,
          avatar_url: null,
        },
      }));

      setConversations(mapped as ServiceConversation[]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div>
          <h1 className="text-xl font-bold">Service Messages</h1>
          <p className="text-sm text-muted-foreground">
            Communicate with providers and clients
          </p>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground text-center">
              Start a conversation by contacting a service provider
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => {
              const otherUserName =
                conversation.other_user?.id || "Unknown User";
              const listingTitle = conversation.listing?.title || "Service";

              return (
                <button
                  key={conversation.id}
                  onClick={() =>
                    navigate(`/services/messages/${conversation.id}`)
                  }
                  className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={otherUserName} className="h-10 w-10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {otherUserName}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(
                            conversation.last_message_at ||
                              conversation.updated_at,
                          )}
                        </span>
                      </div>
                      <Badge variant="secondary" className="mb-1 text-xs">
                        {listingTitle}
                      </Badge>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
