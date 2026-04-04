import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";

export function HealthMessagesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Health Messages</h1>
        <p className="text-muted-foreground mb-4">Please sign in to view your health messages.</p>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/services/health">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Health
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Health Messages</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Secure Messaging
          </CardTitle>
          <CardDescription>
            Communicate securely with your healthcare providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground mb-4">
              Messages from your doctors and healthcare providers will appear here.
            </p>
            <Link to="/services/health/doctors">
              <Button>Find a Doctor</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
