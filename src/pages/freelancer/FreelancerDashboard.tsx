import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Briefcase, Calendar, DollarSign, Star, Clock, Users, TrendingUp, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface FreelancerProfile {
  id: string;
  full_name: string;
  professional_title: string;
  bio: string;
  hourly_rate: number;
  skills: string[];
  portfolio_url: string;
  availability_status: string;
  rating_avg: number;
  total_jobs: number;
  settings: Record<string, any>;
  customers: any[];
}

export default function FreelancerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [stats, setStats] = useState({ totalRevenue: 0, activeOrders: 0, completedJobs: 0, avgRating: 0 });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFreelancerData();
  }, []);

  async function fetchFreelancerData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profileData } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData) {
        const { data: newProfile } = await supabase
          .from('freelancer_profiles')
          .insert([{ id: user.id, full_name: user.user_metadata?.full_name || 'Freelancer', availability_status: 'available', settings: {}, customers: [] }])
          .select()
          .single();
        setProfile(newProfile);
      } else {
        setProfile(profileData);
      }

      setStats({
        totalRevenue: 0,
        activeOrders: 0,
        completedJobs: profileData?.total_jobs || 0,
        avgRating: profileData?.rating_avg || 0,
      });
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

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
          <p className="text-muted-foreground">Manage your gigs and clients</p>
        </div>
        <Button onClick={() => navigate('/freelancer/services/new')}><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Active Orders</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.activeOrders}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Completed Jobs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.completedJobs}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Rating</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.avgRating.toFixed(1)} <Star className="inline h-4 w-4"/></div></CardContent></Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16"><AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback></Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{profile?.full_name}</h3>
                  <p className="text-muted-foreground">{profile?.professional_title}</p>
                  <Badge className="mt-2">{profile?.availability_status}</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">{profile?.bio}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => setIsEditingProfile(true)}><Edit2 className="mr-2 h-4 w-4"/> Edit</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card><CardContent className="pt-6"><p className="text-muted-foreground">No services yet. Add your first service to start getting orders.</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 mt-2"/>
            </CardHeader>
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
            <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Commission Rate (%)</Label>
                <Input type="number" defaultValue={profile?.settings?.commission_rate || 10} className="w-32"/>
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsEditingProfile(false); toast({title: 'Saved'}); }}>
            <div><Label>Name</Label><Input value={profile?.full_name} onChange={(e) => setProfile({...profile!, full_name: e.target.value})}/></div>
            <div><Label>Title</Label><Input value={profile?.professional_title} onChange={(e) => setProfile({...profile!, professional_title: e.target.value})}/></div>
            <div><Label>Bio</Label><Textarea value={profile?.bio} onChange={(e) => setProfile({...profile!, bio: e.target.value})}/></div>
            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
