import { useProviderAnalytics } from "../hooks/useProviderAnalytics";
import { useRecentBookings } from "../hooks/useRecentBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Star,
  Users,
  Briefcase,
  Calendar,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export const DashboardHome = () => {
  const navigate = useNavigate();
  const { data: analytics, isLoading } = useProviderAnalytics();
  const { data: recentBookings } = useRecentBookings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold mb-4">Profile Required</h2>
        <p className="text-muted-foreground mb-4">
          Please complete your provider profile first
        </p>
        <Button onClick={() => navigate("/services/dashboard/onboard")}>
          Create Profile
        </Button>
      </div>
    );
  }

  const { profile, stats } = analytics;
  const isFreelance = profile.provider_type === "freelance";

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground">
          Here's what's happening with your services today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isFreelance ? "Active Projects" : "Pending Bookings"}
            </CardTitle>
            {isFreelance ? (
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Calendar className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating}/5.0</div>
            <p className="text-xs text-muted-foreground">
              Based on recent reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Recent {isFreelance ? "Projects" : "Bookings"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/services/dashboard/bookings")}
                className="text-sm text-violet-600 hover:text-violet-700"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings && recentBookings.length > 0 ? (
                recentBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {booking.listing?.title || "Service Request"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.customer_name || "Unknown Customer"} •{" "}
                        {format(new Date(booking.booking_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === "confirmed" ? "default" : "secondary"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    No recent activity.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/services/dashboard/bookings")}
                  >
                    View All Bookings
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate("/services/dashboard/create-listing")}
            >
              <span className="text-sm font-medium">Create New Listing</span>
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span className="text-sm font-medium">Manage Availability</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </Button>
            {isFreelance && (
              <Button variant="outline" className="w-full justify-between">
                <span className="text-sm font-medium">View Proposals</span>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
