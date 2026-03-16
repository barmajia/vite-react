import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProviderProfilePage() {
  const { providerId } = useParams<{ providerId: string }>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [providerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading provider profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/services">
          <ArrowLeft size={16} className="mr-2" />
          Back to Services
        </Link>
      </Button>

      <Card>
        <CardContent className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Provider Profile</h1>
          <p className="text-muted-foreground mb-6">
            Provider profiles are coming soon. This feature will show detailed
            information about service providers, their listings, and reviews.
          </p>
          <Button asChild>
            <Link to="/services">Browse Services</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
