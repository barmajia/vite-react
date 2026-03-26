// ChatLayout - Main Chat Page for Aurora E-commerce Platform
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { ChatWindow } from "./ChatWindow";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  MessageSquare,
  Menu,
  X,
  RefreshCw,
} from "lucide-react";
import type { ConversationListItem } from "@/lib/chat-types";

export function ChatLayout() {
  const { user } = useAuth();
  const { conversations, loading, error, refresh } = useConversations(user?.id || null);
  const [activeConversation, setActiveConversation] =
    useState<ConversationListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredConversations = conversations.filter((conv) =>
    conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.context.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="h-[calc(100vh-4rem)] flex bg-muted/20 pt-16">
      {/* Sidebar - Conversation List */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative md:translate-x-0 z-20 w-full md:w-80 lg:w-96 h-full bg-card border-r transition-transform duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              <p className="text-xs text-muted-foreground">
                {conversations.length} conversations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
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
                onClick={() => setShowSidebar(false)}
                className="md:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="p-2 space-y-2">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading conversations...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-destructive">
                <p>Error loading conversations</p>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
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
      <div className="flex-1 flex flex-col min-w-0">
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center p-8 max-w-md">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Chat</h2>
              <p className="text-muted-foreground mb-6">
                Select a conversation to start messaging or search for existing
                conversations
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
  );
}
