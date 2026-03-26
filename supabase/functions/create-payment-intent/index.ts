// supabase/functions/create-payment-intent/index.ts
// Secure Payment Intent Creation Edge Function
// Server-side payment validation to prevent client-side manipulation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentIntentRequest {
  order_id: string;
  payment_method?: "stripe" | "fawry" | "cod";
  save_card?: boolean;
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { order_id, payment_method = "stripe", save_card = false } = body as PaymentIntentRequest;

    // Validate required fields
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Supabase client with SERVICE ROLE (bypass RLS for validation)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Extract and validate user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // 🔒 SERVER-SIDE VALIDATION: Fetch order from database
    // NEVER trust client-sent amount or currency
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        seller_id,
        total,
        subtotal,
        tax,
        shipping,
        status,
        payment_status,
        currency
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found or unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // 🔒 SECURITY CHECK 1: Verify order ownership
    if (order.user_id !== user.id) {
      console.warn(`User ${user.id} attempted to pay for order ${order_id} owned by ${order.user_id}`);
      
      // Log suspicious activity
      await supabase.from("audit_logs").insert({
        event: "SUSPICIOUS_ACTIVITY",
        severity: "high",
        description: `User attempted to pay for order they don't own`,
        metadata: {
          user_id: user.id,
          order_id: order_id,
          actual_owner: order.user_id,
          ip_address: req.headers.get("X-Forwarded-For") || "unknown",
        },
        user_id: user.id,
      });
      
      return new Response(
        JSON.stringify({ error: "Unauthorized - This order does not belong to you" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // 🔒 SECURITY CHECK 2: Verify order status
    if (order.status === "cancelled") {
      return new Response(
        JSON.stringify({ error: "Cannot pay for a cancelled order" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (order.payment_status === "paid") {
      return new Response(
        JSON.stringify({ 
          error: "Order already paid",
          already_paid: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 🔒 SECURITY CHECK 3: Validate order total (prevent manipulation)
    const expectedTotal = parseFloat(order.total.toString());
    if (isNaN(expectedTotal) || expectedTotal <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid order total" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 🔒 SECURITY CHECK 4: Idempotency - Check for existing payment intent
    const { data: existingIntent } = await supabase
      .from("payment_intentions")
      .select("id, status, provider_reference_id, checkout_url")
      .eq("order_id", order_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingIntent && existingIntent.status === "pending") {
      // Return existing payment session (idempotency)
      return new Response(
        JSON.stringify({
          success: true,
          message: "Existing payment session found",
          existing: true,
          payment_intent_id: existingIntent.provider_reference_id,
          checkout_url: existingIntent.checkout_url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Handle different payment methods
    if (payment_method === "fawry") {
      // Redirect to Fawry Edge Function
      return new Response(
        JSON.stringify({
          redirect_to: "/functions/create-fawry-payment",
          order_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (payment_method === "cod") {
      // Cash on Delivery - just update order status
      const { error: codError } = await supabase
        .from("orders")
        .update({
          payment_method: "cod",
          payment_status: "pending",
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      if (codError) {
        throw codError;
      }

      // Log the COD payment
      await supabase.from("audit_logs").insert({
        event: "PAYMENT_INITIATED",
        severity: "low",
        description: "Cash on Delivery payment initiated",
        metadata: { order_id, payment_method: "cod" },
        user_id: user.id,
      });

      return new Response(
        JSON.stringify({
          success: true,
          payment_method: "cod",
          message: "Order confirmed - Pay on delivery",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 🔒 STRIPE PAYMENT INTENT CREATION
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
      console.error("Stripe credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment method not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Convert to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(expectedTotal * 100);
    const currency = (order.currency || "USD").toLowerCase();

    // Create Stripe Payment Intent
    const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: amountInCents.toString(),
        currency: currency,
        description: `Order ${order_id} - Aurora E-commerce`,
        metadata: JSON.stringify({
          order_id: order_id,
          user_id: user.id,
          seller_id: order.seller_id || "",
        }),
        automatic_payment_methods: JSON.stringify({ enabled: true }),
        ...(save_card ? { setup_future_usage: "off_session" } : {}),
      }),
    });

    if (!stripeResponse.ok) {
      const stripeError = await stripeResponse.json();
      console.error("Stripe API error:", stripeError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create payment intent",
          details: stripeError.error?.message,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const stripePaymentIntent = await stripeResponse.json();

    // 🔒 Record payment intention in database
    const { data: paymentRecord, error: insertError } = await supabase
      .from("payment_intentions")
      .insert({
        order_id: order_id,
        user_id: user.id,
        amount: expectedTotal,
        currency: currency.toUpperCase(),
        status: "pending",
        payment_method: "stripe",
        provider: "stripe",
        provider_reference_id: stripePaymentIntent.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        provider_metadata: {
          client_secret: stripePaymentIntent.client_secret,
          amount_cents: amountInCents,
          save_card: save_card,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw insertError;
    }

    // Log payment initiation
    await supabase.from("audit_logs").insert({
      event: "PAYMENT_INITIATED",
      severity: "low",
      description: `Stripe payment intent created for order ${order_id}`,
      metadata: {
        order_id: order_id,
        amount: expectedTotal,
        currency: currency,
        payment_intent_id: stripePaymentIntent.id,
      },
      user_id: user.id,
    });

    // Return client secret (safe to expose - only allows completing this specific payment)
    return new Response(
      JSON.stringify({
        success: true,
        payment_intent_id: stripePaymentIntent.id,
        client_secret: stripePaymentIntent.client_secret,
        amount: expectedTotal,
        currency: currency.toUpperCase(),
        order_id: order_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in create-payment-intent:", error);
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
