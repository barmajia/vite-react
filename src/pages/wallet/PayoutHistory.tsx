import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Clock, CheckCircle, XCircle, Loader2, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function PayoutHistory() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'paid' | 'failed' | 'rejected'>('all');

  useEffect(() => {
    loadPayouts();
  }, [filter]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('payouts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPayouts(data || []);
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast.error('Failed to load payout history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      rejected: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const icons: Record<string, any> = {
      pending: Clock,
      processing: Loader2,
      paid: CheckCircle,
      failed: XCircle,
      rejected: XCircle,
    };

    const Icon = icons[status] || Clock;

    return (
      <Badge className={`${styles[status] || 'bg-gray-100'} border font-medium flex items-center gap-1`}>
        {status === 'processing' ? (
          <Icon className="h-3 w-3 animate-spin" />
        ) : (
          <Icon className="h-3 w-3" />
        )}
        {status}
      </Badge>
    );
  };

  const exportPayouts = () => {
    const headers = ['Date', 'Amount', 'Fee', 'Net Amount', 'Method', 'Status', 'Processed At'];
    const rows = payouts.map(payout => [
      new Date(payout.created_at).toLocaleDateString(),
      payout.amount.toFixed(2),
      payout.fee.toFixed(2),
      payout.net_amount.toFixed(2),
      payout.payout_method.replace('_', ' '),
      payout.status,
      payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Payout history exported successfully');
  };

  const calculateTotals = () => {
    const totalRequested = payouts.reduce((sum, p) => sum + p.amount, 0);
    const totalFees = payouts.reduce((sum, p) => sum + p.fee, 0);
    const totalReceived = payouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.net_amount, 0);
    const pendingAmount = payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalRequested, totalFees, totalReceived, pendingAmount };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payout History</h1>
        <p className="text-gray-600 mt-1">Track your withdrawal requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Banknote className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requested</p>
                <p className="text-lg font-bold">{totals.totalRequested.toFixed(2)} EGP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Received</p>
                <p className="text-lg font-bold text-green-600">{totals.totalReceived.toFixed(2)} EGP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-bold text-yellow-600">{totals.pendingAmount.toFixed(2)} EGP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Fees</p>
                <p className="text-lg font-bold text-red-600">{totals.totalFees.toFixed(2)} EGP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Payout Requests</CardTitle>
          <div className="flex gap-2">
            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border rounded-md px-3 py-1.5 text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Export Button */}
            <Button variant="outline" size="sm" onClick={exportPayouts} disabled={payouts.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No payout requests yet</p>
              <p className="text-sm mt-1">Your payout history will appear here</p>
              <Link to="/wallet/payouts">
                <Button className="mt-4" variant="default">
                  Request Payout
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div>
                          <p>{new Date(payout.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(payout.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{payout.amount.toFixed(2)} EGP</TableCell>
                      <TableCell className="text-red-600">-{payout.fee.toFixed(2)} EGP</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {payout.net_amount.toFixed(2)} EGP
                      </TableCell>
                      <TableCell className="capitalize">
                        <div className="flex items-center gap-2">
                          {payout.payout_method === 'bank_transfer' && <Banknote className="h-4 w-4" />}
                          {payout.payout_method === 'fawry_cash' && <Clock className="h-4 w-4" />}
                          {payout.payout_method.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        {payout.processed_at ? (
                          <div>
                            <p>{new Date(payout.processed_at).toLocaleDateString()}</p>
                            {payout.metadata && typeof payout.metadata === 'object' && 'transaction_ref' in payout.metadata && (
                              <p className="text-xs text-gray-500">
                                Ref: {(payout.metadata as any).transaction_ref}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Banknote className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Payout Processing Times</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• <strong>Bank Transfer:</strong> 1-3 business days</li>
                <li>• <strong>Fawry Cash Pickup:</strong> Within 24 hours</li>
                <li>• <strong>Digital Wallet:</strong> Instant to 24 hours</li>
                <li>• Weekends and holidays may affect processing times</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
