// StartNewChat Component - Modal to start new conversation
// Searches users and creates conversations with fallback logic
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
import { toast } from "sonner";

interface StartNewChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserResult {
  id: string;
  user_id: string; // FK to auth.users
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
  account_type: string;
}

// Map account_type to user_role enum for conversation_participants
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

  // Get current user ID from URL params or use auth user
  const currentUserId = searchParams.get("id") || user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserAccountType, setCurrentUserAccountType] = useState<
    string | null
  >(null);

  // Fetch current user's account_type from public.users (NEW: uses synced account_type)
  useEffect(() => {
    const run = async () => {
      if (!currentUserId) {
        console.log("No current user ID available");
        return;
      }

      console.log("Fetching account_type for user:", currentUserId);

      // Get account_type from public.users (now properly synced by triggers)
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("user_id, account_type")
        .eq("user_id", currentUserId) // Match on user_id (auth.users.id), not id
        .maybeSingle();

      if (profileError) {
        console.warn(
          "Failed to fetch from public.users:",
          profileError.message,
        );
      }

      // Use fetched account_type or auth metadata
      const accountType =
        profileData?.account_type ||
        user?.user_metadata?.account_type ||
        "customer";

      console.log("Current user account_type:", accountType, {
        fromDB: profileData?.account_type,
        fromMeta: user?.user_metadata?.account_type,
      });
      setCurrentUserAccountType(accountType);
    };

    run();
  }, [currentUserId, user?.user_metadata?.account_type]);

  // ✅ Search users with RPC first, fallback to direct query
  useEffect(() => {
    const abortController = new AbortController();

    const searchUsers = async () => {
      console.log("Search triggered:", {
        query: searchQuery,
        queryLength: searchQuery?.length,
        hasUser: !!currentUserId,
      });

      if (!searchQuery.trim() || searchQuery.length < 2 || !currentUserId) {
        setSearchResults([]);
        return;
      }

      console.log("Starting search for:", searchQuery);
      setIsSearching(true);

      try {
        const q = searchQuery.trim();

        // Try new search_users() RPC first
        console.log("Attempting search_users RPC with query:", q);
        const { data: rpcResults, error: rpcError } = await supabase.rpc(
          "search_users",
          {
            p_query: q,
            p_exclude_user_id: currentUserId,
            p_limit: 50,
          },
        );

        if (!rpcError && rpcResults && rpcResults.length > 0) {
          console.log(
            "✓ RPC search successful, found:",
            rpcResults.length,
            "users",
          );

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

        if (rpcError) {
          console.warn(
            "RPC not available, falling back to direct query:",
            rpcError.message,
          );
        }

        // FALLBACK: Direct query to public.users table (works before SQL applied)
        console.log("Using fallback direct query...");
        const { data: directResults, error: directError } = await supabase
          .from("users")
          .select("user_id, email, full_name, avatar_url, account_type")
          .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
          .neq("user_id", currentUserId)
          .neq("account_type", "admin")
          .limit(50);

        if (directError) {
          console.error("Direct query error:", directError);
          setSearchResults([]);
          return;
        }

        console.log(
          "✓ Direct query successful, found:",
          directResults?.length || 0,
          "users",
        );

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

  // Start conversation with selected user - NEW ROUTING WITH QUERY PARAMS
  const handleStartConversation = async () => {
    if (!selectedUser || !currentUserId) return;

    setIsCreating(true);

    try {
      console.log(
        "Creating conversation between",
        currentUserId,
        "and",
        selectedUser.user_id,
      );

      // Try new get_or_create_direct_conversation_v2 RPC first
      let conversationId: string | null = null;
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
        console.log("✓ RPC conversation creation successful");
        conversationId = rpcData.conversation_id;
      } else if (rpcError) {
        console.warn(
          "RPC not available, using fallback conversation creation:",
          rpcError.message,
        );

        // FALLBACK: Create conversation and participants manually
        try {
          const newConversationId =
            crypto.randomUUID?.() || Math.random().toString(36).substring(7);

          // Create conversation with minimal required fields (compatible with all schema versions)
          const { error: convError } = await supabase
            .from("conversations")
            .insert({
              id: newConversationId,
              name: `Chat with ${selectedUser.full_name || selectedUser.email}`,
              type: "direct",
              // Optional new columns - will be ignored if they don't exist:
              // context_type: "general",
              // is_archived: false,
            });

          if (convError) throw convError;

          // Add participants
          const role1 = mapAccountTypeToRole(
            currentUserAccountType || "customer",
          );
          const role2 = mapAccountTypeToRole(
            selectedUser.account_type || "customer",
          );

          const { error: partError } = await supabase
            .from("conversation_participants")
            .insert([
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

          if (partError) throw partError;

          console.log("✓ Fallback conversation creation successful");
          conversationId = newConversationId;
        } catch (fallbackError) {
          console.error(
            "Fallback conversation creation failed:",
            fallbackError,
          );
          throw new Error(`Fallback creation failed: ${fallbackError}`);
        }
      }

      if (!conversationId) {
        throw new Error("Failed to create or find conversation");
      }

      console.log("Conversation ready:", conversationId);

      // Navigate with query params
      onOpenChange(false);
      navigate(
        `/Chat?id=${currentUserId}&connectedTo=${selectedUser.user_id}&conversationId=${conversationId}`,
      );

      // Reset state
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      toast.error(
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
        Search Input
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
                      {ACCOUNT_TYPE_CONFIG[result.account_type as keyof typeof ACCOUNT_TYPE_CONFIG] && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {ACCOUNT_TYPE_CONFIG[result.account_type as keyof typeof ACCOUNT_TYPE_CONFIG].label}
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
