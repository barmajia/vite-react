// Transaction History Page
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { WalletTransaction } from "@/types/wallet";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  status: string;
  reference_type: string | null;
  reference_id: string | null;
}

export function TransactionHistory() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Try wallet_transactions table first
      const { data: walletTx, error: _txError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      // If wallet_transactions exists and has data, use it
      if (walletTx && walletTx.length > 0) {
        const formatted: Transaction[] = walletTx.map(
          (tx: WalletTransaction) => ({
            id: tx.id,
            type: tx.transaction_type as "credit" | "debit",
            amount: Math.abs(tx.amount),
            description: tx.description || "Transaction",
            date: tx.created_at,
            status: tx.status,
            reference_type: tx.reference_type,
            reference_id: tx.reference_id,
          }),
        );
        setTransactions(formatted);
        return;
      }

      // 🔹 FALLBACK: Query sales table for seller earnings
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(
          `
          id,
          total_price,
          sale_date,
          status,
          product_id
        `,
        )
        .eq("seller_id", user.id)
        .order("sale_date", { ascending: false })
        .limit(100);

      if (salesError && salesError.code !== "PGRST116") {
        console.warn("Sales table not available:", salesError.message);
        setTransactions([]);
        return;
      }

      // Transform sales data to transaction format
      const transformed: Transaction[] =
        salesData?.map((sale) => ({
          id: sale.id,
          type: "credit" as const,
          amount: sale.total_price,
          description: `Sale: ${sale.product_id ? "Product" : "Product"}`,
          date: sale.sale_date,
          status: sale.status || "completed",
          reference_type: "sale",
          reference_id: sale.product_id,
        })) || [];

      setTransactions(transformed);
    } catch (error: any) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.description?.toLowerCase().includes(query) ||
      tx.reference_type?.toLowerCase().includes(query)
    );
  });

  const exportTransactions = () => {
    const csvContent = [
      ["Date", "Description", "Type", "Amount", "Status", "Reference"],
      ...filteredTransactions.map((tx) => [
        new Date(tx.created_at).toLocaleDateString(),
        tx.description || "N/A",
        tx.transaction_type,
        tx.amount.toFixed(2),
        tx.status,
        tx.reference_id || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transactions exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-gray-600">View all your wallet transactions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="credit">Credits (Income)</SelectItem>
                <SelectItem value="debit">Debits (Withdrawals)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportTransactions} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredTransactions.length} Transaction(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
              <p className="text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{tx.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleString()} •{" "}
                        {tx.reference_type || "N/A"} • ID:{" "}
                        {tx.reference_id?.slice(0, 8) || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-right font-bold ${
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
        </CardContent>
      </Card>
    </div>
  );
}
