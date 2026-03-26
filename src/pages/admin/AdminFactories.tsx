// src/pages/admin/AdminFactories.tsx
// Admin Factories Management

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Factory, CheckCircle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FactoryData {
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  location?: string;
  created_at: string;
}

export function AdminFactories() {
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState<FactoryData[]>([]);

  useEffect(() => {
    loadFactories();
  }, []);

  const loadFactories = async () => {
    try {
      setLoading(true);

      // Get factory users
      const { data: factoriesData, error } = await supabase
        .from("users")
        .select("user_id, full_name, email, created_at")
        .eq("account_type", "factory");

      if (error) throw error;

      // Get seller profiles for verification status
      const userIds = factoriesData?.map((f) => f.user_id) || [];
      const { data: sellersData } = await supabase
        .from("sellers")
        .select("user_id, is_verified, location")
        .in("user_id", userIds);

      const sellersMap = new Map(sellersData?.map((s) => [s.user_id, s]));

      const transformed =
        factoriesData?.map((f: any) => ({
          user_id: f.user_id,
          full_name: f.full_name,
          email: f.email,
          is_verified: sellersMap.get(f.user_id)?.is_verified || false,
          location: sellersMap.get(f.user_id)?.location,
          created_at: f.created_at,
        })) || [];

      setFactories(transformed);
    } catch (error) {
      console.error("Load factories error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factories Management</h1>
          <p className="text-muted-foreground">{factories.length} factories</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            All Factories
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factory</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : factories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No factories found
                  </TableCell>
                </TableRow>
              ) : (
                factories.map((factory) => (
                  <TableRow key={factory.user_id}>
                    <TableCell className="font-medium">
                      {factory.full_name}
                    </TableCell>
                    <TableCell>{factory.email}</TableCell>
                    <TableCell>{factory.location || "—"}</TableCell>
                    <TableCell>
                      {factory.is_verified ? (
                        <Badge className="bg-green-100 text-green-800 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(factory.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
