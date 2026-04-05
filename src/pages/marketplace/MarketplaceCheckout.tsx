import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, Button } from "@/components/ui";
import {
  Wallet,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  title: string;
  price: number;
}

interface WalletBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
}

export default function MarketplaceCheckout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [template, setTemplate] = useState<Template | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    loadCheckoutData(id, user.id);
  }, [id, user]);

  const loadCheckoutData = async (templateId: string, userId: string) => {
    try {
      // Load template
      const { data: templateData, error: templateError } = await supabase
        .from("website_marketplace")
        .select("id, title, price")
        .eq("id", templateId)
        .eq("is_published", true)
        .maybeSingle();

      if (templateError) throw templateError;
      if (!templateData) {
        setError("Template not found");
        return;
      }
      setTemplate(templateData);

      // Load wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallets")
        .select("available_balance, pending_balance, total_earned")
        .eq("user_id", userId)
        .maybeSingle();

      if (walletError) {
        console.warn("Could not load wallet balance:", walletError.message);
        // Set default if wallet doesn't exist yet
        setWalletBalance({
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        });
      } else {
        setWalletBalance(walletData);
      }
    } catch (err: any) {
      console.error("Error loading checkout data:", err);
      setError(err.message || "Failed to load checkout information");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!template || !user || !walletBalance) return;

    setProcessing(true);
    setError(null);

    try {
      // Check if free template
      if (template.price === 0) {
        await deployTemplate(template.id, user.id, 0);
      } else {
        // Check wallet balance
        if (walletBalance.available_balance < template.price) {
          setError(
            `Insufficient wallet balance. You need $${template.price.toFixed(2)} but have $${walletBalance.available_balance.toFixed(2)}.`,
          );
          toast.error("Insufficient wallet balance");
          return;
        }

        // Deduct from wallet and deploy
        await processPaidPurchase(template.id, user.id, template.price);
      }
    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.message || "Failed to complete purchase");
      toast.error("Purchase failed", { description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const deployTemplate = async (
    templateId: string,
    userId: string,
    price: number,
  ) => {
    // Generate subdomain from user metadata or user ID
    const subdomain =
      user?.user_metadata?.username || `store-${userId.slice(0, 6)}`;

    // Fetch template theme config
    const { data: templateData, error: templateError } = await supabase
      .from("website_marketplace")
      .select("theme_config")
      .eq("id", templateId)
      .single();

    if (templateError)
      throw new Error(`Failed to fetch template: ${templateError.message}`);

    // Create website record
    const { error: siteError } = await supabase.from("websites").insert({
      seller_id: userId,
      subdomain,
      theme_config: templateData?.theme_config || {},
      is_active: true,
      is_published: true,
      connection_type: "subdomain",
    });

    if (siteError)
      throw new Error(`Failed to deploy website: ${siteError.message}`);

    // Log purchase if paid (for free templates, log with 0 amount)
    if (price >= 0) {
      const { error: purchaseError } = await supabase
        .from("marketplace_purchases")
        .insert({
          buyer_id: userId,
          template_id: templateId,
          amount_paid: price,
          payment_method: price === 0 ? "free" : "wallet",
          payment_status: "completed",
          downloaded: false,
        });

      if (purchaseError) {
        console.error("Failed to log purchase:", purchaseError);
        // Don't throw - website was created successfully
      }
    }

    toast.success("Template deployed successfully!");
    navigate(`/${subdomain}`);
  };

  const processPaidPurchase = async (
    templateId: string,
    userId: string,
    price: number,
  ) => {
    // Use RPC or direct update to deduct from wallet
    const { error: walletError } = await supabase.rpc("deduct_wallet_balance", {
      p_user_id: userId,
      p_amount: price,
    });

    if (walletError) {
      // Fallback: manual update if RPC doesn't exist
      console.warn("RPC not available, using manual wallet update");
      const { error: updateError } = await supabase
        .from("user_wallets")
        .update({
          available_balance: walletBalance.available_balance - price,
        })
        .eq("user_id", userId);

      if (updateError)
        throw new Error(`Failed to update wallet: ${updateError.message}`);
    }

    // Log the transaction
    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        transaction_type: "debit",
        amount: price,
        description: `Marketplace purchase: Template ${templateId}`,
        reference_type: "marketplace_purchase",
        reference_id: templateId,
        status: "completed",
      });

    if (txError) {
      console.error("Failed to log transaction:", txError);
    }

    // Deploy the template
    await deployTemplate(templateId, userId, price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Checkout Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate("/webmarketplace")}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  if (!template) return null;

  const canAfford =
    template.price === 0 ||
    (walletBalance?.available_balance || 0) >= template.price;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-600">
            Complete your purchase and deploy your website
          </p>
        </div>

        <Card className="p-6 shadow-xl">
          {/* Template Info */}
          <div className="mb-6 pb-6 border-b">
            <h2 className="text-xl font-bold mb-2">{template.title}</h2>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Template Price</span>
              <span
                className={`text-2xl font-bold ${
                  template.price === 0 ? "text-green-600" : "text-blue-600"
                }`}
              >
                {template.price === 0
                  ? "FREE"
                  : `$${template.price.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Wallet Balance */}
          {template.price > 0 && walletBalance && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Your Wallet Balance
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                ${walletBalance.available_balance.toFixed(2)}
              </div>
              {!canAfford && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      Insufficient balance. Please add funds to your wallet to
                      complete this purchase.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={processing || !canAfford}
            size="lg"
            className={`w-full py-6 text-lg font-bold ${
              template.price === 0
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : template.price === 0 ? (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Claim Free Template & Deploy
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ${template.price.toFixed(2)} & Deploy
              </>
            )}
          </Button>

          {/* Payment Method Info */}
          {template.price > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                <Wallet className="h-4 w-4 inline mr-1" />
                Payment will be deducted from your wallet balance
              </p>
            </div>
          )}

          {/* Success Info */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1">
                  <li>✓ Your website will be created instantly</li>
                  <li>✓ You'll get a unique subdomain</li>
                  <li>✓ Theme will be applied automatically</li>
                  <li>✓ You can customize everything later</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
