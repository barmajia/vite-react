import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FawryPaymentButtonProps {
  orderId: string;
  total: number;
  onSuccess?: () => void;
}

export const FawryPaymentButton = ({
  orderId,
  total,
  onSuccess,
}: FawryPaymentButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [showReferenceDialog, setShowReferenceDialog] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFawryPayment = async () => {
    setLoading(true);
    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Please log in to continue");
        return;
      }

      // Call our secure Edge Function
      const { data, error } = await supabase.functions.invoke(
        "create-fawry-payment",
        {
          body: { order_id: orderId },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      // Option A: Redirect to Fawry Pay Page (Recommended for Web)
      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        // Redirect immediately
        window.location.href = data.checkoutUrl;
      }
      // Option B: Show Reference Number (For Kiosk payment)
      else if (data.referenceNumber) {
        setReferenceNumber(data.referenceNumber);
        setShowReferenceDialog(true);
        toast.success("Payment initialized");
      }

      onSuccess?.();
    } catch (err: any) {
      console.error("Fawry payment error:", err);
      toast.error(err.message || "Failed to connect to Fawry");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    toast.success("Reference number copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        onClick={handleFawryPayment}
        disabled={loading}
        className="w-full bg-[#29A19C] text-white font-bold py-6 px-4 rounded-lg hover:bg-[#228884] transition disabled:opacity-50 text-lg shadow-lg shadow-[#29A19C]/30"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Connecting to Fawry...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.8 10.2c-1.4 0-2.6.3-3.6.8-.3-.9-.8-1.7-1.4-2.4 1.3-1 2.2-2.5 2.2-4.1 0-.3 0-.5-.1-.8C19.8 4.6 22 7.2 22 10.2c0 .3 0 .6-.1.9-.4-.6-1-1-1.1-.9zM6 12c0-3.3 2.7-6 6-6 .5 0 1 .1 1.5.2C12.6 3.5 10.4 2 8 2 3.6 2 0 5.6 0 10s3.6 8 8 8c1.3 0 2.5-.3 3.6-.9C9.1 16.5 6 14.6 6 12zm14-4c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1z" />
            </svg>
            Pay with Fawry (EGP)
          </div>
        )}
      </Button>

      {/* Reference Number Dialog */}
      <Dialog open={showReferenceDialog} onOpenChange={setShowReferenceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Reference Number</DialogTitle>
            <DialogDescription>
              Use this reference number to pay at any Fawry kiosk or outlet
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <div className="text-2xl font-bold text-center p-4 bg-muted rounded-lg">
                {referenceNumber}
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleCopyReference}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">How to pay:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Visit any Fawry kiosk or outlet</li>
              <li>Provide the reference number above</li>
              <li>Pay the amount: {total.toFixed(2)} EGP</li>
              <li>Your order will be confirmed automatically</li>
            </ol>
          </div>
          {checkoutUrl && (
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => window.open(checkoutUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Pay Online Instead
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
