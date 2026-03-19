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
  Phone,
  Mail,
  DollarSign,
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

interface Booking {
  id: string;
  created_at: string;
  listing_id: string;
  customer_id: string;
  provider_id: string;
  booking_date: string;
  booking_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed";
  total_price: number;
  currency: string;
  booking_type: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_notes?: string;
  listing?: {
    title: string;
    price_numeric: number;
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
        .from("service_bookings")
        .select(
          `
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
            .from("service_listings")
            .select("id, title, price_numeric")
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
        .from("service_bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus} successfully`);
      refetch();
    } catch (error: any) {
      toast.error(`Failed to update booking: ${error.message}`);
    }
  };

  // Filter bookings by search query
  const filteredBookings = bookings?.filter((booking) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      booking.listing?.title.toLowerCase().includes(searchTerm) ||
      booking.customer_name?.toLowerCase().includes(searchTerm) ||
      booking.customer_email?.toLowerCase().includes(searchTerm)
    );
  });

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle size={12} className="mr-1" />
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-700 hover:bg-amber-100"
          >
            <AlertCircle size={12} className="mr-1" />
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle size={12} className="mr-1" />
            Cancelled
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="destructive">
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
        <p className="text-muted-foreground">
          Manage your service appointments and bookings
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings?.filter((b) => b.status === "pending").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings?.filter((b) => b.status === "confirmed").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings
                ?.filter((b) => {
                  const bookingDate = new Date(b.booking_date);
                  const now = new Date();
                  return (
                    bookingDate.getMonth() === now.getMonth() &&
                    bookingDate.getFullYear() === now.getFullYear()
                  );
                })
                .reduce((sum, b) => sum + (b.total_price || 0), 0)
                .toFixed(2)}{" "}
              EGP
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service, customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
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
      <Card>
        <CardHeader>
          <CardTitle>
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
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-3 flex-1">
                    {/* Service Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">
                          {booking.listing?.title || "Service Booking"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {booking.customer_name || "Customer"}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar size={14} />
                        <span>
                          {format(
                            new Date(booking.booking_date),
                            "MMM dd, yyyy",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock size={14} />
                        <span>{booking.booking_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign size={14} />
                        <span>
                          {booking.total_price?.toFixed(2) || "0.00"}{" "}
                          {booking.currency || "EGP"}
                        </span>
                      </div>
                      {booking.customer_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail size={14} />
                          <span>{booking.customer_email}</span>
                        </div>
                      )}
                      {booking.customer_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone size={14} />
                          <span>{booking.customer_phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {booking.customer_notes && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Customer Notes:
                        </p>
                        <p className="text-sm">{booking.customer_notes}</p>
                      </div>
                    )}
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
                          className="bg-emerald-600 hover:bg-emerald-700"
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
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Mark Complete
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/services/listing/${booking.listing?.id}`}
                            className="flex items-center cursor-pointer"
                          >
                            <Eye size={16} className="mr-2" />
                            View Service
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/services/messages`}
                            className="flex items-center cursor-pointer"
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
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground">
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
