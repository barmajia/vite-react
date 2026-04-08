// ChatLayout – streamlined for desktop + mobile
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { ChatWindow } from "./ChatWindow";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { StartNewChat } from "@/components/chat/StartNewChat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Search, MessageSquare, Plus, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { ConversationListItem } from "@/lib/chat-types";

export function ChatLayout() {
  const { user } = useAuth();
  const { conversations, loading, error, refresh } = useConversations(
    user?.id || null,
  );
  const [activeConversation, setActiveConversation] =
    useState<ConversationListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const triedRefresh = useRef(false);

  // Handle responsive behavior properly
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.toLowerCase();
    return (
      conv.last_message?.toLowerCase().includes(q) ||
      conv.other_user?.full_name?.toLowerCase().includes(q) ||
      conv.context?.toLowerCase().includes(q)
    );
  });

  const syncUrl = (conversation: ConversationListItem | null) => {
    const params = new URLSearchParams(searchParams);
    if (conversation) {
      params.set("conversationId", conversation.id);
    } else {
      params.delete("conversationId");
    }
    setSearchParams(params, { replace: true });
  };

  const handleSelectConversation = (conversation: ConversationListItem) => {
    setActiveConversation(conversation);
    syncUrl(conversation);
    if (isMobile) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    setActiveConversation(null);
    syncUrl(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  // Activate conversation from URL param
  useEffect(() => {
    const cid = searchParams.get("conversationId");
    if (!cid) return;
    const found = conversations.find((c) => c.id === cid);
    if (found) {
      setActiveConversation(found);
      triedRefresh.current = false;
    } else if (!triedRefresh.current) {
      triedRefresh.current = true;
      handleRefresh();
    }
  }, [searchParams, conversations]);

  // Show simplified loading state
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Sign in to chat</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Access your conversations after signing in
          </p>
        </div>
      </div>
    );
  }

  // Unified responsive layout
  const Sidebar = (
    <div className="w-full md:w-80 lg:w-96 border-r flex flex-col bg-card">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar name={user?.full_name} src={user?.avatar_url} size="sm" />
            <div>
              <h1 className="font-semibold">Chats</h1>
              <p className="text-xs text-muted-foreground">
                {conversations.length} conversations
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsNewChatOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-destructive">Failed to load</p>
            <Button variant="link" size="sm" onClick={handleRefresh}>
              Try again
            </Button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {searchQuery ? "No matches" : "Start a chat from any product"}
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversation?.id === conv.id}
                onClick={() => {
                  setActiveConversation(conv);
                  if (isMobile) window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile: show list or chat; Desktop: grid */}
      <div className={`${isMobile && activeConversation ? "hidden" : "block"} md:block md:flex-shrink-0`}>
        {Sidebar}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {isMobile && !activeConversation ? (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center p-6">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Select a conversation or start a new one
              </p>
            </div>
          </div>
        ) : activeConversation ? (
          <ChatWindow conversation={activeConversation} onBack={handleBackToList} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center p-6">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-lg font-semibold mb-1">Aurora Chat</h2>
              <p className="text-sm text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg w-full max-w-md p-0">
            <StartNewChat open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
          </div>
        </div>
      )}
    </div>
  );
}
