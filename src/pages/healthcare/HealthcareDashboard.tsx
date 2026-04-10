import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Building, User, Calendar, DollarSign, Star, Phone, MapPin, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface ProviderProfile {
  id: string;
  provider_type: string;
  name: string;
  address: string;
  phone: string;
  rating_avg: number;
  verified: boolean;
  settings: Record<string, any>;
  customers: any[];
}

export default function HealthcareDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ appointments: 0, revenue: 0, upcoming: 0 });

  useEffect(() => {
    fetchHealthcareData();
  }, []);

  async function fetchHealthcareData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('healthcare_provider_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setStats({ appointments: 5, revenue: 2500, upcoming: 3 });
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
        <h1 className="text-2xl font-bold mb-4">No Healthcare Profile Found</h1>
        <p className="text-muted-foreground mb-4">Create your hospital, clinic, or pharmacy profile to get started.</p>
        <Button onClick={() => navigate('/healthcare/onboarding')}>Create Profile</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <Badge variant={profile.verified ? 'default' : 'secondary'} className="ml-2">
            {profile.verified ? 'Verified' : 'Pending Verification'}
          </Badge>
          <p className="text-muted-foreground capitalize">{profile.provider_type.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.appointments}</div></CardContent>
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
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.upcoming}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="customers">Patients/Customers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4"/><span>{profile.phone || 'Not provided'}</span></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4"/><span>{profile.address || 'Not provided'}</span></div>
                <div className="flex items-center gap-2"><Star className="h-4 w-4"/><span>{profile.rating_avg.toFixed(1)} rating</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">Add Appointment</Button>
                <Button className="w-full" variant="outline">Manage Staff</Button>
                <Button className="w-full" variant="outline">View Reports</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <Card><CardContent className="pt-6"><p className="text-muted-foreground text-center py-8">No appointments scheduled</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Patient/Customer Database</CardTitle><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 mt-2"/></CardHeader>
            <CardContent>
              {filteredCustomers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {filteredCustomers.map((c: any, i: number) => (
                    <Card key={i}><CardContent className="pt-4"><Avatar className="mb-2"><AvatarFallback>{c.name?.charAt(0)}</AvatarFallback></Avatar><p className="font-medium">{c.name}</p><p className="text-sm text-muted-foreground">{c.email}</p><p className="text-xs mt-2">Visits: {c.total_visits || c.total_orders || 0}</p></CardContent></Card>
                  ))}
                </div>
              ) : <p className="text-muted-foreground py-8 text-center">No patients/customers yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Healthcare Provider Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Commission Rate (%)</label>
                <Input type="number" defaultValue={profile.settings?.commission_rate || 15} className="w-32 mt-1"/>
              </div>
              <div>
                <label className="text-sm font-medium">Operating Hours</label>
                <Input placeholder="Mon-Fri: 9AM-5PM" className="mt-1"/>
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
