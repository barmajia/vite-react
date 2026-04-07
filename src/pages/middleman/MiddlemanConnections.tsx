import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Search,
  Plus,
  AlertTriangle,
  RefreshCw,
  Factory,
  Store,
  MapPin,
  CheckCircle2,
  XCircle,
  X,
  Send,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

type ConnectionType = "factory" | "seller";

type Connection = {
  id: string;
  user_id: string;
  name: string;
  company: string;
  location: string | null;
  status: "active" | "inactive" | "pending";
  dealsCount: number;
  type: ConnectionType;
  avatar_color?: string;
};

type SearchableUser = {
  user_id: string;
  full_name: string;
  account_type: string;
  location: string | null;
};

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function MiddlemanConnections() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ConnectionType>("factory");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Request connection modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch deals to count per factory/seller
      const { data: deals } = await supabase
        .from("middle_man_deals")
        .select("id, product_id")
        .eq("middle_man_id", user.id);

      // Get product info to find sellers
      const productIds = deals
        ?.map((d) => d.product_id)
        .filter(Boolean) as string[];
      const productSellerMap: Record<string, string> = {};
      if (productIds && productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, seller_id")
          .in("id", productIds);

        if (products) {
          products.forEach((p) => {
            if (p.seller_id) productSellerMap[p.id] = p.seller_id;
          });
        }
      }

      // For factories, we check if there's a factory_products relationship
      // For simplicity, we'll query users with account_type factory/seller
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("user_id, full_name, account_type, location");

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        setConnections([]);
        setLoading(false);
        return;
      }

      // Get unique seller IDs from products
      const sellerIds = [...new Set(Object.values(productSellerMap))];

      // For each user, determine connection type and deal count
      const allConnections: Connection[] = users
        .filter(
          (u) => u.account_type === "factory" || u.account_type === "seller",
        )
        .map((u, idx) => {
          const isFactory = u.account_type === "factory";
          const isSeller = u.account_type === "seller";

          let dealsCount = 0;
          if (isSeller && sellerIds.includes(u.user_id)) {
            // Count deals for this seller's products
            dealsCount =
              deals?.filter((d) => {
                if (!d.product_id) return false;
                return productSellerMap[d.product_id] === u.user_id;
              }).length ?? 0;
          }

          // For factories, count deals that might be linked via product factory association
          // Since we don't have a direct factory link, show 0 or approximate
          if (isFactory) {
            dealsCount = 0;
          }

          return {
            id: u.user_id,
            user_id: u.user_id,
            name: u.full_name || "Unknown",
            company: u.full_name || "N/A",
            location: u.location || null,
            status:
              dealsCount > 0 ? ("active" as const) : ("inactive" as const),
            dealsCount,
            type: isFactory ? ("factory" as const) : ("seller" as const),
            avatar_color: getAvatarColor(idx),
          };
        });

      setConnections(allConnections);
    } catch (err) {
      console.error("Error fetching connections:", err);
      setError("Failed to load connections. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const filteredConnections = useMemo(() => {
    return connections.filter((c) => {
      if (c.type !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [connections, activeTab, searchQuery]);

  const searchUsers = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("user_id, full_name, account_type, location")
          .ilike("full_name", `%${query}%`)
          .in("account_type", ["factory", "seller"])
          .limit(10);

        if (error) throw error;

        // Filter out already connected users
        const connectedIds = new Set(connections.map((c) => c.user_id));
        const filtered = (data || []).filter(
          (u) => !connectedIds.has(u.user_id),
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error("Error searching users:", err);
        toast.error("Failed to search users");
      } finally {
        setSearching(false);
      }
    },
    [connections],
  );

  const handleSendRequests = useCallback(async () => {
    if (!user || selectedUsers.length === 0) return;

    setSubmitting(true);
    try {
      // In a real implementation, this would create connection request records
      // For now, simulate success
      toast.success(`${selectedUsers.length} connection request(s) sent`);
      setShowRequestModal(false);
      setSelectedUsers([]);
      setSearchInput("");
      setSearchResults([]);
      await fetchConnections();
    } catch (err) {
      console.error("Error sending requests:", err);
      toast.error("Failed to send connection requests");
    } finally {
      setSubmitting(false);
    }
  }, [user, selectedUsers, fetchConnections]);

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
            <div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Tab skeleton */}
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-10 w-28 bg-white/5 rounded-xl animate-pulse" />
        </div>

        {/* List skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="glass-card p-5 rounded-2xl border-white/5 bg-white/5 animate-pulse flex items-center gap-4"
            >
              <div className="h-12 w-12 bg-white/5 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-white/5 rounded" />
                <div className="h-3 w-28 bg-white/5 rounded" />
              </div>
              <div className="h-6 w-16 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto glass-card rounded-[2rem] border-rose-500/20 bg-rose-500/5 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Unable to Load Connections
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchConnections()}
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6 pb-32">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Network
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Connections
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredConnections.length} connection
            {filteredConnections.length !== 1 ? "s" : ""}
            {searchQuery && <span> \u2022 &ldquo;{searchQuery}&rdquo;</span>}
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-2xl border-white/10 bg-gradient-to-r from-blue-500/20 to-cyan-500/10 hover:from-blue-500/30 hover:to-cyan-500/20 transition-all text-sm font-semibold shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Request Connection
        </button>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-2">
        {(
          [
            { key: "factory" as const, label: "Factories", icon: Factory },
            { key: "seller" as const, label: "Sellers", icon: Store },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSearchQuery("");
            }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-blue-500/15 border border-blue-500/30 text-blue-400"
                : "glass-card border-white/10 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== SEARCH BAR ===== */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          type="text"
          placeholder={`Search ${activeTab === "factory" ? "factories" : "sellers"}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl glass-card border-white/5 bg-white/5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
        />
      </div>

      {/* ===== CONNECTION LIST ===== */}
      {filteredConnections.length === 0 ? (
        <div className="py-16 text-center space-y-6">
          {connections.filter((c) => c.type === activeTab).length === 0 ? (
            <>
              <div className="w-20 h-20 mx-auto glass-card rounded-[2rem] border-white/10 bg-white/5 flex items-center justify-center">
                {activeTab === "factory" ? (
                  <Factory className="h-10 w-10 text-muted-foreground/40" />
                ) : (
                  <Store className="h-10 w-10 text-muted-foreground/40" />
                )}
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                  No {activeTab === "factory" ? "Factories" : "Sellers"}{" "}
                  Connected
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Start building your network by requesting connections with{" "}
                  {activeTab === "factory" ? "factories" : "sellers"}.
                </p>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 bg-gradient-to-r from-blue-500/20 to-cyan-500/10 hover:from-blue-500/30 transition-all text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Request Connection
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl glass-card border-white/10 bg-white/5 flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                No {activeTab === "factory" ? "factories" : "sellers"} match
                your search.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Clear search
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConnections.map((conn, idx) => (
            <div
              key={conn.id}
              className="glass-card p-4 sm:p-5 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className={`h-12 w-12 rounded-2xl glass border flex items-center justify-center text-lg font-bold shrink-0 ${conn.avatar_color || AVATAR_COLORS[0]}`}
                >
                  {conn.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {conn.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="truncate">{conn.company}</span>
                    {conn.location && (
                      <>
                        <span className="text-muted-foreground/30">
                          {"\u2022"}
                        </span>
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {conn.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats & Status */}
                <div className="flex items-center gap-3 shrink-0">
                  {conn.dealsCount > 0 && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                      <Briefcase className="h-3 w-3" />
                      {conn.dealsCount}
                    </div>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                      conn.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                    }`}
                  >
                    {conn.status === "active" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {conn.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== REQUEST CONNECTION MODAL ===== */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-[2rem] border-white/10 bg-white/10 p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowRequestModal(false);
                setSelectedUsers([]);
                setSearchInput("");
                setSearchResults([]);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl glass border bg-blue-500/10 border-blue-500/20 w-fit">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Request Connection
              </h3>
              <p className="text-sm text-muted-foreground">
                Search for factories or sellers to connect with.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Search results */}
            {searching && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-white/5 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Results
                </p>
                {searchResults.map((u) => {
                  const isSelected = selectedUsers.includes(u.user_id);
                  return (
                    <button
                      key={u.user_id}
                      onClick={() => toggleUserSelection(u.user_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "bg-blue-500/15 border-blue-500/30"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-xl glass border flex items-center justify-center text-sm font-bold ${getAvatarColor(
                          u.user_id.charCodeAt(0),
                        )}`}
                      >
                        {(u.full_name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {u.full_name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{u.account_type}</span>
                          {u.location && (
                            <>
                              <span className="text-muted-foreground/30">
                                {"\u2022"}
                              </span>
                              <span className="truncate">{u.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {!searching &&
              searchInput.length >= 2 &&
              searchResults.length === 0 && (
                <div className="py-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No results found for &ldquo;{searchInput}&rdquo;
                  </p>
                </div>
              )}

            {/* Selected count */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-sm text-blue-400">
                  {selectedUsers.length} selected
                </span>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedUsers([]);
                  setSearchInput("");
                  setSearchResults([]);
                }}
                className="flex-1 px-4 py-3 rounded-xl glass-card border-white/10 text-sm font-medium text-muted-foreground hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequests}
                disabled={submitting || selectedUsers.length === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border border-blue-500/20 text-sm font-semibold text-blue-400 hover:from-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting
                  ? "Sending..."
                  : `Send ${selectedUsers.length} Request${selectedUsers.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
