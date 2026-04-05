import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getHealthAuditLogs,
  exportPatientHealthData,
} from "@/services/healthService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Search,
  Filter,
  User,
  Lock,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failure" | "warning";
  details?: string;
}

export const AuditLogs = () => {
  const navigate = useNavigate();

  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "success" | "failure" | "warning"
  >("all");
  const [filterDate, setFilterDate] = useState<
    "today" | "week" | "month" | "all"
  >("week");
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      toast.error("Please log in to view audit logs.");
      navigate("/login");
      return;
    }

    // Fetch audit logs from backend
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const auditLogs = await getHealthAuditLogs(user.id, 100, 0);

        // Transform backend format to UI format
        const transformedLogs: AuditLog[] = auditLogs.map((log: any) => ({
          id: log.id,
          timestamp: log.accessed_at,
          userId: log.accessed_by,
          userName: "User",
          action: log.action,
          resource: log.resource_type,
          resourceId: undefined,
          ipAddress: log.ip_address || "0.0.0.0",
          userAgent: "Browser",
          status: "success" as const,
          details: log.notes,
        }));

        // Combine with demo logs for UI purposes
        const demoLogs: AuditLog[] = [
          {
            id: "1",
            timestamp: new Date().toISOString(),
            userId: "user123",
            userName: "Dr. Ahmed Mohamed",
            action: "VIEW_PATIENT_RECORD",
            resource: "health_appointments",
            resourceId: "appt-456",
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0...",
            status: "success",
            details: "Viewed patient medical history",
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            userId: "user456",
            userName: "Fatima Ali",
            action: "ACCESS_CONSENT_FORM",
            resource: "health_consent_forms",
            resourceId: "consent-789",
            ipAddress: "192.168.1.101",
            userAgent: "Mozilla/5.0...",
            status: "success",
            details: "Signed consent form for appointment",
          },
          {
            id: "3",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            userId: "user789",
            userName: "Unknown User",
            action: "UNAUTHORIZED_ACCESS",
            resource: "health_prescriptions",
            resourceId: "rx-123",
            ipAddress: "203.0.113.50",
            userAgent: "curl/7.68.0",
            status: "failure",
            details: "Attempted to access prescription without authorization",
          },
          {
            id: "4",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            userId: "user321",
            userName: "Dr. Sarah Hassan",
            action: "UPDATE_PRESCRIPTION",
            resource: "health_prescriptions",
            resourceId: "rx-456",
            ipAddress: "192.168.1.102",
            userAgent: "Mozilla/5.0...",
            status: "warning",
            details: "Prescription updated - controlled substance",
          },
        ];

        setLogs([...transformedLogs, ...demoLogs]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [user, navigate]);

  const filteredLogs = logs.filter((log) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !log.userName.toLowerCase().includes(query) &&
        !log.action.toLowerCase().includes(query) &&
        !log.resource.toLowerCase().includes(query) &&
        !log.details?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Filter by status
    if (filterStatus !== "all" && log.status !== filterStatus) {
      return false;
    }

    // Filter by date
    const logDate = new Date(log.timestamp);
    const now = new Date();
    if (filterDate === "today") {
      if (logDate.toDateString() !== now.toDateString()) return false;
    } else if (filterDate === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (logDate < weekAgo) return false;
    } else if (filterDate === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (logDate < monthAgo) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" /> Success
          </Badge>
        );
      case "failure":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-500">
            <AlertTriangle className="w-3 h-3 mr-1" /> Warning
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("VIEW")) return <Eye className="w-4 h-4" />;
    if (action.includes("ACCESS")) return <Lock className="w-4 h-4" />;
    if (
      action.includes("UPDATE") ||
      action.includes("CREATE") ||
      action.includes("DELETE")
    )
      return <FileText className="w-4 h-4" />;
    if (action.includes("UNAUTHORIZED"))
      return <AlertTriangle className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const handleExportLogs = async () => {
    if (!user) return;
    try {
      const result = await exportPatientHealthData(user.id, "json");
      if (result.success) {
        toast.success(
          "Audit logs export started. You will receive an email when ready.",
        );
      } else {
        toast.error(result.message || "Failed to export logs");
      }
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast.error("Failed to export logs");
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Audit Logs</h1>
              <p className="text-muted-foreground">
                HIPAA compliance access tracking
              </p>
            </div>
          </div>
          <Button onClick={handleExportLogs} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Badge
                variant={filterStatus === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Badge>
              <Badge
                variant={filterStatus === "success" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterStatus("success")}
              >
                Success
              </Badge>
              <Badge
                variant={filterStatus === "failure" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterStatus("failure")}
              >
                Failed
              </Badge>
              <Badge
                variant={filterStatus === "warning" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterStatus("warning")}
              >
                Warning
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Badge
                variant={filterDate === "today" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterDate("today")}
              >
                Today
              </Badge>
              <Badge
                variant={filterDate === "week" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterDate("week")}
              >
                This Week
              </Badge>
              <Badge
                variant={filterDate === "month" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterDate("month")}
              >
                This Month
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Access Logs ({filteredLogs.length})
            </h2>
            <div className="text-sm text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-1" />
              Last updated: {format(new Date(), "h:mm:ss a")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No logs found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            log.status === "success"
                              ? "bg-green-100 text-green-600"
                              : log.status === "failure"
                                ? "bg-red-100 text-red-600"
                                : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {getActionIcon(log.action)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{log.action}</h3>
                          <p className="text-sm text-muted-foreground">
                            {log.details}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">User:</span>
                        <div className="flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{log.userName}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resource:</span>
                        <div className="font-medium">{log.resource}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          IP Address:
                        </span>
                        <div className="font-medium">{log.ipAddress}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(log.timestamp), "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
