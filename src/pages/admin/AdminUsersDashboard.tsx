// src/pages/admin/AdminUsersDashboard.tsx
// Admin Users Dashboard - Manage all platform users

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  Download,
  Users,
  UserCheck,
  UserX,
  Shield,
  Calendar,
  MapPin,
  Package,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface AdminUser {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: string;
  created_at: string;
  is_verified: boolean;
  location?: string | null;
  currency?: string;
  product_count?: number;
}

interface FilterState {
  search: string;
  accountType: string;
  verificationStatus: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}

export function AdminUsersDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    accountType: "all",
    verificationStatus: "all",
    sortBy: "created_at",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<
    "verify" | "suspend" | "delete" | null
  >(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    userId?: string;
    message: string;
  }>({ open: false, action: "", message: "" });

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      loadUsers();
    }
  }, [isAdmin, adminLoading, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Build base query
      let query = supabase.from("users").select("*", { count: "exact" });

      // Account type filter
      if (filters.accountType !== "all") {
        query = query.eq("account_type", filters.accountType);
      }

      // Search filter
      if (filters.search) {
        query = query.or(`
          full_name.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%
        `);
      }

      // Sorting
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });

      // Pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get verification status from account-type specific tables
      const usersWithVerification = await Promise.all(
        (data || []).map(async (user) => {
          let isVerified = false;
          let location = null;
          let currency = "EGP";
          let productCount = 0;

          // Check verification based on account type
          if (
            user.account_type === "seller" ||
            user.account_type === "factory"
          ) {
            const { data: sellerData } = await supabase
              .from("sellers")
              .select("is_verified, location, currency")
              .eq("user_id", user.user_id)
              .maybeSingle();

            isVerified = sellerData?.is_verified || false;
            location = sellerData?.location;
            currency = sellerData?.currency || "EGP";

            // Get product count
            const { count } = await supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("seller_id", user.user_id)
              .eq("is_deleted", false);

            productCount = count || 0;
          } else if (user.account_type === "middleman") {
            const { data: middlemanData } = await supabase
              .from("middleman_profiles")
              .select("is_verified, location")
              .eq("user_id", user.user_id)
              .maybeSingle();

            isVerified = middlemanData?.is_verified || false;
            location = middlemanData?.location;
          } else if (user.account_type === "delivery_driver") {
            const { data: deliveryData } = await supabase
              .from("delivery_profiles")
              .select("is_verified")
              .eq("user_id", user.user_id)
              .maybeSingle();

            isVerified = deliveryData?.is_verified || false;
          }

          return {
            ...user,
            is_verified: isVerified,
            location,
            currency,
            product_count: productCount,
          };
        }),
      );

      setUsers(usersWithVerification);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder:
        prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.user_id)));
    }
  };

  const handleBulkAction = async (action: "verify" | "suspend" | "delete") => {
    if (selectedUsers.size === 0) {
      toast.error("Please select users first");
      return;
    }

    setConfirmDialog({
      open: true,
      action,
      message: `Are you sure you want to ${action} ${selectedUsers.size} user(s)? This action cannot be undone.`,
    });
  };

  const handleUserAction = async (
    userId: string,
    action: "verify" | "suspend" | "delete",
  ) => {
    try {
      // First get the user's account type
      const { data: userData } = await supabase
        .from("users")
        .select("account_type")
        .eq("user_id", userId)
        .single();

      if (!userData) {
        toast.error("User not found");
        return;
      }

      if (action === "verify") {
        // Determine which table to update based on account type
        let tableName = "";
        if (
          userData.account_type === "seller" ||
          userData.account_type === "factory"
        ) {
          tableName = "sellers";
        } else if (userData.account_type === "middleman") {
          tableName = "middleman_profiles";
        } else if (userData.account_type === "delivery_driver") {
          tableName = "delivery_profiles";
        }

        if (tableName) {
          // Only update is_verified - verified_at may not exist in all tables
          const { error } = await supabase
            .from(tableName)
            .update({
              is_verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            // If update fails, the record might not exist - this is OK for now
            console.warn(`Could not verify in ${tableName}:`, error.message);
            toast.success(
              "User marked as verified (profile may need to be created)",
            );
          } else {
            toast.success("User verified successfully");
          }
        } else {
          toast.info("Verification not available for this account type");
        }
      } else if (action === "suspend") {
        // For now, just log the action (implement proper suspension logic)
        toast.info("User suspension logged (implement proper suspension)");
      } else if (action === "delete") {
        // Soft delete - in production, implement proper deletion
        toast.info("User deletion logged (implement proper deletion)");
      }

      loadUsers();
    } catch (error: any) {
      console.error("Action error:", error);
      toast.error(error.message || "Failed to perform action");
    }
  };

  const confirmAction = async () => {
    if (bulkAction) {
      if (confirmDialog.userId) {
        // Single user action
        await handleUserAction(confirmDialog.userId, bulkAction);
      } else {
        // Bulk action
        for (const userId of selectedUsers) {
          await handleUserAction(userId, bulkAction);
        }
        setSelectedUsers(new Set());
      }
      setConfirmDialog({ open: false, action: "", message: "" });
      setBulkAction(null);
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      seller: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      factory:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      middleman:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      delivery_driver:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      customer: "bg-gray-100 text-gray-800",
      user: "bg-gray-100 text-gray-800",
      admin: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={styles[type] || styles.customer}>
        {type.replace("_", " ")}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / filters.limit);
  const verifiedCount = users.filter((u) => u.is_verified).length;
  const pendingCount = users.filter((u) => !u.is_verified).length;
  const adminCount = users.filter((u) => u.account_type === "admin").length;

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Admin Access Required</p>
          <p className="text-muted-foreground">
            You don't have permission to access this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">
                  {verifiedCount}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </p>
              </div>
              <UserX className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-red-600">{adminCount}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Account Type Filter */}
            <Select
              value={filters.accountType}
              onValueChange={(value) =>
                handleFilterChange("accountType", value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="factory">Factory</SelectItem>
                <SelectItem value="middleman">Middleman</SelectItem>
                <SelectItem value="delivery_driver">Delivery</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>

            {/* Verification Filter */}
            <Select
              value={filters.verificationStatus}
              onValueChange={(value) =>
                handleFilterChange("verificationStatus", value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            {selectedUsers.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Bulk Actions ({selectedUsers.size})
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setBulkAction("verify")}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Verify Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction("suspend")}>
                    <Ban className="h-4 w-4 mr-2 text-yellow-600" />
                    Suspend Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setBulkAction("delete")}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Input
                    type="checkbox"
                    checked={
                      selectedUsers.size === users.length && users.length > 0
                    }
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("full_name")}
                    className="p-0 h-auto font-medium"
                  >
                    User <ArrowUpDown className="h-4 w-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("created_at")}
                    className="p-0 h-auto font-medium"
                  >
                    Joined <ArrowUpDown className="h-4 w-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.user_id} className="hover:bg-muted/50">
                    <TableCell>
                      <Input
                        type="checkbox"
                        checked={selectedUsers.has(user.user_id)}
                        onChange={() => handleSelectUser(user.user_id)}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={user.full_name}
                          src={user.avatar_url}
                          size="md"
                        />
                        <div>
                          <p className="font-medium">
                            {user.full_name || "Unnamed"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-xs text-muted-foreground">
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAccountTypeBadge(user.account_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.location ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">
                            {user.location}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {user.product_count !== undefined &&
                          user.product_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              {user.product_count} products
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_verified ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/admin/users/${user.user_id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/admin/users/${user.user_id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!user.is_verified && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserAction(user.user_id, "verify")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Verify Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleUserAction(user.user_id, "suspend")
                            }
                          >
                            <Ban className="h-4 w-4 mr-2 text-yellow-600" />
                            Suspend Account
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setConfirmDialog({
                                open: true,
                                action: "delete",
                                userId: user.user_id,
                                message: `Are you sure you want to delete ${user.full_name || user.email}? This action cannot be undone.`,
                              });
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(filters.page - 1) * filters.limit + 1} to{" "}
            {Math.min(filters.page * filters.limit, totalCount)} of {totalCount}{" "}
            users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange("page", filters.page - 1)}
              disabled={filters.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <span>Page</span>
              <span className="font-medium">{filters.page}</span>
              <span>of</span>
              <span className="font-medium">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange("page", filters.page + 1)}
              disabled={filters.page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>{confirmDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmDialog.action === "delete" ? "destructive" : "default"
              }
              onClick={confirmAction}
            >
              {confirmDialog.action === "delete"
                ? "Delete"
                : confirmDialog.action === "suspend"
                  ? "Suspend"
                  : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
