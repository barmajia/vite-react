import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSession } from "@/lib/supabase";
import { ChatLayout } from "@/pages/chat/ChatLayout";
import { Login } from "@/pages/auth/Login";
import { Loader2 } from "lucide-react";

export const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
   
  const [_userName, setUserName] = useState<string | null>(null);
   
  const [_userUuid, setUserUuid] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();

        if (session) {
          setHasSession(true);
          setUserName(
            session.user.user_metadata?.full_name || session.user.email,
          );
          setUserUuid(session.user.id);

          // Auto-populate current user ID in URL if not already set
          const currentUserId = searchParams.get("id");
          if (!currentUserId) {
            navigate(`/chat?id=${session.user.id}`, { replace: true });
          }
        } else {
          setHasSession(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setHasSession(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [navigate, searchParams]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center pt-16">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign in to Chat</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to access your conversations
          </p>
          <Login />
        </div>
      </div>
    );
  }

  return <ChatLayout />;
};
