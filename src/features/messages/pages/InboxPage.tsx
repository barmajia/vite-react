import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConversationList } from "@/hooks/useConversationList";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MessageSquare,
  Package,
  Stethoscope,
  Wrench,
  Home,
} from "lucide-react";
import { format } from "date-fns";
import { ConversationListItem, ChatContext } from "@/types/chat";

export const Inbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { conversations, loading, error } = useConversationList(user?.id || "");

  const getTypeIcon = (context: ChatContext) => {
    switch (context) {
      case "ecommerce":
      case "general":
        return <Package className="w-4 h-4" />;
      case "service":
        return <Wrench className="w-4 h-4" />;
      case "health":
        return <Stethoscope className="w-4 h-4" />;
      case "trading":
        return <Home className="w-4 h-4" />;
      case "logistics":
        return <Package className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getContextLabel = (context: ChatContext) => {
    const labels: Record<ChatContext, string> = {
      general: "General",
      ecommerce: "Product",
      health: "Health",
      service: "Service",
      trading: "Trading",
      logistics: "Logistics",
    };
    return labels[context] || "Unknown";
  };

  const getRelatedEntityTitle = (conv: ConversationListItem) => {
    if (conv.product?.title) return conv.product.title;
    if (conv.listing?.title) return conv.listing.title;
    if (conv.appointment) return "Appointment";
    return undefined;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "unread" && conv.unread_count === 0) return false;
    if (filter === "archived") return false;
    if (
      searchQuery &&
      !conv.other_user?.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pt-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Manage your conversations with buyers, sellers, and service providers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2">
                <Button
                  variant={filter === "all" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setFilter("all")}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  All Messages
                </Button>
                <Button
                  variant={filter === "unread" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setFilter("unread")}
                >
                  <Badge variant="secondary" className="ml-auto">
                    {conversations.reduce((sum, c) => sum + c.unread_count, 0)}
                  </Badge>
                  Unread
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Message Types</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span>Product Inquiries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <span>Service Bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" />
                  <span>Health Consultations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  <span>Factory Orders</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Loading conversations...
                  </p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <p>Error loading conversations: {error}</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-muted-foreground">
                    Start a conversation by contacting a seller or service
                    provider
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => navigate(`/messages/${conv.id}`)}
                        className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar
                            className="w-12 h-12"
                            name={conv.other_user?.full_name || "User"}
                            src={conv.other_user?.avatar_url}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold truncate">
                                {conv.other_user?.full_name || "Unknown User"}
                              </h3>
                              <span className="text-xs text-muted-foreground">
                                {conv.last_message_at
                                  ? format(
                                      new Date(conv.last_message_at),
                                      "MMM d, h:mm a",
                                    )
                                  : ""}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground truncate mb-2">
                              {conv.last_message || "No messages yet"}
                            </p>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {getTypeIcon(conv.context)}
                                <span className="ml-1 capitalize">
                                  {getContextLabel(conv.context)}
                                </span>
                              </Badge>
                              {getRelatedEntityTitle(conv) && (
                                <span className="text-xs text-muted-foreground truncate">
                                  • {getRelatedEntityTitle(conv)}
                                </span>
                              )}
                              {conv.unread_count > 0 && (
                                <Badge className="ml-auto">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
