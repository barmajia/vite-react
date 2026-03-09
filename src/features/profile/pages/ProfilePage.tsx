import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useFullProfile } from '@/hooks/useFullProfile';
import { ProfileForm } from '../components/ProfileForm';
import { ChangePassword } from '../components/ChangePassword';
import { ProfileHeader } from '../components/ProfileHeader';
import { StatsCards } from '../components/StatsCards';
import { AddressesSection } from '../components/AddressesSection';
import { ProfileSettings } from '../components/ProfileSettings';
import { SellerProfileDetails } from '../components/SellerProfileDetails';
import { CustomerProfileDetails } from '../components/CustomerProfileDetails';
import { DeliveryProfileDetails } from '../components/DeliveryProfileDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Heart, MapPin, MessageSquare, Bell } from 'lucide-react';

export function ProfilePage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    formData,
    updateFormData,
    saveProfile,
    isSaving,
    isEditing,
    setIsEditing,
    changePassword,
    isChangingPassword,
  } = useProfile();

  const { data: fullProfile, isLoading: profileLoading } = useFullProfile();

  if (loading || profileLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!fullProfile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
        <p className="text-muted-foreground">Unable to load your profile.</p>
      </div>
    );
  }

  const { core, seller, customer, delivery, addresses, stats } = fullProfile;
  const isOwnProfile = true;

  // Handle edit button click - navigate to settings tab
  const handleEdit = () => {
    setActiveTab('settings');
    setIsEditing(true);
  };

  if (loading || profileLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!fullProfile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
        <p className="text-muted-foreground">Unable to load your profile.</p>
      </div>
    );
  }

  // Render role-specific details
  const renderRoleDetails = () => {
    switch (core.account_type) {
      case 'seller':
      case 'factory':
        return seller && <SellerProfileDetails data={seller} />;
      case 'customer':
        return customer && <CustomerProfileDetails data={customer} />;
      case 'delivery':
        return delivery && <DeliveryProfileDetails data={delivery} />;
      case 'middleman':
        return (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Middleman profile details coming soon...
              </p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Profile details for this account type coming soon...
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <ProfileHeader
        user={core}
        isOwnProfile={isOwnProfile}
        onEdit={handleEdit}
      />

      {/* Stats Overview */}
      <StatsCards stats={stats} accountType={core.account_type} />

      {/* Quick Links Sidebar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link
          to="/orders"
          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
        >
          <Package className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Orders</p>
            <p className="text-xs text-muted-foreground">{stats.orders.totalOrders} total</p>
          </div>
        </Link>
        <Link
          to="/wishlist"
          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
        >
          <Heart className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Wishlist</p>
            <p className="text-xs text-muted-foreground">{stats.wishlist.count} items</p>
          </div>
        </Link>
        <Link
          to="/addresses"
          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
        >
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Addresses</p>
            <p className="text-xs text-muted-foreground">{addresses.length} saved</p>
          </div>
        </Link>
        <Link
          to="/messages"
          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Messages</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </Link>
        <Link
          to="/notifications"
          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">{stats.notifications.unread} unread</p>
          </div>
        </Link>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-muted-foreground">Account Type</span>
                  <p className="font-medium capitalize">{core.account_type}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <p className="font-medium">
                    {new Date(core.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Email</span>
                  <p className="font-medium">{core.email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <p className="font-medium">{core.phone || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role-Specific Details */}
          {renderRoleDetails()}

          {/* Addresses Preview */}
          {addresses.length > 0 && (
            <AddressesSection addresses={addresses.slice(0, 2)} showViewAll editable={false} />
          )}
        </TabsContent>

        <TabsContent value="addresses">
          <AddressesSection addresses={addresses} editable={isOwnProfile} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm
                  user={user}
                  formData={formData}
                  updateFormData={updateFormData}
                  onSave={saveProfile}
                  isSaving={isSaving}
                  isEditing={isEditing}
                  onEdit={() => setIsEditing(true)}
                  onCancel={() => setIsEditing(false)}
                />
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent>
                <ChangePassword
                  onChangePassword={changePassword}
                  isChanging={isChangingPassword}
                />
              </CardContent>
            </Card>
          </div>

          {/* Additional Settings */}
          <div className="mt-6">
            <ProfileSettings userId={core.user_id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
