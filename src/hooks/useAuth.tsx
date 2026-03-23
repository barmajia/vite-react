import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, onAuthStateChange, getSession } from "@/lib/supabase";
import { validatePassword } from "@/utils/sanitize";
import { authRateLimiter } from "@/lib/security";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; data: any }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    accountType?: "buyer" | "seller" | "provider",
  ) => Promise<{ error: Error | null }>;
  signUpWithRole: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: "client" | "individual" | "company" | "hospital",
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  resendVerification: (email: string) => Promise<{ error: Error | null }>;
  checkProviderProfile: () => Promise<{
    hasProviderProfile: boolean;
    status?: string;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((sessionData) => {
      setSession(sessionData);
      setUser(sessionData?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = onAuthStateChange((_event, sessionData: Session | null) => {
      setSession(sessionData);
      setUser(sessionData?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!authRateLimiter.isAllowed(email)) {
      const waitTime = authRateLimiter.getBlockTimeRemaining(email);
      return {
        data: null,
        error: new Error(`Too many attempts. Try again in ${waitTime} seconds.`),
      };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        authRateLimiter.recordAttempt(email);
        // Log the full error for debugging
        console.error("Supabase Auth Error:", {
          message: error.message,
          status: error.status,
          code: (error as any).code,
        });

        // Handle specific error cases
        const errorCode = (error as any).code;

        if (
          errorCode === "email_not_confirmed" ||
          error.message?.includes("Email not confirmed")
        ) {
          return {
            data: null,
            error: {
              ...error,
              message:
                "Please verify your email before signing in. Check your inbox and spam folder.",
            } as Error,
          };
        }

        if (
          errorCode === "invalid_credentials" ||
          error.message?.includes("Invalid login credentials")
        ) {
          return {
            data: null,
            error: {
              ...error,
              message: "Invalid email or password. Please try again.",
            } as Error,
          };
        }

        if (errorCode === "user_not_found") {
          return {
            data: null,
            error: {
              ...error,
              message: "No account found with this email address.",
            } as Error,
          };
        }

        if (errorCode === "rate_limit_exceeded" || error.status === 429) {
          return {
            data: null,
            error: {
              ...error,
              message: "Too many attempts. Please wait a moment and try again.",
            } as Error,
          };
        }
      }

      return { data, error: error as Error | null };
    } catch (err: any) {
      console.error("Unexpected sign in error:", err);
      return {
        data: null,
        error: new Error("An unexpected error occurred. Please try again."),
      };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    accountType: "buyer" | "seller" | "provider" = "buyer",
  ) => {
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return { error: new Error(passwordCheck.errors[0]) };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signUpWithRole = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: "client" | "individual" | "company" | "hospital",
  ) => {
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return { error: new Error(passwordCheck.errors[0]) };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          account_type: role === "client" ? "user" : "provider",
          intended_role: role,
          source_app: "services",
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const resendVerification = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      return { error: error as Error | null };
    } catch (err: any) {
      console.error("Resend verification error:", err);
      return { error: err as Error };
    }
  };

  const checkProviderProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { hasProviderProfile: false };

    const { data: provider } = await supabase
      .from("svc_providers")
      .select("status")
      .eq("user_id", user.id)
      .single();

    if (!provider) return { hasProviderProfile: false };
    return { hasProviderProfile: true, status: provider.status };
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signUpWithRole,
    signOut,
    resetPassword,
    resendVerification,
    checkProviderProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
