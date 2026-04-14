// Lightweight auth flow resolver.
// Given parsed URL hash parameters, determine the next navigation path.
// This intentionally avoids performing navigation or showing UI elements,
// leaving that to the caller. It also uses Supabase client to inspect
// session/state when needed.
import type { AuthHashParams } from "@/utils/authHash";
type AnySupabaseClient = any;

export type AuthFlowResult = {
  path: string;
  toast?: string;
  toastType?: "success" | "error";
};

export async function runAuthFlow(params: AuthHashParams, supabase: AnySupabaseClient): Promise<AuthFlowResult> {
  // Default path
  let path = "/login";
  let toast: string | undefined;
  let toastType: "success" | "error" | undefined;

  try {
    // OAuth error from provider
    if (params.errorCode) {
      toast = "Authentication failed. Please try again.";
      toastType = "error";
      return { path, toast, toastType };
    }

    // Handle recovery (password reset)
    if (params.type === "recovery") {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session) {
        path = "/update-password";
      } else {
        toast = "Password reset link is invalid or has expired. Please request a new one.";
        toastType = "error";
        path = "/forgot-password";
      }
      return { path, toast, toastType };
    }

    // Handle invite
    if (params.type === "invite") {
      path = "/signup";
      if (params.accessToken) {
        // If an access token is present, try to establish a session for the flow
        const { error } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken || "",
        });
        if (error) {
          // Fall back to signup if session fails
          path = "/signup";
        } else {
          toast = "You've been invited to join Aurora!";
          toastType = "success";
        }
      } else {
        toast = "You've been invited to join Aurora!";
        toastType = "success";
      }
      return { path, toast, toastType };
    }

    // Handle signup verification (email)
    if (params.type === "signup") {
      // Email verified indicates user should sign in
      path = "/login";
      toast = "Email verified successfully! Please sign in.";
      toastType = "success";
      return { path, toast, toastType };
    }

    // OAuth token presence
    if (params.accessToken) {
      const { error } = await supabase.auth.setSession({
        access_token: params.accessToken,
        refresh_token: params.refreshToken || "",
      });
      if (error) {
        return { path: "/login", toast: "Authentication failed. Please retry.", toastType: "error" };
      }
      // Best-effort: navigate to services area
      path = "/services";
      return { path, toast, toastType };
    }

    // Fallback: try to use existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      path = "/services";
    } else {
      path = "/login";
    }
    return { path };
  } catch {
    // In case of any error, default to login
    return { path: "/login" };
  }
}
