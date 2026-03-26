import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');

  useEffect(() => {
    loadTransactions();
  }, [filter, dateRange]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      // Apply transaction type filter
      if (filter !== 'all') {
        query = query.eq('transaction_type', filter);
      }

      // Apply date range filter
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        query = query.gte('created_at', fromDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      credit: 'bg-green-100 text-green-800 border-green-200',
      debit: 'bg-red-100 text-red-800 border-red-200',
      hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      release: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return (
      <Badge className={`${styles[type] || 'bg-gray-100'} border font-medium`}>
        {type === 'credit' && <TrendingUp className="h-3 w-3 mr-1" />}
        {type === 'debit' && <TrendingDown className="h-3 w-3 mr-1" />}
        {type}
      </Badge>
    );
  };

  const exportTransactions = () => {
    const headers = ['Date', 'Type', 'Description', 'Reference', 'Amount', 'Balance After'];
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleDateString(),
      tx.transaction_type,
      tx.description,
      tx.reference_id || '-',
      `${tx.transaction_type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}`,
      `${tx.balance_after.toFixed(2)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully');
  };

  const calculateTotals = () => {
    const totalCredits = transactions
      .filter(tx => tx.transaction_type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalDebits = transactions
      .filter(tx => tx.transaction_type === 'debit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return { totalCredits, totalDebits, net: totalCredits - totalDebits };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-gray-600 mt-1">View all your wallet transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-xl font-bold text-green-600">+{totals.totalCredits.toFixed(2)} EGP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Debits</p>
                <p className="text-xl font-bold text-red-600">-{totals.totalDebits.toFixed(2)} EGP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Change</p>
                <p className={`text-xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.net >= 0 ? '+' : ''}{totals.net.toFixed(2)} EGP
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Transactions</CardTitle>
          <div className="flex gap-2">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border rounded-md px-3 py-1.5 text-sm bg-white"
              >
                <option value="all">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border rounded-md px-3 py-1.5 text-sm bg-white"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            {/* Export Button */}
            <Button variant="outline" size="sm" onClick={exportTransactions} disabled={transactions.length === 0}>
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
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {new Date(tx.created_at).toLocaleDateString()}
                        <span className="text-xs text-gray-500 block">
                          {new Date(tx.created_at).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>{getTypeBadge(tx.transaction_type)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          {tx.metadata && typeof tx.metadata === 'object' && 'order_id' in tx.metadata && (
                            <p className="text-xs text-gray-500">
                              Order: {(tx.metadata as any).order_id?.slice(0, 8)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.reference_id ? `${tx.reference_type}...${tx.reference_id.slice(0, 8)}` : '-'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          tx.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.transaction_type === 'credit' ? '+' : '-'}{tx.amount.toFixed(2)} EGP
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {tx.balance_after.toFixed(2)} EGP
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Wallet({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
