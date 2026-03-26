import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  MessageSquare,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  created_at: string;
  ordered_at: string;
  listing_id: string;
  customer_id: string;
  provider_id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed";
  agreed_price: number;
  booking_type: string;
  listing?: {
    title: string;
    price: number;
    id: string;
  };
}

export const BookingsPage = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all bookings for this provider
  const {
    data: bookings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["provider-bookings", user?.id, statusFilter],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("svc_orders")
        .select(
          `
          id,
          ordered_at,
          status,
          agreed_price,
          *,
          listing_id
        `,
        )
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch listing details separately if we have bookings
      if (data && data.length > 0) {
        const listingIds = [
          ...new Set(data.map((b) => b.listing_id).filter(Boolean)),
        ];
        if (listingIds.length > 0) {
          const { data: listings } = await supabase
            .from("svc_listings")
            .select("id, title, price")
            .in("id", listingIds);

          // Merge listings with bookings
          return data.map((booking) => ({
            ...booking,
            listing: listings?.find((l) => l.id === booking.listing_id),
          }));
        }
      }

      return data;
    },
    enabled: !!user,
  });

  // Update booking status
  const updateBookingStatus = async (
    bookingId: string,
    newStatus: Booking["status"],
  ) => {
    try {
      const { error } = await supabase
        .from("svc_orders")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus} successfully`);
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to update booking: ${errorMessage}`);
    }
  };

  // Filter bookings by search query
  const filteredBookings = bookings?.filter((booking) => {
    const searchTerm = searchQuery.toLowerCase();
    return booking.listing?.title.toLowerCase().includes(searchTerm);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
            <CheckCircle size={12} className="mr-1" />
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100">
            <AlertCircle size={12} className="mr-1" />
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
            <XCircle size={12} className="mr-1" />
            Cancelled
          </Badge>
        );
      case "disputed":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
            <AlertCircle size={12} className="mr-1" />
            Disputed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading bookings...
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Bookings",
      value: bookings?.length || 0,
      icon: Calendar,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Pending",
      value: bookings?.filter((b) => b.status === "pending").length || 0,
      icon: AlertCircle,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      title: "Confirmed",
      value: bookings?.filter((b) => b.status === "confirmed").length || 0,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: "This Month",
      value: `${bookings
        ?.filter((b) => {
          const bookingDate = new Date(b.ordered_at || b.created_at);
          const now = new Date();
          return (
            bookingDate.getMonth() === now.getMonth() &&
            bookingDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, b) => sum + (b.agreed_price || 0), 0)
        .toFixed(2)} EGP`,
      icon: DollarSign,
      gradient: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-violet-500/30">
        <h2 className="text-3xl font-bold">Bookings</h2>
        <p className="text-violet-100 mt-2">
          Manage your service appointments and bookings
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div
                className={cn(
                  "p-2 rounded-lg bg-gradient-to-br text-white",
                  stat.gradient,
                )}
              >
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by service, customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            {filteredBookings?.length || 0} Booking
            {(filteredBookings?.length || 0) !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings && filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors bg-white dark:bg-gray-800/50"
                >
                  <div className="space-y-3 flex-1">
                    {/* Service Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-gray-900 dark:text-white">
                          {booking.listing?.title || "Service Booking"}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Booking #{booking.id.slice(0, 8)}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>
                          {format(
                            new Date(booking.ordered_at || booking.created_at),
                            "MMM dd, yyyy",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Clock size={14} />
                        <span>
                          {new Date(
                            booking.ordered_at || booking.created_at,
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <DollarSign size={14} />
                        <span>
                          {booking.agreed_price?.toFixed(2) || "0.00"} EGP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    {booking.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateBookingStatus(booking.id, "confirmed")
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateBookingStatus(booking.id, "cancelled")
                          }
                          className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <XCircle size={16} className="mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateBookingStatus(booking.id, "completed")
                        }
                        className="border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Mark Complete
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/services/listing/${booking.listing?.id}`}
                            className="flex items-center cursor-pointer text-gray-700 dark:text-gray-200"
                          >
                            <Eye size={16} className="mr-2" />
                            View Service
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/services/messages`}
                            className="flex items-center cursor-pointer text-gray-700 dark:text-gray-200"
                          >
                            <MessageSquare size={16} className="mr-2" />
                            Contact Customer
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No bookings found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "You haven't received any bookings yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
