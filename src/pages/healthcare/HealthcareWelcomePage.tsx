import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Hospital, 
  Stethoscope, 
  Building2,
  CheckCircle2,
  ArrowRight,
  Users,
  Clock,
  Shield,
  Heart
} from "lucide-react";

export function HealthcareWelcomePage() {
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
      
      toast.success("Welcome! Let's set up your healthcare facility");
      navigate("/healthcare/dashboard");
    } catch (error) {
      toast.error("Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50 dark:to-blue-950/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-800">
          🏥 Healthcare Provider Network
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Deliver Quality
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"> Healthcare Services</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Manage your hospital, clinic, or pharmacy with our comprehensive platform. 
          Connect with patients, manage appointments, and streamline operations.
        </p>
        <Button size="lg" onClick={handleGetStarted} disabled={loading} className="text-lg px-8 bg-blue-600 hover:bg-blue-700">
          {loading ? "Setting Up..." : "Get Started"}
          {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
      </section>

      {/* Provider Types */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Provider Type</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500/20">
            <CardContent className="p-8 text-center">
              <Hospital className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Hospital</h3>
              <p className="text-muted-foreground">Manage departments, doctors, and patient care</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-cyan-500/20">
            <CardContent className="p-8 text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-cyan-600" />
              <h3 className="text-xl font-semibold mb-2">Clinic</h3>
              <p className="text-muted-foreground">Streamline appointments and patient records</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500/20">
            <CardContent className="p-8 text-center">
              <Stethoscope className="h-16 w-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">Pharmacy</h3>
              <p className="text-muted-foreground">Manage inventory and prescriptions</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Patient Management</h3>
              <p className="text-sm text-muted-foreground">Complete patient records and history</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-semibold mb-2">Appointment Scheduling</h3>
              <p className="text-sm text-muted-foreground">Easy booking and calendar management</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="font-semibold mb-2">Secure & Compliant</h3>
              <p className="text-sm text-muted-foreground">HIPAA compliant data protection</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="font-semibold mb-2">Quality Care</h3>
              <p className="text-sm text-muted-foreground">Tools to improve patient outcomes</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16 bg-blue-50 dark:bg-blue-950/20 rounded-3xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-muted-foreground">Healthcare Providers</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">100K+</div>
            <div className="text-muted-foreground">Patients Served</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
            <div className="text-muted-foreground">Appointments Booked</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">99%</div>
            <div className="text-muted-foreground">Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-0">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Healthcare?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join leading healthcare providers using our platform to deliver better patient care.
            </p>
            <Button size="lg" onClick={handleGetStarted} disabled={loading} className="text-lg px-8 bg-blue-600 hover:bg-blue-700">
              {loading ? "Setting Up..." : "Create Your Profile"}
              {!loading && <CheckCircle2 className="ml-2 h-5 w-5" />}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
