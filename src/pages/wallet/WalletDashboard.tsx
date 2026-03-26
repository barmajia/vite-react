import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Download,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

export function WalletDashboard() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Load Wallet Balance
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletError && walletError.code !== "PGRST116") {
        console.warn("Wallet table not available:", walletError.message);
      }
      setWallet(walletData);

      // 2. Load Recent Transactions
      const { data: txData, error: txError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (txError && txError.code !== "PGRST116") {
        console.warn(
          "Wallet transactions table not available:",
          txError.message,
        );
      }
      setRecentTransactions(txData || []);
    } catch (error) {
      console.error("Error loading wallet:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Wallet</h1>
          <p className="text-gray-600 mt-1">Manage your balance and payouts</p>
        </div>
        <Link to="/wallet/payouts">
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </Link>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {wallet?.balance?.toFixed(2) || "0.00"} EGP
            </div>
            <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Balance
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {wallet?.pending_balance?.toFixed(2) || "0.00"} EGP
            </div>
            <p className="text-xs text-gray-500 mt-1">Being processed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Earned
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {wallet?.total_earned?.toFixed(2) || "0.00"} EGP
            </div>
            <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/wallet/transactions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Transaction History</p>
                <p className="text-xs text-gray-500">View all transactions</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/wallet/payouts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Download className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Withdraw Funds</p>
                <p className="text-xs text-gray-500">Request payout</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/wallet/payouts/history">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Payout History</p>
                <p className="text-xs text-gray-500">Track withdrawals</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm mt-1">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        tx.transaction_type === "credit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {tx.transaction_type === "credit" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold capitalize">
                        {tx.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()} •{" "}
                        {tx.reference_type || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-bold ${
                      tx.transaction_type === "credit"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.transaction_type === "credit" ? "+" : "-"}
                    {tx.amount.toFixed(2)} EGP
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <Link to="/wallet/transactions">
              <Button variant="link">View All Transactions</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Wallet className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Wallet Information</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• All earnings are automatically added to your wallet</li>
                <li>• Minimum payout amount is 50 EGP</li>
                <li>• Payout processing time: 1-3 business days</li>
                <li>• Payout fee: 2% of withdrawal amount</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
