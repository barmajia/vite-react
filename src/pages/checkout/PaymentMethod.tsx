import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui";
import { Input } from "@/components/ui";
import { Banknote, CreditCard, Wallet, Shield, Truck } from "lucide-react";

interface PaymentMethodProps {
  selectedMethod: "stripe" | "fawry" | "cod";
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  total: number;
  onPaymentMethodChange?: (method: "stripe" | "fawry" | "cod") => void;
  onCustomerEmailChange?: (email: string) => void;
}

export default function PaymentMethod({
  selectedMethod,
  onSubmit,
  onBack,
  loading,
  total,
  onPaymentMethodChange,
  onCustomerEmailChange,
}: PaymentMethodProps) {
  const paymentMethods = [
    {
      id: "cod" as const,
      label: "Cash on Delivery",
      description: "Pay with cash when you receive your order",
      icon: Banknote,
      available: true,
    },
    {
      id: "stripe" as const,
      label: "Credit/Debit Card",
      description: "Pay securely with your card (Stripe)",
      icon: CreditCard,
      available: true,
    },
    {
      id: "fawry" as const,
      label: "Fawry (Egypt)",
      description: "Pay at any Fawry kiosk",
      icon: Wallet,
      available: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Email Input for Order */}
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          className="mt-2"
          onChange={(e) => onCustomerEmailChange?.(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          We'll send order confirmation and tracking details to this email
        </p>
      </div>

      {/* Payment Method Selection */}
      <div>
        <Label className="text-base font-semibold">Select Payment Method</Label>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => {
            const method = value as "stripe" | "fawry" | "cod";
            onPaymentMethodChange?.(method);
          }}
          className="mt-3 space-y-3"
        >
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all ${
                !method.available ? "opacity-60" : ""
              } ${
                selectedMethod === method.id
                  ? "border-blue-500 bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <CardContent className="p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem
                    value={method.id}
                    disabled={!method.available}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <method.icon className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{method.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {method.description}
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </div>

      {/* COD Information Box */}
      {selectedMethod === "cod" && (
        <div className="space-y-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    Cash on Delivery (COD)
                  </p>
                  <p className="text-sm text-green-700">
                    Pay {total.toFixed(2)} EGP in cash when your order arrives.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    Verification Required
                  </p>
                  <p className="text-sm text-green-700">
                    You'll receive a verification code after placing this order.
                    Share it with the delivery driver to complete the delivery.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">
              How COD works:
            </p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Place your order with COD payment</li>
              <li>Receive a unique verification code</li>
              <li>Wait for delivery driver to arrive</li>
              <li>Pay cash amount to driver</li>
              <li>Give verification code to driver</li>
              <li>Driver verifies code - order complete!</li>
            </ol>
          </div>
        </div>
      )}

      {/* Order Total */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Amount (COD)</span>
            <span className="text-2xl font-bold text-green-600">
              {total.toFixed(2)} EGP
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Includes shipping fees. Platform fee already deducted.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={loading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          className="flex-1"
          disabled={loading}
        >
          {loading
            ? "Creating Order..."
            : `Place Order - ${total.toFixed(2)} EGP`}
        </Button>
      </div>
    </div>
  );
}
