import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type CheckoutStep = "shipping" | "payment" | "review";
export type PaymentMethod = "card" | "fawry" | "cod";

interface CheckoutFormData {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  saveAddress: boolean;
}

export function useCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: user?.user_metadata?.full_name || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    phone: "",
    saveAddress: true,
  });

  const calculateOrderTotal = () => {
    const subtotal = items.reduce(
      (sum, item) =>
        sum + ((item.salePrice ?? item.price) || 0) * item.quantity,
      0,
    );
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
    };
  };

  const placeOrderMutation = useMutation({
    mutationFn: async (addressData: CheckoutFormData) => {
      if (!user) throw new Error("User not authenticated");

      if (items.length === 0) {
        throw new Error("Cart is empty");
      }

      // 🛡️ SECURITY FIX: Re-fetch current prices from database to prevent price manipulation
      const productIds = items.map((item) => item.productId);

      const { data: dbProducts, error: dbError } = await supabase
        .from("products")
        .select("id, price, sale_price, seller_id, title, images")
        .in("id", productIds);

      if (dbError) throw dbError;
      if (!dbProducts || dbProducts.length === 0)
        throw new Error("Some products in your cart are no longer available.");

      // Create a map for quick lookup
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // Verify all items still exist and calculate secure totals
      const verifiedOrderItems = items.map((item) => {
        const dbProduct = productMap.get(item.productId);
        if (!dbProduct) {
          throw new Error(`Product ${item.name} is no longer available.`);
        }

        // Use database prices, NOT client-provided prices
        const verifiedPrice = dbProduct.sale_price ?? dbProduct.price;

        return {
          product_id: item.productId,
          quantity: item.quantity,
          price: verifiedPrice,
          title: dbProduct.title,
          image_url: dbProduct.images?.[0] || item.image_url,
        };
      });

      // Recalculate totals using verified prices
      const verifiedSubtotal = verifiedOrderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Re-calculate shipping/tax based on verified subtotal
      const shipping = verifiedSubtotal > 50 ? 0 : 5.99;
      const tax = verifiedSubtotal * 0.08;
      const verifiedTotal = verifiedSubtotal + shipping + tax;

      // Get seller_id from first verified product (assuming single seller for now)
      const sellerId = dbProducts[0].seller_id;

      // Create single order with VERIFIED total
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          seller_id: sellerId,
          status: "pending",
          subtotal: verifiedSubtotal,
          total: verifiedTotal,
          shipping,
          tax,
          payment_status: "pending",
          shipping_address_snapshot: {
            full_name: addressData.fullName,
            address_line1: addressData.addressLine1,
            address_line2: addressData.addressLine2,
            city: addressData.city,
            state: addressData.state,
            postal_code: addressData.postalCode,
            country: addressData.country,
            phone: addressData.phone,
          },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with VERIFIED values
      const dbOrderItems = verifiedOrderItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        title: item.title,
        image_url: item.image_url,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(dbOrderItems);

      if (itemsError) throw itemsError;

      return { orderId: orderData.id, total: orderData.total };
    },
    onSuccess: async (data) => {
      await clearCart();

      // Save address if requested
      if (formData.saveAddress) {
        await supabase.from("shipping_addresses").insert({
          user_id: user!.id,
          full_name: formData.fullName,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
          is_default: false,
        });
      }

      // Navigate to order success page
      navigate(`/order-success/${data.orderId}`);
    },
  });

  const updateFormData = (updates: Partial<CheckoutFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const goToStep = (step: CheckoutStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep === "shipping") {
      // Validate shipping form
      if (
        !formData.fullName ||
        !formData.addressLine1 ||
        !formData.city ||
        !formData.state ||
        !formData.postalCode ||
        !formData.country ||
        !formData.phone
      ) {
        toast.error("Please fill in all shipping details");
        return;
      }
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      setCurrentStep("review");
    }
  };

  const prevStep = () => {
    if (currentStep === "payment") {
      setCurrentStep("shipping");
    } else if (currentStep === "review") {
      setCurrentStep("payment");
    }
  };

  const placeOrder = async () => {
    // Validate form
    if (
      !formData.fullName ||
      !formData.addressLine1 ||
      !formData.city ||
      !formData.state ||
      !formData.postalCode ||
      !formData.country ||
      !formData.phone
    ) {
      throw new Error("Please fill in all required fields");
    }

    const orderData = await placeOrderMutation.mutateAsync(formData);

    // Handle different payment methods
    if (paymentMethod === "fawry") {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("User not authenticated");
        }

        toast.loading("Connecting to Fawry...", { duration: 2000 });

        // Call Fawry payment Edge Function
        const { data: fawryData, error: fawryError } =
          await supabase.functions.invoke("create-fawry-payment", {
            body: { order_id: orderData.orderId },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

        if (fawryError) throw fawryError;
        if (!fawryData.success) throw new Error(fawryData.error);

        toast.success("Payment initialized");

        // Redirect to Fawry PayPage or show reference number
        if (fawryData.checkoutUrl) {
          window.location.href = fawryData.checkoutUrl;
        } else if (fawryData.referenceNumber) {
          // Surface reference number without blocking the UI
          toast.info(
            `Pay at any Fawry kiosk using Reference: ${fawryData.referenceNumber}`,
            { duration: 8000 },
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Fawry payment error:", errorMessage);
        toast.error(errorMessage || "Failed to initialize Fawry payment");
        // Still navigate to success page as order is created
        navigate(`/order-success/${orderData.orderId}`);
      }
    } else {
      // Card payment - navigate to success page (you can integrate Stripe/etc later)
      navigate(`/order-success/${orderData.orderId}`);
    }
  };

  return {
    // Form data
    formData,
    updateFormData,

    // Multi-step navigation
    currentStep,
    goToStep,
    nextStep,
    prevStep,

    // Payment
    paymentMethod,
    setPaymentMethod,

    // Order placement
    placeOrder,
    isPlacing: placeOrderMutation.isPending,
    error: placeOrderMutation.error,

    // Order totals
    ...calculateOrderTotal(),
  };
}
