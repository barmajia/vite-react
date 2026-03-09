import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, MapPin, Mail, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function PrivacySettings() {
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showLocation: true,
    showEmail: false,
    showPhone: false,
    allowMessages: true,
  });

  const handleSave = () => {
    toast.success('Privacy settings updated');
    // In production, save to database
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={privacy.profileVisibility}
            onValueChange={(v) => setPrivacy({ ...privacy, profileVisibility: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public - Anyone can view</SelectItem>
              <SelectItem value="connections_only">Connections Only</SelectItem>
              <SelectItem value="private">Private - Only me</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Information Visibility</CardTitle>
          <CardDescription>
            Control what information is visible on your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'showLocation', label: 'Location', icon: MapPin },
            { key: 'showEmail', label: 'Email', icon: Mail },
            { key: 'showPhone', label: 'Phone', icon: Phone },
            { key: 'allowMessages', label: 'Allow Messages', icon: MessageSquare },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <Label>{item.label}</Label>
              </div>
              <Switch
                checked={privacy[item.key as keyof typeof privacy]}
                onCheckedChange={(v) => {
                  setPrivacy({ ...privacy, [item.key]: v });
                  toast.success('Setting updated');
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave}>Save Privacy Settings</Button>
    </div>
  );
}
