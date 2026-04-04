import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function WalletSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Wallet Setup</h1>
        <p className="text-muted-foreground mb-4">Please sign in to set up your wallet.</p>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  const handleSetupWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      // Wallet is auto-created via trigger on first transaction
      // This page just guides the user to make their first deposit
      toast.info("Wallet will be activated on your first transaction.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set up wallet");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Wallet Ready!</h2>
            <p className="text-muted-foreground mb-6">
              Your wallet will be activated when you make your first deposit or receive a payment.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate("/wallet")}>
                Go to Wallet
              </Button>
              <Button onClick={() => navigate("/marketplace")}>
                Start Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/wallet">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Set Up Your Wallet</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Activate Your Wallet
          </CardTitle>
          <CardDescription>
            Your wallet is created automatically. Make your first transaction to activate it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium mb-2">What happens next?</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Make a deposit to add funds</li>
              <li>• Receive a payment from a sale</li>
              <li>• Complete your first order</li>
            </ul>
          </div>
          <Button onClick={handleSetupWallet} disabled={loading} className="w-full">
            {loading ? "Setting up..." : "Activate Wallet"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
