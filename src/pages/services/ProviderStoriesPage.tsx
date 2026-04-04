import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export function ProviderStoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/services">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Services
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Provider Stories</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Service Provider Stories
          </CardTitle>
          <CardDescription>
            Discover success stories from our service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              We're gathering amazing stories from our service providers. Check back soon!
            </p>
            <Link to="/services">
              <Button>Browse Services</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
