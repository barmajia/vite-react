import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { Skeleton } from '@/components/ui';
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
  const { t } = useTranslation();
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
        <h2 className="text-2xl font-bold mb-4">{t('common.signInRequired')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('common.signInToAccess')}
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-accent text-white rounded-md hover:opacity-90"
        >
          {t('auth.signIn')}
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'account', label: t('settings.account'), icon: Shield },
    ...(profile.account_type !== 'customer'
      ? [{ id: 'business', label: t('settings.business'), icon: Building2 }]
      : []),
    { id: 'location', label: t('settings.location'), icon: Locate },
    { id: 'addresses', label: t('settings.addresses'), icon: MapPin },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'privacy', label: t('settings.privacy'), icon: Eye },
    { id: 'security', label: t('settings.security'), icon: Lock },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 dark:from-primary dark:to-blue-400">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="flex flex-wrap h-auto p-1.5 glass rounded-2xl border border-white/20 dark:border-white/10 shadow-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 py-3 px-6 rounded-xl data-[state=active]:glass-card data-[state=active]:text-primary transition-all duration-300"
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="glass-card p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10">
          {/* Profile Settings */}
          <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
            <ProfileSettings />
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="mt-0 focus-visible:outline-none">
            <AccountSettings />
          </TabsContent>

          {/* Business Settings */}
          <TabsContent value="business" className="mt-0 focus-visible:outline-none">
            <BusinessSettings accountType={profile.account_type} />
          </TabsContent>

          {/* Location Settings */}
          <TabsContent value="location" className="mt-0 focus-visible:outline-none">
            <LocationSettings />
          </TabsContent>

          {/* Address Settings */}
          <TabsContent value="addresses" className="mt-0 focus-visible:outline-none">
            <AddressSettings />
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
            <NotificationSettings />
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="mt-0 focus-visible:outline-none">
            <PrivacySettings />
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="mt-0 focus-visible:outline-none">
            <SecuritySettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
