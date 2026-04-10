import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Truck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Users,
  Shield,
  Stethoscope
} from "lucide-react";

export function PharmacyWelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
      
      toast.success("Welcome! Let's set up your pharmacy");
      navigate("/pharmacy/dashboard");
    } catch (error) {
      toast.error("Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-green-50 dark:to-green-950/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800">
          💊 Pharmacy Management Platform
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Manage Your
          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Pharmacy</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Streamline prescription management, inventory tracking, and delivery services. 
          Connect with patients and healthcare providers seamlessly.
        </p>
        <Button size="lg" onClick={handleGetStarted} disabled={loading} className="text-lg px-8 bg-green-600 hover:bg-green-700">
          {loading ? "Setting Up..." : "Get Started"}
          {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Pill className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-semibold mb-2">Inventory Management</h3>
              <p className="text-sm text-muted-foreground">Track medicines and supplies in real-time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Prescription Processing</h3>
              <p className="text-sm text-muted-foreground">Digital prescriptions from doctors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="font-semibold mb-2">Delivery Service</h3>
              <p className="text-sm text-muted-foreground">Home delivery for patients</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <h3 className="font-semibold mb-2">24/7 Operations</h3>
              <p className="text-sm text-muted-foreground">Always available for emergencies</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-green-500/20 transition-shadow hover:shadow-lg">
            <CardContent className="p-8">
              <Users className="h-12 w-12 mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">Patient Database</h3>
              <p className="text-muted-foreground">Manage customer profiles, prescription history, and preferences</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-green-500/20 transition-shadow hover:shadow-lg">
            <CardContent className="p-8">
              <Shield className="h-12 w-12 mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">Compliance & Safety</h3>
              <p className="text-muted-foreground">Regulatory compliance tools and medication safety checks</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-green-500/20 transition-shadow hover:shadow-lg">
            <CardContent className="p-8">
              <CheckCircle2 className="h-12 w-12 mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">Sales insights, inventory trends, and performance metrics</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16 bg-green-50 dark:bg-green-950/20 rounded-3xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">1K+</div>
            <div className="text-muted-foreground">Partner Pharmacies</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">500K+</div>
            <div className="text-muted-foreground">Prescriptions Filled</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">50K+</div>
            <div className="text-muted-foreground">Deliveries Made</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">99.5%</div>
            <div className="text-muted-foreground">Accuracy Rate</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-0">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Modernize Your Pharmacy?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join leading pharmacies using our platform to improve efficiency and patient care.
            </p>
            <Button size="lg" onClick={handleGetStarted} disabled={loading} className="text-lg px-8 bg-green-600 hover:bg-green-700">
              {loading ? "Setting Up..." : "Create Your Profile"}
              {!loading && <CheckCircle2 className="ml-2 h-5 w-5" />}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
