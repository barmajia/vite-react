// supabase/functions/process-async-jobs/index.ts
// Job Queue Processor Edge Function
// Processes async jobs from the queue with retry logic and error handling

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Job types supported by the queue
type JobType = 
  | "send_email"
  | "generate_pdf"
  | "process_image"
  | "sync_inventory"
  | "send_notification"
  | "export_data"
  | "cleanup_data"
  | "webhook_delivery"
  | "analytics_update";

interface JobPayload {
  type: JobType;
  data: Record<string, unknown>;
  max_retries?: number;
  priority?: number;
}

interface AsyncJob {
  id: string;
  queue_name: string;
  payload: JobPayload;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  scheduled_for: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with SERVICE ROLE
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get queue name from query params (default: "default")
    const url = new URL(req.url);
    const queueName = url.searchParams.get("queue") || "default";
    const batchSize = parseInt(url.searchParams.get("batch") || "10");

    // Fetch pending jobs from the queue
    const { data: jobs, error: fetchError } = await supabase
      .from("async_jobs")
      .select("*")
      .eq("queue_name", queueName)
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending jobs",
          queue: queueName,
          processed: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Processing ${jobs.length} jobs from queue: ${queueName}`);

    const results = {
      success: 0,
      failed: 0,
      total: jobs.length,
      jobs: [] as Array<{ id: string; status: string; error?: string }>,
    };

    // Process each job
    for (const job of jobs as AsyncJob[]) {
      try {
        // Mark job as processing
        await supabase
          .from("async_jobs")
          .update({
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        // Execute job based on type
        await executeJob(supabase, job);

        // Mark job as completed
        await supabase
          .from("async_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        results.success++;
        results.jobs.push({ id: job.id, status: "completed" });
        console.log(`Job ${job.id} completed successfully`);

      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        // Check if we should retry
        const maxRetries = job.payload.max_retries || 3;
        const newAttempts = job.attempts + 1;

        if (newAttempts < maxRetries) {
          // Schedule retry with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, newAttempts), 300000); // Max 5 min
          const nextAttempt = new Date(Date.now() + retryDelay);

          await supabase
            .from("async_jobs")
            .update({
              status: "pending",
              attempts: newAttempts,
              error: errorMessage,
              scheduled_for: nextAttempt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          results.jobs.push({ 
            id: job.id, 
            status: "retry_scheduled", 
            error: errorMessage,
          });
          console.log(`Job ${job.id} scheduled for retry at ${nextAttempt.toISOString()}`);
        } else {
          // Max retries exceeded - mark as failed
          await supabase
            .from("async_jobs")
            .update({
              status: "failed",
              attempts: newAttempts,
              error: errorMessage,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          results.failed++;
          results.jobs.push({ id: job.id, status: "failed", error: errorMessage });
          
          // Log failed job for manual review
          await supabase.from("audit_logs").insert({
            event: "JOB_FAILED",
            severity: "high",
            description: `Job ${job.id} failed after ${newAttempts} attempts`,
            metadata: {
              job_id: job.id,
              queue_name: queueName,
              job_type: job.payload.type,
              error: errorMessage,
              attempts: newAttempts,
            },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        queue: queueName,
        processed: results.total,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in process-async-jobs:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/**
 * Execute job based on type
 */
async function executeJob(supabase: any, job: AsyncJob) {
  const { type, data } = job.payload;

  switch (type) {
    case "send_email":
      await executeSendEmail(supabase, data);
      break;
    
    case "send_notification":
      await executeSendNotification(supabase, data);
      break;
    
    case "generate_pdf":
      await executeGeneratePdf(supabase, data);
      break;
    
    case "process_image":
      await executeProcessImage(supabase, data);
      break;
    
    case "sync_inventory":
      await executeSyncInventory(supabase, data);
      break;
    
    case "export_data":
      await executeExportData(supabase, data);
      break;
    
    case "cleanup_data":
      await executeCleanupData(supabase, data);
      break;
    
    case "webhook_delivery":
      await executeWebhookDelivery(supabase, data);
      break;
    
    case "analytics_update":
      await executeAnalyticsUpdate(supabase, data);
      break;
    
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

/**
 * Send email job
 */
async function executeSendEmail(supabase: any, data: Record<string, unknown>) {
  const { to, subject, body, html } = data;
  
  // In production, integrate with SendGrid, Resend, or AWS SES
  console.log(`Sending email to ${to}: ${subject}`);
  
  // Example with Resend API:
  // const resendKey = Deno.env.get("RESEND_API_KEY");
  // await fetch("https://api.resend.com/emails", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${resendKey}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     from: "Aurora <noreply@aurora.com>",
  //     to,
  //     subject,
  //     html: html || body,
  //   }),
  // });
}

/**
 * Send notification job
 */
async function executeSendNotification(supabase: any, data: Record<string, unknown>) {
  const { user_id, title, message, type, metadata } = data;
  
  await supabase.from("notifications").insert({
    user_id,
    type: type || "system",
    title,
    message,
    metadata: metadata || {},
    is_read: false,
  });
}

/**
 * Generate PDF job (invoices, reports, etc.)
 */
async function executeGeneratePdf(supabase: any, data: Record<string, unknown>) {
  const { type, orderId, userId } = data;
  
  // In production, use a PDF generation library or service
  console.log(`Generating PDF: ${type} for order ${orderId}`);
  
  // Example: Generate invoice PDF and upload to Supabase Storage
  // const pdfBytes = await generateInvoicePDF(orderId);
  // await supabase.storage.from("invoices").upload(`invoice_${orderId}.pdf`, pdfBytes);
}

/**
 * Process image job (resize, optimize, etc.)
 */
async function executeProcessImage(supabase: any, data: Record<string, unknown>) {
  const { imageUrl, operations } = data;
  
  console.log(`Processing image: ${imageUrl}`);
  
  // In production, use Imgix, Cloudinary, or Sharp
}

/**
 * Sync inventory job
 */
async function executeSyncInventory(supabase: any, data: Record<string, unknown>) {
  const { sellerId, products } = data;
  
  console.log(`Syncing inventory for seller ${sellerId}`);
  
  // Update product quantities based on external system
}

/**
 * Export data job (GDPR compliance)
 */
async function executeExportData(supabase: any, data: Record<string, unknown>) {
  const { userId, exportType } = data;
  
  console.log(`Exporting data for user ${userId}: ${exportType}`);
  
  // Gather user data and create export file
  // Upload to storage and send download link via email
}

/**
 * Cleanup data job
 */
async function executeCleanupData(supabase: any, data: Record<string, unknown>) {
  const { targetType, olderThan } = data;
  
  console.log(`Cleaning up ${targetType} older than ${olderThan}`);
  
  // Delete old temporary data
}

/**
 * Webhook delivery job
 */
async function executeWebhookDelivery(supabase: any, data: Record<string, unknown>) {
  const { url, payload, headers } = data;
  
  console.log(`Delivering webhook to ${url}`);
  
  await fetch(url as string, {
    method: "POST",
    headers: headers as Record<string, string>,
    body: JSON.stringify(payload),
  });
}

/**
 * Analytics update job
 */
async function executeAnalyticsUpdate(supabase: any, data: Record<string, unknown>) {
  const { sellerId, period } = data;
  
  console.log(`Updating analytics for seller ${sellerId}`);
  
  // Call analytics function to refresh materialized views
  // await supabase.rpc("refresh_seller_analytics", { seller_id: sellerId });
}
