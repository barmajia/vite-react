import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Pill, DollarSign, Package, Search, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface PharmacyProfile {
  id: string;
  name: string;
  pharmacist_name: string;
  delivery_available: boolean;
  operating_24_7: boolean;
  settings: Record<string, any>;
  customers: any[];
}

export default function PharmacyDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ prescriptions: 0, revenue: 0, inventory: 0 });

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  async function fetchPharmacyData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('pharmacy_details')
        .select(`
          *,
          healthcare_provider_profiles (
            name,
            settings,
            customers
          )
        `)
        .eq('provider_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          ...profileData,
          name: profileData.healthcare_provider_profiles?.name,
          settings: profileData.healthcare_provider_profiles?.settings,
          customers: profileData.healthcare_provider_profiles?.customers || []
        });
        setStats({ prescriptions: 12, revenue: 890, inventory: 45 });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = profile?.customers?.filter((c: any) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  if (!profile) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">No Pharmacy Profile Found</h1>
        <p className="text-muted-foreground mb-4">Create your pharmacy profile to start managing prescriptions and inventory.</p>
        <Button>Create Pharmacy Profile</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-muted-foreground">Pharmacy Dashboard</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4"/> Add Medicine</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.prescriptions}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${stats.revenue}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.inventory}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader><CardTitle>Medicine Inventory</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No medicines in inventory. Add your first product.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card>
            <CardHeader><CardTitle>Active Prescriptions</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No active prescriptions</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Customer Database</CardTitle><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 mt-2"/></CardHeader>
            <CardContent>
              {filteredCustomers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {filteredCustomers.map((c: any, i: number) => (
                    <Card key={i}><CardContent className="pt-4"><p className="font-medium">{c.name}</p><p className="text-sm text-muted-foreground">{c.email}</p><p className="text-xs mt-2">Orders: {c.total_orders || 0} | Spent: ${c.total_spent || 0}</p></CardContent></Card>
                  ))}
                </div>
              ) : <p className="text-muted-foreground py-8 text-center">No customers yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Pharmacy Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={profile.delivery_available} readOnly />
                <label className="text-sm">Delivery Available</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={profile.operating_24_7} readOnly />
                <label className="text-sm">24/7 Operations</label>
              </div>
              <div>
                <label className="text-sm font-medium">Commission Rate (%)</label>
                <Input type="number" defaultValue={profile.settings?.commission_rate || 12} className="w-32 mt-1"/>
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
