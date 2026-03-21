import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Filter,
  Inbox,
  Archive,
  MessageSquare,
  Package,
  FileText,
  Stethoscope,
  Factory,
  User,
  Clock,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UnifiedMessagingService } from "../services/unified-messaging.service";
import type {
  UnifiedConversation,
  ConversationContext,
} from "../types/messaging";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const UnifiedInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    UnifiedConversation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextFilter, setContextFilter] = useState<
    ConversationContext | "all"
  >("all");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "archived">(
    "all",
  );

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery, contextFilter, activeTab]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await UnifiedMessagingService.getConversations({
        limit: 100,
        includeArchived: true,
      });
      setConversations(convs);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    let filtered = [...conversations];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (conv) =>
          conv.other_user?.full_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          conv.last_message
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          conv.product?.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          conv.service_listing?.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by context
    if (contextFilter !== "all") {
      filtered = filtered.filter((conv) => conv.context === contextFilter);
    }

    // Filter by tab
    if (activeTab === "unread") {
      filtered = filtered.filter(
        (conv) => conv.unread_count && conv.unread_count > 0,
      );
    } else if (activeTab === "archived") {
      filtered = filtered.filter((conv) => conv.is_archived);
    } else {
      filtered = filtered.filter((conv) => !conv.is_archived);
    }

    setFilteredConversations(filtered);
  };

  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  const getContextIcon = (context: ConversationContext) => {
    const icons = {
      product: <Package className="h-3 w-3" />,
      service: <FileText className="h-3 w-3" />,
      healthcare: <Stethoscope className="h-3 w-3" />,
      factory: <Factory className="h-3 w-3" />,
      support: <User className="h-3 w-3" />,
      general: <MessageSquare className="h-3 w-3" />,
    };
    return icons[context] || icons.general;
  };

  const getContextColor = (context: ConversationContext) => {
    const colors = {
      product: "bg-blue-500",
      service: "bg-green-500",
      healthcare: "bg-red-500",
      factory: "bg-orange-500",
      support: "bg-purple-500",
      general: "bg-gray-500",
    };
    return colors[context] || colors.general;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const ConversationItem = ({
    conversation,
  }: {
    conversation: UnifiedConversation;
  }) => {
    const isUnread = conversation.unread_count && conversation.unread_count > 0;

    return (
      <div
        onClick={() => handleConversationClick(conversation.id)}
        className={`flex items-center gap-3 p-4 cursor-pointer border-b hover:bg-muted/50 transition-colors ${
          isUnread ? "bg-muted/30" : ""
        }`}
      >
        {/* Avatar */}
        <Avatar
          name={conversation.other_user?.full_name || "User"}
          src={conversation.other_user?.avatar_url}
          alt={conversation.other_user?.full_name || ""}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate flex-1">
              {conversation.other_user?.full_name || "Unknown User"}
            </h4>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(
                conversation.last_message_at || conversation.created_at,
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {/* Context Badge */}
            <Badge
              variant="secondary"
              className={`${getContextColor(conversation.context)} text-white text-xs`}
            >
              {getContextIcon(conversation.context)}
              <span className="ml-1 capitalize">{conversation.context}</span>
            </Badge>

            {/* Last Message */}
            <p className="text-sm text-muted-foreground truncate flex-1">
              {conversation.last_message || "No messages yet"}
            </p>

            {/* Unread Badge */}
            {isUnread && (
              <Badge
                variant="default"
                className="bg-primary text-primary-foreground text-xs"
              >
                {conversation.unread_count}
              </Badge>
            )}

            {/* Read Status */}
            {!isUnread && conversation.last_message && (
              <CheckCheck className="h-3 w-3 text-muted-foreground" />
            )}
          </div>

          {/* Context-specific info */}
          {(conversation.product ||
            conversation.service_listing ||
            conversation.appointment) && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {conversation.product && (
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {conversation.product.title}
                </span>
              )}
              {conversation.service_listing && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {conversation.service_listing.title}
                </span>
              )}
              {conversation.appointment && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(
                    conversation.appointment.scheduled_at,
                  ).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t("inbox.title", "Messages")}</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {contextFilter === "all" ? "All Types" : contextFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setContextFilter("all")}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContextFilter("product")}>
                Products
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContextFilter("service")}>
                Services
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContextFilter("healthcare")}>
                Healthcare
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContextFilter("factory")}>
                Factory
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("inbox.search", "Search messages...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Inbox className="h-3 w-3" />
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <MessageSquare className="h-3 w-3" />
              Unread
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <Archive className="h-3 w-3" />
              Archived
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No conversations</h3>
            <p className="text-muted-foreground mt-1">
              {activeTab === "unread"
                ? "You don't have any unread messages"
                : activeTab === "archived"
                  ? "You don't have any archived conversations"
                  : "Start a conversation to see it here"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))
        )}
      </ScrollArea>

      {/* Stats */}
      <div className="border-t p-4 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{filteredConversations.length} conversations</span>
          <span>
            {
              conversations.filter((c) => c.unread_count && c.unread_count > 0)
                .length
            }{" "}
            unread
          </span>
        </div>
      </div>
    </div>
  );
};
