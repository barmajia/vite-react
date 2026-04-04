import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";

export function PatientAppointmentsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">My Appointments</h1>
        <p className="text-muted-foreground mb-4">Please sign in to view your appointments.</p>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/services/health/patient/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">My Appointments</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
          <CardDescription>
            View and manage your healthcare appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No appointments scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Book an appointment with a doctor to get started.
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
