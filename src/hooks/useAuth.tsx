import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import {
  supabase,
  onAuthStateChange,
  getSession,
  clearAuthStorage,
} from "@/lib/supabase";
import {
  validatePassword,
  validateEmail,
  detectSqlInjection,
  detectXss,
} from "@/utils/sanitize";
import {
  authRateLimiter,
  resetRateLimiter,
  signupRateLimiter,
} from "@/lib/security";

// Json type for Supabase responses
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
    accountType?:
      | "buyer"
      | "seller"
      | "provider"
      | "factory"
      | "delivery_driver",
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
  changePassword: (
    newPassword: string,
    currentPassword?: string,
  ) => Promise<{ error: Error | null }>;
  changeEmail: (newEmail: string) => Promise<{ error: Error | null }>;
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

    const subscription = onAuthStateChange(
      (_event, sessionData: Session | null) => {
        setSession(sessionData);
        setUser(sessionData?.user ?? null);
        setLoading(false);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with enhanced security
   */
  const signIn = async (email: string, password: string) => {
    // Input validation
    if (!email || !password) {
      return {
        data: null,
        error: new Error("Email and password are required"),
      };
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return {
        data: null,
        error: new Error("Please enter a valid email address"),
      };
    }

    // Check for SQL injection and XSS
    if (detectSqlInjection(email) || detectXss(email)) {
      console.warn("Malicious input detected in login attempt");
      return {
        data: null,
        error: new Error("Invalid input detected"),
      };
    }

    // Rate limiting check
    if (!authRateLimiter.isAllowed(sanitizedEmail)) {
      const waitTime = authRateLimiter.getBlockTimeRemaining(sanitizedEmail);
      return {
        data: null,
        error: new Error(
          `Too many attempts. Try again in ${waitTime} seconds.`,
        ),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        // Record failed attempt
        authRateLimiter.recordAttempt(sanitizedEmail);

        // Log the full error for debugging (remove in production)
        if (import.meta.env.DEV) {
          console.error("Supabase Auth Error:", {
            message: error.message,
            status: error.status,
            code: (error as any).code,
          });
        }

        // Handle specific error cases with user-friendly messages
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

        // Generic error for other cases
        return {
          data: null,
          error: {
            ...error,
            message:
              "Unable to sign in. Please check your credentials and try again.",
          } as Error,
        };
      }

      // Clear rate limiter on successful login
      authRateLimiter.clear(sanitizedEmail);

      return { data, error: null };
    } catch (err) {
      console.error("Unexpected sign in error:", err);
      return {
        data: null,
        error: new Error("An unexpected error occurred. Please try again."),
      };
    }
  };

  /**
   * Sign up with enhanced security and validation
   */
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    accountType:
      | "buyer"
      | "seller"
      | "provider"
      | "factory"
      | "delivery_driver" = "buyer",
  ) => {
    // Input validation
    if (!email || !password) {
      return { error: new Error("Email and password are required") };
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = fullName?.trim() || "";

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return { error: new Error("Please enter a valid email address") };
    }

    // Check for malicious input
    if (
      detectSqlInjection(email) ||
      detectXss(email) ||
      (fullName && (detectSqlInjection(fullName) || detectXss(fullName)))
    ) {
      console.warn("Malicious input detected in signup attempt");
      return { error: new Error("Invalid input detected") };
    }

    // Rate limiting for signup
    const rateLimitKey = `signup:${sanitizedEmail}`;
    if (!signupRateLimiter.isAllowed(rateLimitKey)) {
      const waitTime = signupRateLimiter.getBlockTimeRemaining(rateLimitKey);
      return {
        error: new Error(
          `Too many signup attempts. Try again in ${waitTime} seconds.`,
        ),
      };
    }

    // Password validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return { error: new Error(passwordCheck.errors[0]) };
    }

    try {
      const { error, data } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            full_name: sanitizedName || undefined,
            account_type: accountType || "customer",
          },
          // Remove emailRedirectTo to avoid 500 error
          // emailRedirectTo: import.meta.env.VITE_APP_URL,
        },
      });

      if (error) {
        console.error("Signup error:", error);
        signupRateLimiter.recordAttempt(rateLimitKey);
        return { error: error as Error };
      }

      // Clear rate limiter on successful signup
      signupRateLimiter.clear(rateLimitKey);

      // User profile is safely created via the secure database trigger (`handle_new_user`)
      // which has been updated to validate the requested account_type.

      return { error: null };
    } catch (err) {
      console.error("Unexpected sign up error:", err);
      return {
        error: new Error("An unexpected error occurred. Please try again."),
      };
    }
  };

  /**
   * Sign up with role selection (for services marketplace)
   */
  const signUpWithRole = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: "client" | "individual" | "company" | "hospital",
  ) => {
    // Input validation
    if (!email || !password || !fullName) {
      return {
        error: new Error("Email, password, and full name are required"),
      };
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = fullName.trim();
    const sanitizedPhone = phone.trim();

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return { error: new Error("Please enter a valid email address") };
    }

    // Check for malicious input
    if (
      detectSqlInjection(email) ||
      detectXss(email) ||
      detectSqlInjection(fullName) ||
      detectXss(fullName) ||
      detectSqlInjection(phone) ||
      detectXss(phone)
    ) {
      console.warn("Malicious input detected in signup attempt");
      return { error: new Error("Invalid input detected") };
    }

    // Rate limiting
    const rateLimitKey = `signup:${sanitizedEmail}`;
    if (!signupRateLimiter.isAllowed(rateLimitKey)) {
      const waitTime = signupRateLimiter.getBlockTimeRemaining(rateLimitKey);
      return {
        error: new Error(
          `Too many signup attempts. Try again in ${waitTime} seconds.`,
        ),
      };
    }

    // Password validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return { error: new Error(passwordCheck.errors[0]) };
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            full_name: sanitizedName,
            phone: sanitizedPhone,
            account_type: role === "client" ? "user" : "provider",
            intended_role: role,
            source_app: "services",
          },
          emailRedirectTo: import.meta.env.VITE_APP_URL,
        },
      });

      if (error) {
        signupRateLimiter.recordAttempt(rateLimitKey);
        return { error: error as Error };
      }

      signupRateLimiter.clear(rateLimitKey);
      return { error: null };
    } catch (err) {
      console.error("Unexpected sign up error:", err);
      return {
        error: new Error("An unexpected error occurred. Please try again."),
      };
    }
  };

  /**
   * Sign out with cleanup
   */
  const signOut = async () => {
    try {
      // Clear auth storage (CSRF token, cookies, etc.)
      clearAuthStorage();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear state
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      // Still clear local storage even if sign out fails
      clearAuthStorage();
      setSession(null);
      setUser(null);
    }
  };

  /**
   * Reset password with rate limiting
   */
  const resetPassword = async (email: string) => {
    if (!email) {
      return { error: new Error("Email is required") };
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return { error: new Error("Please enter a valid email address") };
    }

    // Rate limiting for password reset
    if (!resetRateLimiter.isAllowed(sanitizedEmail)) {
      const waitTime = resetRateLimiter.getBlockTimeRemaining(sanitizedEmail);
      return {
        error: new Error(
          `Too many requests. Try again in ${waitTime} seconds.`,
        ),
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
      });

      if (error) {
        resetRateLimiter.recordAttempt(sanitizedEmail);
        return { error: error as Error };
      }

      // Don't clear rate limiter on success to prevent abuse
      // It will clear automatically after the time window

      return { error: null };
    } catch (err) {
      console.error("Password reset error:", err);
      return {
        error: new Error("An unexpected error occurred. Please try again."),
      };
    }
  };

  /**
   * Resend verification email
   */
  const resendVerification = async (email: string) => {
    if (!email) {
      return { error: new Error("Email is required") };
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return { error: new Error("Please enter a valid email address") };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: sanitizedEmail,
      });

      if (error) {
        return { error: error as Error };
      }

      return { error: null };
    } catch (err) {
      console.error("Resend verification error:", err);
      return {
        error: new Error("An unexpected error occurred. Please try again."),
      };
    }
  };

  /**
   * Check if user has a service provider profile
   */
  const checkProviderProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { hasProviderProfile: false };

    try {
      const { data: provider, error } = await supabase
        .from("svc_providers")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (error || !provider) {
        return { hasProviderProfile: false };
      }

      return { hasProviderProfile: true, status: provider.status };
    } catch (error) {
      console.error("Error checking provider profile:", error);
      return { hasProviderProfile: false };
    }
  };

  /**
   * Change password (sensitive operation)
   */
  const changePassword = async (
    newPassword: string,
    currentPassword?: string,
  ) => {
    // Validate new password
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return { error: new Error(passwordCheck.errors[0]) };
    }

    try {
      // If current password is provided, verify it first
      if (currentPassword && user?.email) {
        // Sign out current session and sign in with new credentials
        // This is a simplified approach - in production, use Supabase's reauthentication
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          return { error: new Error("Current password is incorrect") };
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error as Error };
      }

      return { error: null };
    } catch (err) {
      console.error("Password change error:", err);
      return {
        error: new Error("An unexpected error occurred. Please try again."),
      };
    }
  };

  /**
   * Change email (sensitive operation)
   */
  const changeEmail = async (newEmail: string) => {
    if (!newEmail) {
      return { error: new Error("New email is required") };
    }

    const sanitizedEmail = newEmail.trim().toLowerCase();

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return { error: new Error("Please enter a valid email address") };
    }

    // Check for malicious input
    if (detectSqlInjection(newEmail) || detectXss(newEmail)) {
      console.warn("Malicious input detected in email change attempt");
      return { error: new Error("Invalid input detected") };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: sanitizedEmail,
      });

      if (error) {
        return { error: error as Error };
      }

      return { error: null };
    } catch (err) {
      console.error("Email change error:", err);
      return {
        error: new Error("An unexpected error occurred. Please try again."),
      };
    }
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
    changePassword,
    changeEmail,
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
