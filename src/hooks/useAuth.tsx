import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, onAuthStateChange, getSession } from "@/lib/supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    accountType: "buyer" | "seller" | "provider" = "buyer",
  ) => {
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
