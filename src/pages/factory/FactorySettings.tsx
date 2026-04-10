import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  Bell, 
  Palette, 
  CreditCard, 
  Shield, 
  Globe, 
  Save,
  Upload,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  Search,
  Factory,
  Package,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface FactorySettings {
  production_capacity: number;
  lead_time_days: number;
  notifications: boolean;
  currency: string;
  language?: string;
  timezone?: string;
  [key: string]: any;
}

interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  avatar_url?: string;
  created_at: string;
}

export default function FactorySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  
  // Profile settings
  const [factoryName, setFactoryName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [website, setWebsite] = useState('');
  
  // Production settings
  const [productionCapacity, setProductionCapacity] = useState(0);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [specialties, setSpecialties] = useState<string[]>([]);
  
  // Settings JSON
  const [settings, setSettings] = useState<FactorySettings>({
    production_capacity: 0,
    lead_time_days: 7,
    notifications: true,
    currency: 'USD',
    language: 'en',
    timezone: 'UTC'
  });
  
  // Customers data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (user) {
      fetchFactoryData();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            c.company?.toLowerCase().includes(query) ||
            c.id.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, customers]);

  const fetchFactoryData = async () => {
    try {
      setLoading(true);
      
      const { data: factoryData, error: factoryError } = await supabase
        .from('factory_profiles')
        .select('id, factory_name, description, email, phone, address, logo_url, website, settings, customers')
        .eq('user_id', user!.id)
        .single();

      if (factoryError && factoryError.code !== 'PGRST116') {
        throw factoryError;
      }

      if (factoryData) {
        setProfileId(factoryData.id);
        setFactoryName(factoryData.factory_name || '');
        setDescription(factoryData.description || '');
        setEmail(factoryData.email || '');
        setPhone(factoryData.phone || '');
        setAddress(factoryData.address || '');
        setLogoUrl(factoryData.logo_url || '');
        setWebsite(factoryData.website || '');
        
        if (factoryData.settings) {
          setSettings({
            production_capacity: factoryData.settings.production_capacity || 0,
            lead_time_days: factoryData.settings.lead_time_days || 7,
            notifications: factoryData.settings.notifications ?? true,
            currency: factoryData.settings.currency || 'USD',
            language: factoryData.settings.language || 'en',
            timezone: factoryData.settings.timezone || 'UTC'
          });
          setProductionCapacity(factoryData.settings.production_capacity || 0);
          setLeadTimeDays(factoryData.settings.lead_time_days || 7);
        }
        
        if (factoryData.customers && Array.isArray(factoryData.customers)) {
          setCustomers(factoryData.customers);
          setFilteredCustomers(factoryData.customers);
        }
      } else {
        setSettings({ 
          production_capacity: 0, 
          lead_time_days: 7, 
          notifications: true, 
          currency: 'USD' 
        });
        setCustomers([]);
      }
    } catch (error: any) {
      console.error('Error fetching factory data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const updatedSettings = {
        ...settings,
        production_capacity: productionCapacity,
        lead_time_days: leadTimeDays,
        notifications: settings.notifications,
        currency: settings.currency
      };

      if (profileId) {
        const { error } = await supabase
          .from('factory_profiles')
          .update({
            factory_name: factoryName,
            description,
            email,
            phone,
            address,
            logo_url: logoUrl,
            website,
            settings: updatedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('factory_profiles')
          .insert({
            user_id: user.id,
            factory_name: factoryName,
            description,
            email,
            phone,
            address,
            logo_url: logoUrl,
            website,
            settings: updatedSettings,
            customers: [],
            status: 'active'
          })
          .select('id')
          .single();

        if (error) throw error;
        setProfileId(data.id);
      }

      toast({
        title: 'Success',
        description: 'Settings saved successfully'
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomer = () => {
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      user_id: '',
      name: 'New Customer',
      email: 'customer@example.com',
      company: 'Company Name',
      total_orders: 0,
      total_spent: 0,
      created_at: new Date().toISOString()
    };
    
    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    setFilteredCustomers(updatedCustomers);
    
    toast({
      title: 'Customer Added',
      description: 'Please fill in the customer details'
    });
  };

  const handleUpdateCustomer = (customerId: string, updates: Partial<Customer>) => {
    const updatedCustomers = customers.map((c) =>
      c.id === customerId ? { ...c, ...updates } : c
    );
    setCustomers(updatedCustomers);
    setFilteredCustomers(updatedCustomers);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updatedCustomers = customers.filter((c) => c.id !== customerId);
    setCustomers(updatedCustomers);
    setFilteredCustomers(updatedCustomers);
    setSelectedCustomer(null);
    
    toast({
      title: 'Customer Removed',
      description: 'Customer has been removed from your list'
    });
  };

  const handleSaveCustomers = async () => {
    if (!profileId) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('factory_profiles')
        .update({
          customers: customers,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customers data saved successfully'
      });
    } catch (error: any) {
      console.error('Error saving customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to save customers data',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Factory Settings</h1>
        <p className="text-muted-foreground">
          Manage your factory profile, production settings, and customer data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center gap-2">
            <Factory className="w-4 h-4" />
            <span className="hidden sm:inline">Production</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Customers</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Factory Information</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="factoryName">Factory Name</Label>
                <Input
                  id="factoryName"
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  placeholder="Enter your factory name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourfactory.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your factory capabilities..."
                  className="w-full min-h-[100px] p-3 border rounded-md bg-background resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@factory.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Factory Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Industrial Ave, City, Country"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <div className="flex gap-4 items-start">
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                  {logoUrl && (
                    <Avatar className="h-20 w-20 border">
                      <AvatarImage src={logoUrl} alt="Factory logo" />
                      <AvatarFallback>
                        <Factory className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Production Settings */}
        <TabsContent value="production" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Production Capabilities</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">Monthly Production Capacity (units)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={productionCapacity}
                  onChange={(e) => setProductionCapacity(parseInt(e.target.value) || 0)}
                  placeholder="10000"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum units you can produce per month
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadTime">Average Lead Time (days)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 7)}
                  placeholder="7"
                />
                <p className="text-sm text-muted-foreground">
                  Typical time from order to shipment
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Specialties</Label>
                <div className="flex flex-wrap gap-2">
                  {['Electronics', 'Textiles', 'Metalwork', 'Plastics', 'Woodworking', 'Food Processing'].map((spec) => (
                    <Badge
                      key={spec}
                      variant={specialties.includes(spec) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setSpecialties(prev =>
                          prev.includes(spec)
                            ? prev.filter(s => s !== spec)
                            : [...prev, spec]
                        );
                      }}
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{productionCapacity.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Units/Month</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{leadTimeDays}</p>
                    <p className="text-sm text-muted-foreground">Days Lead Time</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Appearance & Theme</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => setSettings({ ...settings, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="SAR">SAR (﷼)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => setSettings({ ...settings, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Riyadh">Riyadh</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-toggle">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about quotes, orders, and messages
                  </p>
                </div>
                <Switch
                  id="notifications-toggle"
                  checked={settings.notifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notifications: checked })
                  }
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Notification Types</h3>
                <div className="space-y-4">
                  {[
                    { id: 'quotes', label: 'New Quote Requests', desc: 'Get notified when you receive a quote request' },
                    { id: 'orders', label: 'New Orders', desc: 'Get notified when you receive a new order' },
                    { id: 'messages', label: 'Messages', desc: 'Get notified when you receive a message' },
                    { id: 'reviews', label: 'Reviews', desc: 'Get notified when you receive a review' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={`notify-${item.id}`}>{item.label}</Label>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        id={`notify-${item.id}`}
                        defaultChecked={settings.notifications}
                        disabled={!settings.notifications}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Update your password regularly for better security
                  </p>
                </div>
                <Button variant="outline">Change</Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4 text-destructive">Danger Zone</h3>
                <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2">Delete Factory Profile</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This action cannot be undone. All your quotes, orders, and data will be permanently deleted.
                  </p>
                  <Button variant="destructive" size="sm">Delete Profile</Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold">Customer Database</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your B2B customers and track orders
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddCustomer} size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
                <Button onClick={handleSaveCustomers} disabled={saving} size="sm" variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save All'}
                </Button>
              </div>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, company, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{customers.length}</p>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {customers.reduce((sum, c) => sum + c.total_orders, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      ${customers.reduce((sum, c) => sum + c.total_spent, 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {customers.filter(c => c.last_order_date && new Date(c.last_order_date) > new Date(Date.now() - 30*24*60*60*1000)).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active (30d)</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No customers found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchQuery ? 'Try adjusting your search query' : 'Start by adding your first customer'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={handleAddCustomer} size="sm">
                        Add Customer
                      </Button>
                    )}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Customer</th>
                        <th className="p-3 text-left text-sm font-medium hidden md:table-cell">Contact</th>
                        <th className="p-3 text-left text-sm font-medium">Orders</th>
                        <th className="p-3 text-left text-sm font-medium">Spent</th>
                        <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">Last Order</th>
                        <th className="p-3 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className={`border-t hover:bg-muted/50 cursor-pointer ${
                            selectedCustomer?.id === customer.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={customer.avatar_url} />
                                <AvatarFallback>
                                  <User className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.company}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <div className="text-sm">
                              <p>{customer.email}</p>
                              {customer.phone && (
                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">{customer.total_orders}</Badge>
                          </td>
                          <td className="p-3 font-medium">
                            ${customer.total_spent.toFixed(2)}
                          </td>
                          <td className="p-3 hidden lg:table-cell">
                            {customer.last_order_date ? (
                              <span className="text-sm">
                                {new Date(customer.last_order_date).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Never</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomer(customer.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {selectedCustomer && (
              <Card className="p-6 mt-6 bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Edit Customer Details</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    Close
                  </Button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={selectedCustomer.name}
                      onChange={(e) =>
                        handleUpdateCustomer(selectedCustomer.id, { name: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-company">Company</Label>
                    <Input
                      id="edit-company"
                      value={selectedCustomer.company || ''}
                      onChange={(e) =>
                        handleUpdateCustomer(selectedCustomer.id, { company: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={selectedCustomer.email}
                      onChange={(e) =>
                        handleUpdateCustomer(selectedCustomer.id, { email: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={selectedCustomer.phone || ''}
                      onChange={(e) =>
                        handleUpdateCustomer(selectedCustomer.id, { phone: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-orders">Total Orders</Label>
                    <Input
                      id="edit-orders"
                      type="number"
                      value={selectedCustomer.total_orders}
                      onChange={(e) =>
                        handleUpdateCustomer(selectedCustomer.id, {
                          total_orders: parseInt(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-spent">Total Spent ($)</Label>
                    <Input
                      id="edit-spent"
                      type="number"
                      step="0.01"
                      value={selectedCustomer.total_spent}
                      onChange={(e) =>
                        handleUpdateCustomer(selectedCustomer.id, {
                          total_spent: parseFloat(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setSelectedCustomer(null)}>
                    Done Editing
                  </Button>
                </div>
              </Card>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
