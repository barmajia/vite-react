import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Download } from "lucide-react";

const PatientDataExport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleExport = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // TODO: Request data export from backend
      // Assuming a RPC function or a specific table 'data_export_requests'
      const { error } = await supabase
        .from("data_export_requests")
        .insert({ user_id: user.id, status: "pending" });

      if (error) throw error;
      setMessage(
        "Export request submitted. You will receive an email shortly.",
      );
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Export My Health Data</h2>
      <p className="text-gray-600 mb-6">
        Download a copy of your medical records, appointments, and consent
        forms.
      </p>
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        <Download size={20} />
        {loading ? "Processing..." : "Request Export"}
      </button>
      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default PatientDataExport;
