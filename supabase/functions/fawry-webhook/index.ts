// supabase/functions/fawry-webhook/index.ts
// Fawry Webhook Handler - Verifies signature & updates order status
// Called by Fawry when payment is completed

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Parse incoming webhook payload
    const webhookData = await req.json();
    console.log("Fawry webhook received:", webhookData);

    // 2. Initialize Supabase Client with Service Role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Verify Webhook Signature (CRITICAL SECURITY STEP)
    // Fawry sends a signature that we must verify
    const merchantCode = Deno.env.get("FAWRY_MERCHANT_CODE");
    const secretKey = Deno.env.get("FAWRY_SECRET_KEY");
    
    if (!merchantCode || !secretKey) {
      throw new Error("Fawry credentials not configured");
    }

    // Extract webhook data
    const {
      merchantCode: webhookMerchantCode,
      merchantRefNo,
      amount,
      currency,
      signature: webhookSignature,
      status: paymentStatus,
      referenceNumber,
    } = webhookData;

    // Verify merchant code matches
    if (webhookMerchantCode !== merchantCode) {
      throw new Error("Invalid merchant code in webhook");
    }

    // Re-calculate signature to verify authenticity
    // Format: merchantCode + merchantRefNo + amount + currency + secretKey
    // Note: Check Fawry docs for exact webhook signature format
    const stringToHash = `${merchantCode}${merchantRefNo}${amount}${currency}${secretKey}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToHash);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Compare signatures (use constant-time comparison in production)
    if (calculatedSignature !== webhookSignature) {
      console.error("Signature mismatch!");
      console.error("Expected:", webhookSignature);
      console.error("Calculated:", calculatedSignature);
      throw new Error("Invalid webhook signature - possible fraud attempt");
    }

    console.log("✓ Webhook signature verified");

    // 4. Find Payment Intention by merchant reference
    const { data: paymentIntention, error: findError } = await supabase
      .from("payment_intentions")
      .select("*, orders(id, user_id, status, payment_status, total)")
      .eq("provider_reference_id", referenceNumber || merchantRefNo)
      .single();

    if (findError || !paymentIntention) {
      throw new Error("Payment intention not found");
    }

    // 5. Check if already processed (idempotency)
    if (paymentIntention.status === "succeeded") {
      console.log("Payment already processed, skipping");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Payment already processed",
          status: paymentIntention.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 6. Determine new status based on Fawry response
    let newStatus = "pending";
    if (paymentStatus === "SUCCESS" || paymentStatus === "CAPTURED") {
      newStatus = "succeeded";
    } else if (paymentStatus === "FAILED" || paymentStatus === "DECLINED") {
      newStatus = "failed";
    } else if (paymentStatus === "CANCELLED") {
      newStatus = "cancelled";
    }

    console.log(`Updating payment status to: ${newStatus}`);

    // 7. Update Payment Intention
    const { error: updateError } = await supabase
      .from("payment_intentions")
      .update({
        status: newStatus,
        provider_metadata: {
          ...paymentIntention.provider_metadata,
          webhook_received: true,
          webhook_timestamp: new Date().toISOString(),
          fawry_status: paymentStatus,
          verified_signature: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentIntention.id);

    if (updateError) throw updateError;

    // 8. If payment succeeded, update Order status
    if (newStatus === "succeeded") {
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentIntention.order_id);

      if (orderUpdateError) throw orderUpdateError;

      console.log(`✓ Order ${paymentIntention.order_id} marked as confirmed`);

      // 9. Optional: Send notification to user
      // You can trigger a notification here or use Supabase triggers
      await supabase.from("notifications").insert({
        user_id: paymentIntention.user_id,
        title: "Payment Successful",
        message: `Your order ${paymentIntention.order_id} has been confirmed!`,
        type: "order_confirmation",
        is_read: false,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook processed successfully",
        order_id: paymentIntention.order_id,
        payment_status: newStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error processing Fawry webhook:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
