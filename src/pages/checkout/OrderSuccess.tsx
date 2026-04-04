import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Shield, Truck, Package, Home } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface OrderSuccessProps {
  orderId: string;
  verificationCode: string;
  total: number;
}

export default function OrderSuccess({
  orderId,
  verificationCode,
  total,
}: OrderSuccessProps) {
  const navigate = useNavigate();
  const copyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    toast.success("Verification code copied!");
  };

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold">Order Placed Successfully!</h2>
        <p className="text-gray-600">
          Order ID: {orderId.slice(0, 8).toUpperCase()}...
        </p>
      </div>

      {/* Verification Code Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" />
            Your Verification Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-6 rounded-lg border-2 border-dashed border-blue-300">
            <p className="text-4xl font-mono font-bold tracking-wider text-blue-600">
              {verificationCode}
            </p>
          </div>

          <Button onClick={copyCode} variant="outline" className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>

          <div className="text-sm text-blue-800 space-y-2">
            <p>
              ⚠️ <strong>Important:</strong>
            </p>
            <ul className="text-left list-disc list-inside space-y-1">
              <li>Save this code safely</li>
              <li>Share with delivery driver upon arrival</li>
              <li>Driver will verify code to complete delivery</li>
              <li>Code expires in 48 hours</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-green-500 mt-0.5" />
            <div className="text-left">
              <p className="font-semibold">Delivery Process:</p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Seller prepares your order</li>
                <li>Driver picks up and delivers</li>
                <li>
                  You pay cash: <strong>{total.toFixed(2)} EGP</strong>
                </li>
                <li>Give verification code to driver</li>
                <li>Driver verifies code in app</li>
                <li>Order marked as delivered ✅</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary Quick View */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Amount to Pay on Delivery:</span>
            <span className="text-lg font-bold text-green-600">
              {total.toFixed(2)} EGP
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={() => navigate("/orders")} className="flex-1">
          <Package className="h-4 w-4 mr-2" />
          Track Order
        </Button>
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="flex-1"
        >
          <Home className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
