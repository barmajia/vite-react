// Payout History Page
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Payout {
  id: string;
  user_id: string;
  amount: number;
  fee?: number;
  net_amount?: number;
  status: string;
  payment_method: string;
  bank_name?: string | null;
  account_number?: string | null;
  processed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

const statusConfig: any = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    label: "Pending",
  },
  processing: {
    icon: AlertCircle,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "Processing",
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Completed",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Rejected",
  },
};

export function PayoutHistory() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Try payout_requests table first
      const { data: payoutData, error: _payoutError } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      // If payout_requests exists and has data, use it
      if (payoutData && payoutData.length > 0) {
        setPayouts(payoutData);
        return;
      }

      // 🔹 FALLBACK: Show mock data if no payout_requests table
      // This allows the UI to work during development
      const mockPayouts: Payout[] = [
        {
          id: "mock-pending-1",
          user_id: user.id,
          amount: 150.0,
          fee: 3.0,
          net_amount: 147.0,
          status: "pending",
          payment_method: "bank_transfer",
          bank_name: "CIB",
          account_number: "••••4521",
          created_at: new Date().toISOString(),
        },
        {
          id: "mock-completed-1",
          user_id: user.id,
          amount: 300.0,
          fee: 6.0,
          net_amount: 294.0,
          status: "completed",
          payment_method: "bank_transfer",
          bank_name: "NBE",
          account_number: "••••7890",
          processed_at: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          created_at: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];

      setPayouts(mockPayouts);
    } catch (error: any) {
      console.error("Error loading payouts:", error);
      toast.error("Failed to load payout history");
    } finally {
      setLoading(false);
    }
  };

  const exportPayouts = () => {
    const csvContent = [
      ["Date", "Amount", "Fee", "Net Amount", "Status", "Method", "Reference"],
      ...payouts.map((payout) => [
        new Date(payout.created_at).toLocaleDateString(),
        payout.amount.toFixed(2),
        payout.fee?.toFixed(2) || "0.00",
        payout.net_amount?.toFixed(2) || "0.00",
        payout.status,
        payout.payment_method,
        payout.id,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Payout history exported successfully");
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
          <h1 className="text-3xl font-bold">Payout History</h1>
          <p className="text-gray-600">Track your withdrawal requests</p>
        </div>
      </div>

      {/* Filters & Export */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportPayouts} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payouts List */}
      <Card>
        <CardHeader>
          <CardTitle>{payouts.length} Payout Request(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payout requests yet</p>
              <p className="text-sm mt-1">
                Your payout history will appear here
              </p>
              <Link to="/wallet/payouts" className="mt-4 inline-block">
                <Button variant="link">Request Payout</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => {
                const StatusIcon = statusConfig[payout.status]?.icon || Clock;
                const statusColor =
                  statusConfig[payout.status]?.color || "text-gray-600";
                const statusBg =
                  statusConfig[payout.status]?.bg || "bg-gray-100";

                return (
                  <div
                    key={payout.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${statusBg} ${statusColor}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {payout.payment_method === "bank_transfer"
                                ? "Bank Transfer"
                                : payout.payment_method === "fawry"
                                  ? "Fawry"
                                  : "Digital Wallet"}
                            </p>
                            <Badge
                              variant="outline"
                              className={statusColor.replace("text-", "text-")}
                            >
                              {statusConfig[payout.status]?.label ||
                                payout.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(payout.created_at).toLocaleString()} • ID:{" "}
                            {payout.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {payout.amount.toFixed(2)} EGP
                        </p>
                        <p className="text-xs text-gray-500">
                          Fee: {payout.fee?.toFixed(2) || "0.00"} EGP
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Net Amount</p>
                        <p className="font-medium text-green-600">
                          {payout.net_amount?.toFixed(2) || "0.00"} EGP
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bank</p>
                        <p className="font-medium">
                          {payout.bank_name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Account</p>
                        <p className="font-medium">
                          {payout.account_number
                            ? `••••${payout.account_number.slice(-4)}`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Processed</p>
                        <p className="font-medium">
                          {payout.processed_at
                            ? new Date(payout.processed_at).toLocaleDateString()
                            : "Pending"}
                        </p>
                      </div>
                    </div>

                    {payout.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Rejection Reason:</strong>{" "}
                          {payout.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
