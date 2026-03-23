import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

      const { shipping, tax } = calculateOrderTotal();

      if (items.length === 0) {
        throw new Error("Cart is empty");
      }

      // Fetch seller_id from products (cart only has snapshot)
      // For multi-seller orders, you'd group by seller_id and create multiple orders
      const productIds = items.map((item) => item.productId);

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, seller_id")
        .in("id", productIds);

      if (productsError) throw productsError;
      if (!products || products.length === 0)
        throw new Error("Products not found");

      // Get seller_id from first product (simplified - assumes single seller)
      // For multi-seller, split orders by seller_id
      const sellerId = products[0].seller_id;

      // Prepare order items
      const orderItems = items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.salePrice ?? item.price,
        title: item.name,
        image_url: item.image_url,
      }));

      // Calculate total for this order
      const orderTotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Create single order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          seller_id: sellerId,
          status: "pending",
          total: orderTotal + shipping + tax,
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

      // Create order items
      const dbOrderItems = orderItems.map((item) => ({
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

  const placeOrder = async (paymentMethod: "fawry" | "card" = "card") => {
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

    // If Fawry payment, initialize Fawry payment
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
          // Show reference number dialog (you can implement a custom dialog)
          alert(
            `Please pay at any Fawry kiosk using Reference: ${fawryData.referenceNumber}`,
          );
        }
      } catch (error: any) {
        console.error("Fawry payment error:", error);
        toast.error(error.message || "Failed to initialize Fawry payment");
        // Still navigate to success page as order is created
        navigate(`/order-success/${orderData.orderId}`);
      }
    } else {
      // Card payment - navigate to success page (you can integrate Stripe/etc later)
      navigate(`/order-success/${orderData.orderId}`);
    }
  };

  return {
    formData,
    updateFormData,
    placeOrder,
    isPlacing: placeOrderMutation.isPending,
    error: placeOrderMutation.error,
    ...calculateOrderTotal(),
  };
}
