import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, AlertTriangle, MapPin } from "lucide-react";

interface VerifyCODModalProps {
  order: {
    id: string;
    verification_key: string;
    total_amount: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function VerifyCODModal({
  order,
  onClose,
  onSuccess,
}: VerifyCODModalProps) {
  const [enteredCode, setEnteredCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);

  const verifyLocation = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationVerified(true);
          toast.success("Location verified");
        },
        (_error) => {
          toast.error("Location access denied");
        },
      );
    }
  };

  const handleVerify = async () => {
    if (enteredCode.toUpperCase() !== order.verification_key.toUpperCase()) {
      toast.error("Invalid verification code");
      return;
    }

    if (!locationVerified) {
      toast.error("Please verify your location first");
      return;
    }

    setVerifying(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase.rpc(
        "verify_cod_verification_key",
        {
          p_verification_key: enteredCode.toUpperCase(),
          p_driver_id: user!.id,
          p_customer_signature_url: null,
          p_driver_notes: "Payment collected successfully",
        },
      );

      if (error) throw error;

      if (data.success) {
        toast.success("✅ Payment verified! Order completed.");
        onSuccess();
      } else {
        toast.error(data.error || "Verification failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verify COD Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="font-mono text-sm">
              {order.id.slice(0, 8).toUpperCase()}...
            </p>
            <p className="text-sm text-gray-600 mt-2">Amount to Collect</p>
            <p className="text-2xl font-bold text-green-600">
              {order.total_amount.toFixed(2)} EGP
            </p>
          </div>

          {/* Location Verification */}
          <div>
            <Label>1. Verify Your Location</Label>
            <Button
              onClick={verifyLocation}
              variant={locationVerified ? "default" : "outline"}
              className="w-full mt-2"
              disabled={locationVerified}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {locationVerified ? "✓ Location Verified" : "Verify Location"}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Required to confirm you're at the delivery location
            </p>
          </div>

          {/* Code Entry */}
          <div>
            <Label>2. Enter Customer's Verification Code</Label>
            <Input
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
              placeholder="COD-XXXXXX"
              className="mt-2 font-mono text-lg tracking-wider uppercase"
              maxLength={10}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">
              Code provided by customer after payment
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 p-3 rounded-lg flex items-start gap-2 border border-yellow-200">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Only verify after receiving cash payment from customer. This
              action cannot be undone.
            </p>
          </div>

          {/* Success Preview */}
          {enteredCode.toUpperCase() === order.verification_key.toUpperCase() &&
            locationVerified && (
              <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">
                  Ready to complete delivery
                </p>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleVerify}
              disabled={
                verifying || !locationVerified || enteredCode.length < 6
              }
              className="flex-1"
            >
              {verifying ? "Verifying..." : "Confirm & Complete"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
