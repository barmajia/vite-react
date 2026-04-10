import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Code2, 
  Palette, 
  Languages, 
  Mic, 
  PenTool, 
  Video,
  CheckCircle2,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  Shield
} from "lucide-react";

const serviceCategories = [
  { icon: Code2, name: "Programming", color: "text-blue-500" },
  { icon: Palette, name: "Design", color: "text-purple-500" },
  { icon: Languages, name: "Translation", color: "text-green-500" },
  { icon: Mic, name: "Voice Over", color: "text-red-500" },
  { icon: PenTool, name: "Writing", color: "text-yellow-500" },
  { icon: Video, name: "Video Editing", color: "text-pink-500" },
];

export function FreelancerWelcomePage() {
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
      
      toast.success("Welcome aboard! Let's set up your profile");
      navigate("/freelancer/dashboard");
    } catch (error) {
      toast.error("Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          🚀 Join Our Freelance Network
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Turn Your Skills Into
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> Income</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Connect with clients worldwide and offer your professional services. 
          From programming to design, translation to video editing - monetize your expertise.
        </p>
        <Button size="lg" onClick={handleGetStarted} disabled={loading} className="text-lg px-8">
          {loading ? "Setting Up..." : "Start Earning Now"}
          {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
      </section>

      {/* Service Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Offer Your Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {serviceCategories.map((category) => (
            <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
              <CardContent className="p-6 text-center">
                <category.icon className={`h-12 w-12 mx-auto mb-4 ${category.color}`} />
                <h3 className="font-semibold">{category.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Global Clients</h3>
              <p className="text-sm text-muted-foreground">Access clients from around the world</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Set Your Rates</h3>
              <p className="text-sm text-muted-foreground">Control your pricing and earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="font-semibold mb-2">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">Guaranteed payment protection</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="font-semibold mb-2">Build Reputation</h3>
              <p className="text-sm text-muted-foreground">Grow with reviews and ratings</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
            <h3 className="font-semibold mb-2">Create Profile</h3>
            <p className="text-muted-foreground">Showcase your skills and portfolio</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
            <h3 className="font-semibold mb-2">Get Hired</h3>
            <p className="text-muted-foreground">Connect with clients and accept projects</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
            <h3 className="font-semibold mb-2">Earn Money</h3>
            <p className="text-muted-foreground">Complete work and receive secure payments</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">10K+</div>
            <div className="text-muted-foreground">Active Freelancers</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">50K+</div>
            <div className="text-muted-foreground">Projects Completed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">$5M+</div>
            <div className="text-muted-foreground">Paid to Freelancers</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">98%</div>
            <div className="text-muted-foreground">Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-0">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of freelancers who are already earning money doing what they love.
            </p>
            <Button size="lg" onClick={handleGetStarted} disabled={loading} className="text-lg px-8">
              {loading ? "Setting Up..." : "Create Your Profile"}
              {!loading && <CheckCircle2 className="ml-2 h-5 w-5" />}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
