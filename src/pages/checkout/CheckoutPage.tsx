import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ShoppingBag, Truck, CreditCard, CheckCircle } from "lucide-react";
import ShippingForm from "./ShippingForm";
import PaymentMethod from "./PaymentMethod";
import OrderSuccess from "./OrderSuccess";
import { OrderSummary } from "./OrderSummary";
import { StripeCheckout } from "@/features/checkout/components/StripeCheckout";

type CheckoutStep = "cart" | "shipping" | "payment" | "confirmation";

interface CartItem {
  asin: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  seller_id: string;
}

interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] =
    useState<ShippingAddress | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "stripe" | "fawry" | "cod"
  >("cod");
  const [customerEmail, setCustomerEmail] = useState<string>("");

  // Calculate totals with 8% platform margin
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const platformMargin = subtotal * 0.08; // 8% margin
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over 500 EGP
  const total = subtotal + shipping;

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login?redirect=/checkout");
        return;
      }

      const { data: cart, error } = await supabase
        .from("cart")
        .select(
          `
          *,
          products:sellers!inner(
            id,
            title,
            price,
            images,
            seller_id
          )
        `,
        )
        .eq("user_id", user.id);

      if (error) throw error;

      setCartItems(
        cart?.map((item) => ({
          asin: item.asin,
          title: item.products.title,
          price: item.products.price,
          quantity: item.quantity,
          image: item.products.images?.[0],
          seller_id: item.products.seller_id,
        })) || [],
      );
    } catch (error) {
      toast.error("Failed to load cart");
      console.error(error);
    }
  };

  const handleCreateOrder = async (
    method: "stripe" | "fawry" | "cod" = "cod",
  ) => {
    if (!shippingAddress) {
      toast.error("Please add shipping address");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          seller_id: cartItems[0].seller_id, // First item's seller
          subtotal,
          shipping,
          tax: 0,
          discount: 0,
          total,
          payment_method: method,
          payment_status: method === "cod" ? "pending" : "requires_payment",
          status: method === "cod" ? "pending" : "awaiting_payment",
          shipping_address_snapshot: shippingAddress,
          metadata: {
            platform_margin: platformMargin,
            platform_margin_percentage: 8,
            items_count: cartItems.length,
          },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        asin: item.asin,
        product_name: item.title,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        seller_id: item.seller_id,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. For COD: Generate verification code
      if (method === "cod") {
        const { data: codData, error: codError } = await supabase.rpc(
          "generate_cod_verification_key",
          {
            p_order_id: order.id,
            p_key_length: 6,
            p_expiry_hours: 48,
          },
        );

        if (codError) throw codError;

        // 4. Clear cart
        await supabase.from("cart").delete().eq("user_id", user!.id);

        setOrderId(order.id);
        setVerificationCode(codData);
        setCurrentStep("confirmation");

        toast.success("Order created successfully!");
      } else {
        // For Stripe/Fawry: Set order ID and proceed to payment
        setOrderId(order.id);

        // Clear cart after order creation (payment will be processed)
        await supabase.from("cart").delete().eq("user_id", user!.id);

        // Stay on payment step for Stripe/Fawry
        toast.success("Order created. Please complete payment.");
      }
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Payment succeeded, generate COD code for display (or skip for card payments)
    if (orderId) {
      try {
        // For card payments, just navigate to success page
        navigate(`/order-success/${orderId}`);
        toast.success("Payment completed successfully!");
      } catch (error) {
        console.error("Payment success handling error:", error);
      }
    }
  };

  const steps = [
    { id: "cart", label: "Cart", icon: ShoppingBag },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "confirmation", label: "Confirm", icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStepIndex
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      index < currentStepIndex ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === "cart" && "Shopping Cart"}
                  {currentStep === "shipping" && "Shipping Address"}
                  {currentStep === "payment" && "Payment Method"}
                  {currentStep === "confirmation" && "Order Confirmation"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep === "cart" && (
                  <div className="space-y-4">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Your cart is empty</p>
                        <Button
                          variant="link"
                          onClick={() => navigate("/")}
                          className="mt-2"
                        >
                          Continue Shopping
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {cartItems.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                            >
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold">
                                {(item.price * item.quantity).toFixed(2)} EGP
                              </p>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => setCurrentStep("shipping")}
                          className="w-full mt-4"
                        >
                          Proceed to Shipping
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {currentStep === "shipping" && (
                  <ShippingForm
                    onSubmit={(address) => {
                      setShippingAddress(address);
                      setCurrentStep("payment");
                    }}
                    onBack={() => setCurrentStep("cart")}
                  />
                )}

                {currentStep === "payment" && orderId ? (
                  // If order is created, show Stripe checkout for card payments
                  paymentMethod === "stripe" ? (
                    <StripeCheckout
                      amount={total}
                      orderId={orderId}
                      customerEmail={customerEmail}
                      onSuccess={handlePaymentSuccess}
                      onCancel={() => {
                        toast.error("Payment cancelled");
                        setCurrentStep("shipping");
                      }}
                    />
                  ) : paymentMethod === "fawry" ? (
                    // Fawry payment placeholder
                    <Card>
                      <CardHeader>
                        <CardTitle>Fawry Payment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                          You will receive a payment reference code via SMS. Use
                          this code to pay at any Fawry kiosk.
                        </p>
                        <Button
                          className="w-full"
                          onClick={() => {
                            toast.info("Fawry integration coming soon");
                          }}
                        >
                          Pay with Fawry
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setCurrentStep("shipping")}
                        >
                          Back
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    // COD payment
                    <PaymentMethod
                      selectedMethod="cod"
                      onSubmit={() => handleCreateOrder("cod")}
                      onBack={() => setCurrentStep("shipping")}
                      loading={loading}
                      total={total}
                      onPaymentMethodChange={setPaymentMethod}
                    />
                  )
                ) : currentStep === "payment" ? (
                  // Before order creation - select payment method
                  <PaymentMethod
                    selectedMethod={paymentMethod}
                    onSubmit={() => handleCreateOrder(paymentMethod)}
                    onBack={() => setCurrentStep("shipping")}
                    loading={loading}
                    total={total}
                    onPaymentMethodChange={setPaymentMethod}
                    onCustomerEmailChange={setCustomerEmail}
                  />
                ) : null}

                {currentStep === "confirmation" &&
                  orderId &&
                  verificationCode && (
                    <OrderSuccess
                      orderId={orderId}
                      verificationCode={verificationCode}
                      total={total}
                    />
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              subtotal={subtotal}
              platformMargin={platformMargin}
              shipping={shipping}
              total={total}
              itemCount={cartItems.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
