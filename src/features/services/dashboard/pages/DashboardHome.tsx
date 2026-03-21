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
import { cn } from "@/lib/utils";

export const DashboardHome = () => {
  const navigate = useNavigate();
  const { data: analytics, isLoading } = useProviderAnalytics();
  const { data: recentBookings } = useRecentBookings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <Briefcase className="h-16 w-16 text-violet-600 dark:text-violet-400 mb-4" />
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Profile Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please complete your provider profile first
        </p>
        <Button
          onClick={() => navigate("/services/dashboard/onboard")}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
        >
          Create Profile
        </Button>
      </div>
    );
  }

  const { profile, stats } = analytics;
  const isFreelance = profile.provider_type === "freelance";

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue}`,
      trend: "+20.1% from last month",
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: isFreelance ? "Active Projects" : "Pending Bookings",
      value: stats.pendingBookings,
      trend: "Requires attention",
      icon: isFreelance ? Briefcase : Calendar,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Total Jobs",
      value: stats.completedJobs,
      trend: "Lifetime completions",
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Rating",
      value: `${stats.rating}/5.0`,
      trend: "Based on recent reviews",
      icon: Star,
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-violet-500/30">
        <h2 className="text-3xl font-bold">
          Welcome back, {profile.provider_type || "Provider"}
        </h2>
        <p className="text-violet-100 mt-2">
          Here's what's happening with your services today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <Card
            key={index}
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {card.title}
              </CardTitle>
              <div
                className={cn(
                  "p-2 rounded-lg bg-gradient-to-br text-white",
                  card.gradient,
                )}
              >
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {card.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">
                Recent {isFreelance ? "Projects" : "Bookings"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/services/dashboard/bookings")}
                className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
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
                    className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-900 dark:text-white">
                        {booking.listing?.title || "Service Request"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.customer_name || "Unknown Customer"} •{" "}
                        {format(new Date(booking.booking_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-full",
                        booking.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
                      )}
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    No recent activity.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/services/dashboard/bookings")}
                    className="border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  >
                    View All Bookings
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button
              variant="outline"
              className="w-full justify-between h-12 border-gray-200 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700 group"
              onClick={() => navigate("/services/dashboard/create-listing")}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-400">
                Create New Listing
              </span>
              <PlusCircle className="h-4 w-4 text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between h-12 border-gray-200 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700 group"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-400">
                Manage Availability
              </span>
              <Calendar className="h-4 w-4 text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            </Button>
            {isFreelance && (
              <Button
                variant="outline"
                className="w-full justify-between h-12 border-gray-200 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700 group"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-400">
                  View Proposals
                </span>
                <Briefcase className="h-4 w-4 text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
