import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Smartphone, Laptop, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function SecuritySettings() {
  // Mock sessions - in production, fetch from Supabase
  const sessions = [
    { id: '1', device: 'Chrome on Windows', ip: '192.168.1.1', last_active: 'Now', current: true },
  ];

  const handleSignOutAll = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out from all devices');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Change your password in Account settings</p>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Not enabled</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Laptop className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div className="flex items-center gap-4">
                  {session.current ? (
                    <Laptop className="h-5 w-5 text-accent" />
                  ) : (
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{session.device}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.ip} • {session.last_active}
                    </p>
                  </div>
                </div>
                {session.current ? (
                  <Badge>Current</Badge>
                ) : (
                  <Button variant="outline" size="sm" className="text-destructive">
                    <LogOut className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" onClick={handleSignOutAll}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out from All Devices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
