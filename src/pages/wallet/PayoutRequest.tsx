// Payout Request Page
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MINIMUM_PAYOUT = 50;
const PAYOUT_FEE_PERCENT = 2;

interface WalletBalance {
  balance: number;
  pending_balance: number;
  total_earned: number;
}

export function PayoutRequest() {
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Try user_wallets table first
      const { data: walletData } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletData) {
        setWallet(walletData);
        return;
      }

      // 🔹 FALLBACK: Calculate available balance from completed sales
      const { data: sales } = await supabase
        .from("sales")
        .select("total_price, status")
        .eq("seller_id", user.id)
        .eq("status", "completed");

      const availableBalance =
        sales?.reduce(
          (sum, s) => sum + s.total_price * 0.98, // 2% platform fee
          0,
        ) || 0;

      setWallet({
        balance: availableBalance,
        pending_balance: 0,
        total_earned: availableBalance,
      });
    } catch (error) {
      console.error("Error loading wallet:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (numAmount < MINIMUM_PAYOUT) {
      toast.error(`Minimum payout amount is ${MINIMUM_PAYOUT} EGP`);
      return;
    }

    if (wallet && numAmount > wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const fee = (numAmount * PAYOUT_FEE_PERCENT) / 100;
      const netAmount = numAmount - fee;

      // Create payout request
      const { data: payout, error: payoutError } = await supabase
        .from("payout_requests")
        .insert({
          user_id: user.id,
          amount: numAmount,
          fee: fee,
          net_amount: netAmount,
          payment_method: method,
          bank_name: method === "bank_transfer" ? bankName : null,
          account_number: method === "bank_transfer" ? accountNumber : null,
          account_name: method === "bank_transfer" ? accountName : null,
          status: "pending",
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Deduct from wallet
      const newBalance = wallet.balance - numAmount;
      const { error: updateError } = await supabase
        .from("user_wallets")
        .update({
          balance: newBalance,
          pending_balance: wallet.pending_balance + numAmount,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Create transaction record
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        amount: -numAmount,
        transaction_type: "debit",
        description: "Payout Request",
        reference_type: "payout_request",
        reference_id: payout.id,
        status: "pending",
      });

      toast.success("Payout request submitted successfully!");
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
    } catch (error: any) {
      console.error("Error submitting payout:", error);
      toast.error(error.message || "Failed to submit payout request");
    } finally {
      setLoading(false);
    }
  };

  const availableBalance = wallet?.balance || 0;
  const numAmount = parseFloat(amount) || 0;
  const fee = (numAmount * PAYOUT_FEE_PERCENT) / 100;
  const netAmount = numAmount - fee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/wallet">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Request Payout</h1>
          <p className="text-gray-600">Withdraw funds from your wallet</p>
        </div>
      </div>

      {/* Balance Alert */}
      <Alert className="bg-green-50 border-green-200">
        <Wallet className="h-4 w-4 text-green-600" />
        <AlertDescription className="ml-2">
          Available Balance:{" "}
          <span className="font-bold text-green-700">
            {availableBalance.toFixed(2)} EGP
          </span>
        </AlertDescription>
      </Alert>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Minimum Payout</p>
                <p className="text-sm text-gray-600">{MINIMUM_PAYOUT} EGP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Processing Time</p>
                <p className="text-sm text-gray-600">1-3 business days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (EGP)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MINIMUM_PAYOUT}
                max={availableBalance}
                step="0.01"
                required
              />
              {numAmount > availableBalance && (
                <p className="text-sm text-red-600">
                  Amount exceeds available balance
                </p>
              )}
              {numAmount > 0 && numAmount <= availableBalance && (
                <div className="text-sm text-gray-600">
                  <p>
                    Fee ({PAYOUT_FEE_PERCENT}%): {fee.toFixed(2)} EGP
                  </p>
                  <p className="font-medium">
                    You'll receive: {netAmount.toFixed(2)} EGP
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="fawry">Fawry</SelectItem>
                  <SelectItem value="wallet">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Details */}
            {method === "bank_transfer" && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., National Bank of Egypt"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="Enter account holder name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                loading ||
                numAmount < MINIMUM_PAYOUT ||
                numAmount > availableBalance
              }
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Request Payout
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              By submitting this request, you agree to our payout terms and
              conditions
            </p>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
