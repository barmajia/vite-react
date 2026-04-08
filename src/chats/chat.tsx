import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSession } from "@/lib/supabase";
import { ChatLayout } from "@/pages/chat/ChatLayout";
import { Login } from "@/pages/auth/Login";
import { Loader2, MessageCircle, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  // Removed unused states: userName, userUuid

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
  }, [navigate, searchParams]); // Fixed exhaustive-deps

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
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.05fr,0.95fr] gap-8 items-stretch">
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Aurora Chat</p>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  Sign in to continue the conversation
                </h2>
              </div>
            </div>
            <p className="text-slate-300/90 mb-6">
              Secure, multi-vertical chat for customers, factories, middlemen,
              and services. Your session keeps conversations synced across
              devices.
            </p>
            <Login />
            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-200/80">
              <span>New here?</span>
              <Button
                variant="secondary"
                className="bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => navigate("/signup?returnTo=/chat")}
              >
                Create an account
              </Button>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-4 text-white bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-semibold">Secure by design</p>
                <p className="text-slate-300 text-sm">
                  Row-level security, sanitized inputs, and session checks
                  before every chat action.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <Zap className="h-5 w-5 text-amber-300" />
              <div>
                <p className="font-semibold">Instant sync</p>
                <p className="text-slate-300 text-sm">
                  Conversations update in real time across devices and
                  verticals.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <MessageCircle className="h-5 w-5 text-sky-300" />
              <div>
                <p className="font-semibold">One inbox, all roles</p>
                <p className="text-slate-300 text-sm">
                  Customers, factories, middlemen, and providers meet in one
                  consolidated inbox.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ChatLayout />;
};
