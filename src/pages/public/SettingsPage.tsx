import { usePreferences } from '@/context/PreferencesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Monitor, Globe, DollarSign, Layout, Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const { t } = useTranslation();
  const { preferences, updatePreference, resetCookieConsent } = usePreferences();

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  ];

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'es', name: 'Spanish', native: 'Español' },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings & Preferences</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customize your Aurora experience
        </p>
      </div>

      {/* Theme Preference */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-violet-600" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Choose how Aurora looks on your device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={preferences.theme === 'light' ? 'default' : 'outline'}
              onClick={() => updatePreference('theme', 'light')}
              className={`flex flex-col items-center gap-2 h-24 ${
                preferences.theme === 'light'
                  ? 'bg-violet-600 hover:bg-violet-700'
                  : ''
              }`}
            >
              <Sun className="h-6 w-6" />
              <span>Light</span>
            </Button>

            <Button
              variant={preferences.theme === 'dark' ? 'default' : 'outline'}
              onClick={() => updatePreference('theme', 'dark')}
              className={`flex flex-col items-center gap-2 h-24 ${
                preferences.theme === 'dark'
                  ? 'bg-violet-600 hover:bg-violet-700'
                  : ''
              }`}
            >
              <Moon className="h-6 w-6" />
              <span>Dark</span>
            </Button>

            <Button
              variant={preferences.theme === 'system' ? 'default' : 'outline'}
              onClick={() => updatePreference('theme', 'system')}
              className={`flex flex-col items-center gap-2 h-24 ${
                preferences.theme === 'system'
                  ? 'bg-violet-600 hover:bg-violet-700'
                  : ''
              }`}
            >
              <Monitor className="h-6 w-6" />
              <span>System</span>
            </Button>
          </div>

          {preferences.theme === 'system' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Following system preference: {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-violet-600" />
            <CardTitle>Language & Region</CardTitle>
          </div>
          <CardDescription>Set your preferred language and currency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={preferences.language}
              onValueChange={(value) => updatePreference('language', value)}
            >
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.native} {lang.code !== lang.native && `(${lang.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={preferences.currency}
              onValueChange={(value) => updatePreference('currency', value)}
            >
              <SelectTrigger id="currency" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} - {curr.code} ({curr.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Layout Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-violet-600" />
            <CardTitle>Layout</CardTitle>
          </div>
          <CardDescription>Customize the dashboard layout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sidebar State</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={preferences.sidebar === 'expanded' ? 'default' : 'outline'}
                onClick={() => updatePreference('sidebar', 'expanded')}
                className={preferences.sidebar === 'expanded' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                Expanded
              </Button>
              <Button
                variant={preferences.sidebar === 'collapsed' ? 'default' : 'outline'}
                onClick={() => updatePreference('sidebar', 'collapsed')}
                className={preferences.sidebar === 'collapsed' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                Collapsed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Consent */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-violet-600" />
            <CardTitle>Cookie Preferences</CardTitle>
          </div>
          <CardDescription>Manage your cookie consent settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Current Status</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {preferences.cookieConsent === 'accepted'
                  ? '✅ All cookies accepted'
                  : preferences.cookieConsent === 'rejected'
                  ? '⚠️ Only essential cookies'
                  : '⏳ Not set'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={resetCookieConsent}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Reset Consent
            </Button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Resetting will show the cookie consent banner again on your next visit.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Preferences are saved automatically and synced across your devices.</p>
      </div>
    </div>
  );
}
