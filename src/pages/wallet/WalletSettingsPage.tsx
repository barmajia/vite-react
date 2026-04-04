import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, ArrowLeft, Bell, Shield, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function WalletSettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleSave = () => {
    toast.success("Wallet settings saved");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/wallet">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Wallet Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Control how you receive wallet updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Transaction Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified for deposits and withdrawals</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        {/* Auto Withdrawal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Auto Withdrawal
            </CardTitle>
            <CardDescription>Automatically withdraw available balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Auto Withdrawal</p>
                <p className="text-sm text-muted-foreground">Withdraw funds automatically when balance exceeds threshold</p>
              </div>
              <Switch checked={autoWithdraw} onCheckedChange={setAutoWithdraw} />
            </div>
            {autoWithdraw && (
              <div>
                <Label htmlFor="threshold">Minimum Threshold</Label>
                <Input id="threshold" type="number" placeholder="100.00" className="mt-1" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Protect your wallet with additional security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Require 2FA for withdrawals</p>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">Save Settings</Button>
      </div>
    </div>
  );
}
