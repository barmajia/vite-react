import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Debug page - shows actual database columns
export default function DebugMarketplace() {
  const [columns, setColumns] = useState<string[]>([]);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkColumns() {
      try {
        // Try to get all columns
        const { data, error } = await supabase
          .from("website_marketplace")
          .select("*")
          .limit(1);

        if (error) {
          setError(error.message);
          return;
        }

        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]));
          setData(data[0]);
        } else {
          // No data - try to get table info from information_schema
          const { data: tableInfo, error: tableError } = await supabase.rpc(
            "get_table_columns",
            { table_name: "website_marketplace" }
          );
          if (tableError) {
            setError("No data and no table info: " + tableError.message);
          } else {
            setData(tableInfo);
          }
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    checkColumns();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Marketplace Table Debug</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Available Columns:</h2>
        <div className="bg-gray-100 p-4 rounded font-mono text-sm">
          {columns.length > 0 ? (
            <ul className="list-disc list-inside">
              {columns.map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          ) : (
            <p>No data found or columns could not be determined</p>
          )}
        </div>
      </div>

      {data && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Sample Data:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
