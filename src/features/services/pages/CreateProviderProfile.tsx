import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CreateProviderProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContinue = () => {
    if (!user) {
      toast.error("You must be logged in");
      navigate("/login");
      return;
    }

    // Skip provider profile creation for now - go straight to creating listings
    navigate("/services/dashboard/create-listing");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Provider Profile</CardTitle>
          <CardDescription>
            Provider profiles are optional in the simple setup. You can create
            service listings directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            The simple services schema allows you to create listings without a
            separate provider profile. Your user account serves as the provider
            identity.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleContinue} size="lg">
              Continue to Create Listing
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/services/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
