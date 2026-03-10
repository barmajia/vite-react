import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { ProfileSettings } from '../components/ProfileSettings';
import { AccountSettings } from '../components/AccountSettings';
import { BusinessSettings } from '../components/BusinessSettings';
import { AddressSettings } from '../components/AddressSettings';
import { NotificationSettings } from '../components/NotificationSettings';
import { PrivacySettings } from '../components/PrivacySettings';
import { SecuritySettings } from '../components/SecuritySettings';
import { LocationSettings } from '@/components/shared/LocationSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Shield,
  Building2,
  MapPin,
  Bell,
  Eye,
  Lock,
  Locate,
} from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const { profile, isLoading } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <h2 className="text-2xl font-bold mb-4">Sign in required</h2>
        <p className="text-muted-foreground mb-6">
          Please sign in to access your settings.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-accent text-white rounded-md hover:opacity-90"
        >
          Sign In
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    ...(profile.account_type !== 'customer'
      ? [{ id: 'business', label: 'Business', icon: Building2 }]
      : []),
    { id: 'location', label: 'Location', icon: Locate },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 h-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 py-3"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business">
          <BusinessSettings accountType={profile.account_type} />
        </TabsContent>

        {/* Location Settings */}
        <TabsContent value="location">
          <LocationSettings />
        </TabsContent>

        {/* Address Settings */}
        <TabsContent value="addresses">
          <AddressSettings />
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
