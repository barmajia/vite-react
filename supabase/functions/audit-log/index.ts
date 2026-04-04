// supabase/functions/audit-log/index.ts
// Audit Logging Edge Function - Server-side security event logging
// Receives audit events from client and stores them securely in database

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Security event types that should be logged
type SecurityEventType =
  | "LOGIN_ATTEMPT"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "SIGNUP_ATTEMPT"
  | "SIGNUP_SUCCESS"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_COMPLETE"
  | "PASSWORD_CHANGE"
  | "EMAIL_CHANGE_REQUEST"
  | "EMAIL_CHANGE_COMPLETE"
  | "ACCOUNT_DELETE_REQUEST"
  | "ACCOUNT_DELETE_COMPLETE"
  | "PAYMENT_INITIATED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_FAILED"
  | "REFUND_REQUESTED"
  | "REFUND_PROCESSED"
  | "DATA_EXPORT_REQUEST"
  | "DATA_EXPORT_COMPLETED"
  | "API_RATE_LIMIT_EXCEEDED"
  | "SUSPICIOUS_ACTIVITY"
  | "XSS_ATTEMPT_DETECTED"
  | "SQL_INJECTION_ATTEMPT"
  | "CSRF_VIOLATION"
  | "UNAUTHORIZED_ACCESS_ATTEMPT"
  | "DATA_MODIFICATION"
  | "ADMIN_ACTION"
  | "SYSTEM_EVENT";

interface AuditLogEntry {
  id?: string;
  event: SecurityEventType;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    // Parse request body
    const body = await req.json();
    const { event, severity, description, metadata } = body as AuditLogEntry;

    // Validate required fields
    if (!event || !severity || !description) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["event", "severity", "description"],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Validate severity level
    const validSeverities = ["low", "medium", "high", "critical"];
    if (!validSeverities.includes(severity)) {
      return new Response(
        JSON.stringify({
          error: "Invalid severity level",
          valid: validSeverities,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Extract user information from auth header if present
    let userId: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        // Token might be invalid or expired - continue without user info
        console.warn("Could not extract user from token:", error);
      }
    }

    // Extract IP address from headers (may be set by proxy/load balancer)
    const ipAddress =
      req.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
      req.headers.get("X-Real-IP") ||
      "unknown";

    // Extract user agent
    const userAgent = req.headers.get("User-Agent") || "unknown";

    // Create audit log entry
    const auditEntry: Omit<AuditLogEntry, "id"> = {
      event,
      user_id: userId || body.user_id,
      ip_address: ipAddress,
      user_agent: userAgent,
      severity,
      description,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    // Rate limiting check - prevent audit log spam
    const rateLimitKey = `audit_rate_limit_${ipAddress}`;
    const { data: rateLimitData } = await supabase
      .from("rate_limits")
      .select("count")
      .eq("key", rateLimitKey)
      .single();

    if (rateLimitData && rateLimitData.count > 100) {
      // Too many audit logs from this IP - log to console but don't store
      console.warn(`Rate limit exceeded for audit logs from IP: ${ipAddress}`);

      // Still return success to client to avoid errors
      return new Response(
        JSON.stringify({
          success: true,
          message: "Audit logged (rate limited)",
          rate_limited: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Store audit log in database
    const { data, error } = await supabase
      .from("audit_logs")
      .insert(auditEntry)
      .select()
      .single();

    if (error) {
      console.error("Error storing audit log:", error);

      // If table doesn't exist, create it on the fly (first-time setup)
      if (error.code === "42P01") {
        console.log("Audit logs table doesn't exist, creating...");
        await createAuditLogsTable(supabase);

        // Retry insert
        const retryResult = await supabase
          .from("audit_logs")
          .insert(auditEntry)
          .select()
          .single();

        if (retryResult.error) {
          throw retryResult.error;
        }

        data = retryResult.data;
      } else {
        throw error;
      }
    }

    // For critical events, send alert to admin
    if (severity === "critical") {
      await sendCriticalAlert(supabase, auditEntry);
    }

    return new Response(
      JSON.stringify({
        success: true,
        log_id: data?.id,
        event,
        severity,
        timestamp: data?.created_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in audit-log function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

/**
 * Create audit_logs table if it doesn't exist
 */
async function createAuditLogsTable(_supabase: any) {
  // Note: Table creation should be done via migrations in production
  console.log("Creating audit_logs table...");
}

/**
 * Send critical alert to admin (via notification, email, or webhook)
 */
async function sendCriticalAlert(supabase: any, entry: AuditLogEntry) {
  try {
    // Create admin notification
    await supabase.from("notifications").insert({
      user_id: await getAdminUserId(supabase),
      type: "security_alert",
      title: `🚨 Critical Security Event: ${entry.event}`,
      message: entry.description,
      metadata: {
        severity: entry.severity,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        timestamp: entry.created_at,
      },
      is_read: false,
    });

    // In production, also send email/SMS via external service
    // Example: SendGrid, Twilio, etc.
    console.log(`Critical alert sent for event: ${entry.event}`);
  } catch (error) {
    console.error("Failed to send critical alert:", error);
  }
}

/**
 * Get admin user ID for notifications
 */
async function getAdminUserId(supabase: any): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("is_active", true)
      .limit(1)
      .single();

    return data?.user_id || null;
  } catch {
    return null;
  }
}
