// supabase/functions/create-fawry-payment/index.ts
// Fawry Payment Integration - Secure Edge Function
// Generates signature server-side, enforces EGP, prevents duplicates

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
    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id is required");

    // 1. Initialize Supabase Client with Service Role (to bypass RLS for verification)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Get Auth User
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // 3. Verify Order Ownership & Status
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, shipping_addresses(id, address_line1, city, phone)")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) throw new Error("Order not found or unauthorized");
    if (order.status !== "pending") throw new Error("Order is not pending");

    // 4. IDEMPOTENCY & RATE LIMIT CHECK
    // Prevent duplicate payment process and mitigate hammering the Fawry API
    const { data: recentIntentions } = await supabase
      .from("payment_intentions")
      .select("id, status, created_at, provider_reference_id, checkout_url")
      .eq("order_id", order_id)
      .eq("payment_method", "fawry")
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentIntentions && recentIntentions.length > 0) {
      const recent = recentIntentions[0];
      const createdAt = new Date(recent.created_at).getTime();
      const now = new Date().getTime();
      const secondsSince = (now - createdAt) / 1000;

      // If there's a pending session created less than 30 seconds ago, return it (Rate Limit)
      if (recent.status === "pending" && secondsSince < 30) {
        console.log(`Rate limit: Returning existing session created ${secondsSince}s ago`);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Please wait a moment before trying again. Returning your existing session.",
            referenceNumber: recent.provider_reference_id,
            checkoutUrl: recent.checkout_url,
            existing: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // If there's a pending session (even if older), we still return it to follow idempotency
      if (recent.status === "pending") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment session already created",
            referenceNumber: recent.provider_reference_id,
            checkoutUrl: recent.checkout_url,
            existing: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // 5. Prepare Fawry Data (Force EGP)
    const merchantCode = Deno.env.get("FAWRY_MERCHANT_CODE");
    const secretKey = Deno.env.get("FAWRY_SECRET_KEY");
    const baseUrl = Deno.env.get("FAWRY_BASE_URL") || "https://atfawry.fawry.com/api";
    
    if (!merchantCode || !secretKey) {
      throw new Error("Fawry credentials not configured");
    }

    const amount = parseFloat(order.total.toString()).toFixed(2);
    const currency = "EGP"; // FORCE EGYPTIAN POUND
    const timestamp = new Date().toISOString();
    const merchantRefNo = `ORD-${order_id}-${Date.now()}`; // Unique reference for Fawry

    // 6. Generate Security Signature (SHA256)
    // Format: merchantCode + merchantRefNo + timestamp + amount + currency + secretKey
    const stringToHash = `${merchantCode}${merchantRefNo}${timestamp}${amount}${currency}${secretKey}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToHash);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // 7. Call Fawry API (Request Payment Link)
    const fawryPayload = {
      merchantCode,
      merchantRefNo,
      language: "en", // or 'ar' for Arabic
      expiry: 3600, // 1 hour
      currency,
      amount,
      description: `Order ${order_id} - Aurora E-commerce`,
      customerDetails: {
        name: order.shipping_addresses?.full_name || user.user_metadata?.full_name || user.email,
        mobile: order.shipping_addresses?.phone || user.user_metadata?.phone || "",
        email: user.email,
      },
      signature,
    };

    const fawryResponse = await fetch(`${baseUrl}/v2/charges/payPage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fawryPayload),
    });

    const fawryData = await fawryResponse.json();

    if (!fawryResponse.ok || fawryData.status !== "SUCCESS") {
      console.error("Fawry API Error:", fawryData);
      throw new Error(`Fawry API Error: ${fawryData.message || "Failed to initialize payment"}`);
    }

    const checkoutUrl = fawryData.data?.url; // The URL user visits
    const referenceNumber = fawryData.data?.referenceNumber;

    if (!checkoutUrl && !referenceNumber) {
      throw new Error("Fawry did not return a payment URL or reference number");
    }

    // 8. Save Payment Intention to DB
    const { error: insertError } = await supabase.from("payment_intentions").insert({
      order_id: order.id,
      user_id: user.id,
      amount: parseFloat(amount),
      currency: "EGP",
      status: "pending",
      payment_method: "fawry",
      provider: "fawry",
      provider_reference_id: referenceNumber,
      checkout_url: checkoutUrl,
      provider_metadata: {
        merchantRefNo,
        timestamp,
        signature_sent: true,
        fawry_response: fawryData.data,
      },
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl,
        referenceNumber,
        message: "Payment session created successfully",
        amount,
        currency: "EGP",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error creating Fawry payment:", error);
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
