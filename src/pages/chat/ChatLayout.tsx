// ChatLayout - Main Chat Page for Aurora E-commerce Platform
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
