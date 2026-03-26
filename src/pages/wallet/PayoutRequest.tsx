import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Banknote, Building, Smartphone, Info, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function PayoutRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
  });

  const MIN_PAYOUT = 50;
  const PAYOUT_FEE_PERCENTAGE = 2;

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: walletData, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setWalletData(walletData);
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const handleRequest = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payoutAmount = parseFloat(amount);

      // Validation
      if (isNaN(payoutAmount) || payoutAmount <= 0) {
        toast.error('Please enter a valid amount');
        setLoading(false);
        return;
      }

      if (payoutAmount < MIN_PAYOUT) {
        toast.error(`Minimum payout amount is ${MIN_PAYOUT} EGP`);
        setLoading(false);
        return;
      }

      if (!walletData || payoutAmount > walletData.balance) {
        toast.error('Insufficient wallet balance');
        setLoading(false);
        return;
      }

      // Calculate fee and net amount
      const fee = payoutAmount * (PAYOUT_FEE_PERCENTAGE / 100);
      const netAmount = payoutAmount - fee;

      // Call backend function to request payout
      const { data, error } = await supabase.rpc('request_payout', {
        p_user_id: user!.id,
        p_amount: payoutAmount,
        p_payout_method: method,
        p_bank_details: method === 'bank_transfer' ? bankDetails : {},
        p_idempotency_key: `payout_${user!.id}_${Date.now()}` // Prevent duplicates
      });

      if (error) throw error;

      toast.success('Payout request submitted successfully!');
      setAmount('');
      navigate('/wallet/payouts/history');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to request payout');
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return 0;
    return value * (PAYOUT_FEE_PERCENTAGE / 100);
  };

  const calculateNetAmount = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return 0;
    return value - calculateFee();
  };

  const availableBalance = walletData?.balance || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Request Payout</h1>
        <p className="text-gray-600 mt-1">Withdraw funds from your wallet</p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-700 font-medium">Available Balance</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {availableBalance.toFixed(2)} EGP
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <Wallet className="h-8 w-8 text-green-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Banner */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 ml-2">
              <p className="font-medium">Payout Information</p>
              <ul className="text-sm mt-1 space-y-1">
                <li>• Minimum payout: {MIN_PAYOUT} EGP</li>
                <li>• Processing fee: {PAYOUT_FEE_PERCENTAGE}%</li>
                <li>• Processing time: 1-3 business days</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payout Amount (EGP)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min={MIN_PAYOUT}
                max={availableBalance}
                step="0.01"
                className="pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                EGP
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Min: {MIN_PAYOUT} EGP</span>
              <span>Max: {availableBalance.toFixed(2)} EGP</span>
            </div>
            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((percent) => (
                <Button
                  key={percent}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount((availableBalance * percent / 100).toFixed(2))}
                  className="flex-1"
                >
                  {percent}%
                </Button>
              ))}
            </div>
          </div>

          {/* Payout Method Selection */}
          <div className="space-y-2">
            <Label>Payout Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
                <SelectItem value="fawry_cash">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Fawry Cash Pickup
                  </div>
                </SelectItem>
                <SelectItem value="wallet">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Digital Wallet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Details (conditional) */}
          {method === 'bank_transfer' && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={bankDetails.account_name}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, account_name: e.target.value })
                  }
                  placeholder="As shown on bank account"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={bankDetails.account_number}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, account_number: e.target.value })
                  }
                  placeholder="Full account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={bankDetails.bank_name}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, bank_name: e.target.value })
                  }
                  placeholder="e.g., NBE, CIB, QNB"
                />
              </div>
            </div>
          )}

          {/* Fawry Info (conditional) */}
          {method === 'fawry_cash' && (
            <Alert className="bg-amber-50 border-amber-200">
              <Smartphone className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 ml-2">
                <p className="font-medium">Fawry Cash Pickup</p>
                <p className="text-sm mt-1">
                  You will receive a reference number to collect cash from any Fawry kiosk nationwide.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Fee Breakdown */}
          {amount && parseFloat(amount) > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payout Amount</span>
                  <span className="font-medium">{parseFloat(amount).toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing Fee ({PAYOUT_FEE_PERCENTAGE}%)</span>
                  <span className="text-red-600">-{calculateFee().toFixed(2)} EGP</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-semibold">You Receive</span>
                  <span className="text-lg font-bold text-green-600">
                    {calculateNetAmount().toFixed(2)} EGP
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 ml-2">
              <p className="text-sm">
                By clicking submit, you agree to our payout terms and conditions. 
                Payout requests cannot be cancelled once submitted.
              </p>
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button 
            onClick={handleRequest} 
            disabled={loading || !amount || parseFloat(amount) < MIN_PAYOUT} 
            className="w-full"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Submit Payout Request
              </div>
            )}
          </Button>

          {/* Cancel Link */}
          <div className="text-center">
            <Link to="/wallet" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Wallet Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
