import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ServiceConversation {
  id: string;
  provider_id: string;
  customer_id: string;
  listing_id: string | null;
  last_message: string | null;
  updated_at: string;
  unread_count: number;
  provider_name: string;
  provider_logo_url: string | null;
  listing_title: string | null;
}

export const ServicesInbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ServiceConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get conversations where user is either provider or customer
      // Filtered for service-related conversations (has listing_id or involves providers)
      const { data: convos, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          provider_id,
          customer_id,
          listing_id,
          last_message,
          updated_at,
          provider:users!provider_id(id, full_name, avatar_url),
          customer:users!customer_id(id, full_name, avatar_url),
          listing:svc_listings(id, title)
        `,
        )
        .or(`provider_id.eq.${user.id},customer_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Filter for service-related conversations only
      const serviceConversations = (convos || [])
        .filter((c: any) => c.listing_id !== null) // Has service listing
        .map((c: any) => ({
          id: c.id,
          provider_id: c.provider_id,
          customer_id: c.customer_id,
          listing_id: c.listing_id,
          last_message: c.last_message,
          updated_at: c.updated_at,
          unread_count: 0,
          provider_name: c.provider?.full_name || "Provider",
          provider_logo_url: c.provider?.avatar_url,
          listing_title: c.listing?.title || "Service Inquiry",
        }));

      setConversations(serviceConversations);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/services")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Service Messages</h1>
              <p className="text-sm text-muted-foreground">
                Communicate with providers and customers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground text-center">
              Start a conversation by booking a service
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() =>
                  navigate(`/services/messages/${conversation.id}`)
                }
                className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={conversation.provider_name}
                    src={conversation.provider_logo_url}
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">
                        {conversation.provider_name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.updated_at)}
                      </span>
                    </div>
                    {conversation.listing_title && (
                      <Badge variant="secondary" className="mb-1">
                        {conversation.listing_title}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message || "No messages yet"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
