import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, ShoppingBag, ArrowRight, Star, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export function ServicesGateway() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Briefcase className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to Aurora
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your gateway to exceptional services and quality products
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/services')} className="text-lg px-8">
              Find Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/products')} className="text-lg px-8">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Shop Products
            </Button>
          </div>
        </div>

        {/* Two Main Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Services Card */}
          <Card 
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary overflow-hidden"
            onClick={() => navigate('/services')}
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground">
                <Briefcase className="h-16 w-16 mb-6" />
                <h2 className="text-3xl font-bold mb-4">Hire Experts</h2>
                <p className="text-primary-foreground/90 mb-6">
                  Find talented freelancers, agencies, and professionals for any project
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    <span>Developers, Designers, Writers & More</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Medical Consultations & Clinics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span>Quick Turnaround & Professional Results</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-background">
                <Button className="w-full" size="lg">
                  Explore Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card 
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-accent overflow-hidden"
            onClick={() => navigate('/products')}
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-accent to-accent/80 p-8 text-accent-foreground">
                <ShoppingBag className="h-16 w-16 mb-6" />
                <h2 className="text-3xl font-bold mb-4">Shop Products</h2>
                <p className="text-accent-foreground/90 mb-6">
                  Discover quality products from verified sellers worldwide
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    <span>Electronics, Fashion, Home & More</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Trusted Sellers & Secure Payments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span>Fast Shipping & Easy Returns</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-background">
                <Button className="w-full" size="lg" variant="outline">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA for Providers */}
        {!user && (
          <div className="text-center max-w-2xl mx-auto">
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Are you a Service Provider?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of professionals offering their services on Aurora. 
                  Create your profile and start connecting with clients today.
                </p>
                <Button size="lg" onClick={() => navigate('/signup')}>
                  Become a Provider
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer Links */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
