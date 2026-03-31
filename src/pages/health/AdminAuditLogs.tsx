import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Activity } from "lucide-react";

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  action: string;
  details: string;
}

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // TODO: Fetch audit logs from Supabase
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setLogs(data || []);
      } catch (error: any) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="text-blue-600" />
        <h2 className="text-2xl font-bold">System Audit Logs</h2>
      </div>
      {loading ? (
        <p>Loading logs...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Time</th>
                <th className="py-2 px-4 border">User</th>
                <th className="py-2 px-4 border">Action</th>
                <th className="py-2 px-4 border">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border">{log.user_id}</td>
                  <td className="py-2 px-4 border">{log.action}</td>
                  <td className="py-2 px-4 border">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
