import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SellerWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["seller-wallet", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || parseFloat(payoutAmount) < 50) {
      toast.error("Minimum payout is $50");
      return;
    }
    setIsRequesting(true);
    toast.success("Payout request submitted");
    setPayoutAmount("");
    setIsRequesting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Wallet</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your earnings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-500" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900 dark:text-white">
                ${wallet?.balance?.toFixed(2) || "0.00"}
              </span>
              <span className="text-slate-500">{wallet?.currency || "USD"}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="font-semibold">${wallet?.pending_balance?.toFixed(2) || "0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Earned</p>
                <p className="font-semibold">${wallet?.total_earned?.toFixed(2) || "0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Withdrawn</p>
                <p className="font-semibold">${wallet?.total_spent?.toFixed(2) || "0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Last Transaction</p>
                <p className="font-semibold">
                  {wallet?.last_transaction_at ? new Date(wallet.last_transaction_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
            <CardDescription>Withdraw your earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="50"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="50.00"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isRequesting || !payoutAmount}>
                {isRequesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Building className="h-4 w-4 mr-2" />}
                Request Payout
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tx.transaction_type === "credit" ? <ArrowDownLeft className="h-4 w-4 text-emerald-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                      <Badge className={tx.transaction_type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                        {tx.transaction_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{tx.description}</TableCell>
                  <TableCell className={tx.transaction_type === "credit" ? "text-emerald-600" : "text-red-600"}>
                    {tx.transaction_type === "credit" ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-medium">${tx.balance_after?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
