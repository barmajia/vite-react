import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useCheckout, type PaymentMethod } from "../hooks/useCheckout";
import { CheckoutForm } from "../components/CheckoutForm";
import { OrderReview } from "../components/OrderReview";
import { CheckoutSteps } from "../components/CheckoutSteps";
import { CartEmpty } from "@/features/cart/components/CartEmpty";
import { PaymentMethodSelector } from "../components/PaymentMethodSelector";
import { Button } from "@/components/ui";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items } = useCart();
  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    paymentMethod,
    setPaymentMethod,
    placeOrder,
    isPlacing,
    error,
    subtotal,
    shipping,
    tax,
    total,
  } = useCheckout();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">
            Preparing your secure checkout...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 px-4">
        <div className="glass-card p-12 border-slate-200/50 dark:border-slate-800/50">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight">
            Sign in to checkout
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Please sign in to your Aurora account to complete your purchase
            securely.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <CartEmpty />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
          Secure Checkout
        </h1>
        <p className="text-muted-foreground text-lg">
          Complete your purchase using our protected payment system.
        </p>
      </div>

      <div className="mb-10">
        <CheckoutSteps
          currentStep={
            currentStep === "shipping" ? 1 : currentStep === "payment" ? 2 : 3
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Main Content - Changes per step */}
        <div className="lg:col-span-2 space-y-8">
          {currentStep === "shipping" && (
            <CheckoutForm formData={formData} updateFormData={updateFormData} />
          )}

          {currentStep === "payment" && (
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
            />
          )}

          {currentStep === "review" && (
            <div className="space-y-6">
              <div className="p-6 glass-card rounded-xl">
                <h3 className="text-lg font-bold mb-4">Shipping Address</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{formData.fullName}</p>
                  <p>{formData.addressLine1}</p>
                  {formData.addressLine2 && <p>{formData.addressLine2}</p>}
                  <p>
                    {formData.city}, {formData.state} {formData.postalCode}
                  </p>
                  <p>{formData.country}</p>
                  <p className="mt-2">Phone: {formData.phone}</p>
                </div>
              </div>

              <div className="p-6 glass-card rounded-xl">
                <h3 className="text-lg font-bold mb-4">Payment Method</h3>
                <p className="text-sm capitalize">
                  {paymentMethod === "card" && "Credit/Debit Card"}
                  {paymentMethod === "fawry" && "Fawry (Pay at Kiosk)"}
                  {paymentMethod === "cod" && "Cash on Delivery"}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            {currentStep !== "shipping" ? (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep !== "review" ? (
              <Button onClick={nextStep} className="flex items-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Order Review Sidebar */}
        <div className="sticky top-24">
          <OrderReview
            items={items}
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={total}
            isPlacing={isPlacing}
            error={error}
            onPlaceOrder={placeOrder}
          />
        </div>
      </div>
    </div>
  );
}
