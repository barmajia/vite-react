// ChatHeader Component for Aurora Chat System
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSession } from "@/lib/supabase";
import {
  ArrowLeft,
  MoreVertical,
  Search,
  Video,
  Phone,
  LogOut,
  User,
  Settings,
  Moon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/shared/Logo";
import { StartNewChat } from "@/components/chat/StartNewChat";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  userName?: string | null;
  userUuid?: string | null;
}

export function ChatHeader({
  showBackButton = false,
  onBack,
  userName,
  userUuid,
}: ChatHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [displayUuid, setDisplayUuid] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Scroll detection for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get user info from session or props
  useEffect(() => {
    const getUserInfo = async () => {
      if (userName && userUuid) {
        setDisplayName(userName);
        setDisplayUuid(userUuid);
      } else {
        const session = await getSession();
        if (session) {
          setDisplayName(
            session.user.user_metadata?.full_name || session.user.email,
          );
          setDisplayUuid(session.user.id);
        }
      }
    };
    getUserInfo();
  }, [userName, userUuid]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search within chats or filter conversations
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b bg-card",
        isScrolled
          ? "bg-card/95 backdrop-blur-lg shadow-sm"
          : "bg-card border-b",
      )}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Back Button & Logo */}
          <div className="flex items-center gap-3">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            {/* Aurora Logo */}
            <Link to="/" className="hover:opacity-90 transition-opacity">
              <Logo size="md" showText={true} />
            </Link>
          </div>

          {/* Center - Search Bar (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search or start new chat"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </form>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Action Buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              title="Start Call (Coming Soon)"
              disabled
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              title="Start Video Call (Coming Soon)"
              disabled
            >
              <Video className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Avatar
                      name={displayName || user.email}
                      src={user.user_metadata.avatar_url}
                      size="sm"
                      className="w-8 h-8"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={displayName || user.email}
                          src={user.user_metadata.avatar_url}
                          size="md"
                          className="w-8 h-8"
                        />
                        <div>
                          <p className="text-sm font-semibold">
                            {displayName || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {displayUuid
                              ? `${displayUuid.slice(0, 8)}...${displayUuid.slice(-4)}`
                              : user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      document.documentElement.classList.toggle("dark")
                    }
                    className="cursor-pointer"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Toggle Theme</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            )}

            {/* New Chat Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsNewChatOpen(true)}
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* More Options */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* New Chat Dialog */}
      <StartNewChat open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
    </header>
  );
}
