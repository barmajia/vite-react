import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SettingsFormProps {
  initial: Record<string, any>;
  onSave: (settings: Record<string, any>) => void;
}

export function SettingsForm({ initial, onSave }: SettingsFormProps) {
  const [settings, setSettings] = useState<Record<string, any>>(initial || {
    site_name: '',
    site_description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    logo_url: '',
    banner_url: '',
    primary_color: '#000000',
    secondary_color: '#ffffff',
  });

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSave(settings);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Store Settings</h3>
      <Card className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Store Name</label>
          <Input
            value={settings.site_name || ''}
            onChange={(e) => handleChange('site_name', e.target.value)}
            placeholder="My Store"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full min-h-[80px] p-2 border rounded-md"
            value={settings.site_description || ''}
            onChange={(e) => handleChange('site_description', e.target.value)}
            placeholder="Describe your store..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contact Email</label>
            <Input
              type="email"
              value={settings.contact_email || ''}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              placeholder="contact@store.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Phone</label>
            <Input
              value={settings.contact_phone || ''}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              placeholder="+20 100 000 0000"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <Input
            value={settings.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Cairo, Egypt"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Primary Color</label>
            <Input
              type="color"
              value={settings.primary_color || '#000000'}
              onChange={(e) => handleChange('primary_color', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Secondary Color</label>
            <Input
              type="color"
              value={settings.secondary_color || '#ffffff'}
              onChange={(e) => handleChange('secondary_color', e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Save Settings</Button>
        </div>
      </Card>
    </div>
  );
}