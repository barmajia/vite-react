import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "@/services/profileService";
import type { ProfileSearchResult } from "@/types/public-profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Factory,
  User,
  ShoppingCart,
  MapPin,
  DollarSign,
  Star,
  Package,
  MessageSquare,
  CheckCircle,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

type AccountTypeFilter = "all" | "factory" | "middleman" | "seller" | "user";

export const ProfileDirectoryPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountType, setAccountType] = useState<AccountTypeFilter>("all");
  const [location, setLocation] = useState("");

  useEffect(() => {
    loadProfiles();
  }, [accountType]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await profileService.searchProfiles({
        search_term: searchTerm || undefined,
        account_type: accountType === "all" ? undefined : (accountType as any),
        location: location || undefined,
        limit: 50,
      });
      setProfiles(data);
    } catch (error) {
      console.error("Failed to load profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadProfiles();
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/factory/start-chat`);
    toast.info("Navigate to chat and select this user");
  };

  const getAccountTypeIcon = (accountType: string) => {
    switch (accountType) {
      case "factory":
        return <Factory className="h-3 w-3" />;
      case "seller":
        return <ShoppingCart className="h-3 w-3" />;
      case "middle_man":
        return <User className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Public Profiles</h1>
          <p className="text-muted-foreground">
            Browse and connect with factories, sellers, and middlemen
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="factory">🏭 Factories</option>
                <option value="middle_man">🤝 Middle Men</option>
                <option value="seller">🏪 Sellers</option>
                <option value="user">👤 Users</option>
              </select>

              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />

              <Button onClick={handleSearch}>
                <Filter className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading profiles...</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {profiles.length} Profile{profiles.length !== 1 ? "s" : ""}{" "}
                Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No profiles found</p>
                  <p className="text-sm">Try adjusting your search filters</p>
                </div>
              ) : (
                <ScrollArea className="h-[700px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map((profile) => (
                      <Card
                        key={profile.user_id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleProfileClick(profile.user_id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="h-12 w-12">
                              {profile.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt={profile.full_name || ""}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
                                  {profile.full_name?.charAt(0) || "U"}
                                </div>
                              )}
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">
                                  {profile.full_name || "User"}
                                </h3>
                                {profile.is_verified && (
                                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                                )}
                              </div>

                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {getAccountTypeIcon(profile.account_type)}
                                <span className="ml-1">
                                  {profile.account_type}
                                </span>
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm text-muted-foreground mb-3">
                            {profile.store_name && (
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="h-3 w-3" />
                                <span className="truncate">
                                  {profile.store_name}
                                </span>
                              </div>
                            )}
                            {profile.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">
                                  {profile.location}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Package className="h-3 w-3" />
                              <span>{profile.product_count} products</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>
                                {profile.average_rating > 0
                                  ? profile.average_rating.toFixed(1)
                                  : "N/A"}
                              </span>
                            </div>
                            {profile.total_revenue > 0 && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span>
                                  $
                                  {Number(
                                    profile.total_revenue,
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full"
                            size="sm"
                            onClick={handleContact}
                          >
                            <MessageSquare className="h-3 w-3 mr-2" />
                            Contact
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
