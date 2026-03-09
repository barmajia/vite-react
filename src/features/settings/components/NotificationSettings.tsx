import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const [preferences, setPreferences] = useState({
    orders: true,
    messages: true,
    promotions: false,
    system: true,
    email: true,
    push: false,
  });

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Preference updated');
    // In production, save to database
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'orders', label: 'Orders', desc: 'Order confirmations, shipping updates, deliveries' },
            { key: 'messages', label: 'Messages', desc: 'New messages from buyers/sellers' },
            { key: 'promotions', label: 'Promotions', desc: 'Special offers and discounts' },
            { key: 'system', label: 'System', desc: 'Account updates and security alerts' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label>{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={preferences[item.key as keyof typeof preferences]}
                onCheckedChange={() => handleToggle(item.key as keyof typeof preferences)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Delivery Methods
          </CardTitle>
          <CardDescription>
            How you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={preferences.email}
              onCheckedChange={() => handleToggle('email')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
            </div>
            <Switch
              checked={preferences.push}
              onCheckedChange={() => handleToggle('push')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
