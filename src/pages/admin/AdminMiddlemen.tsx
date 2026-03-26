// src/pages/admin/AdminMiddlemen.tsx
// Admin Middlemen Management

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MiddlemanData {
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  company_name?: string;
  commission_rate?: number;
  location?: string;
  created_at: string;
}

export function AdminMiddlemen() {
  const [loading, setLoading] = useState(true);
  const [middlemen, setMiddlemen] = useState<MiddlemanData[]>([]);

  useEffect(() => {
    loadMiddlemen();
  }, []);

  const loadMiddlemen = async () => {
    try {
      setLoading(true);

      // Get middleman users
      const { data: middlemenData, error } = await supabase
        .from("users")
        .select("user_id, full_name, email, created_at")
        .eq("account_type", "middleman");

      if (error) throw error;

      // Get middleman profiles
      const userIds = middlemenData?.map((m) => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from("middleman_profiles")
        .select("user_id, is_verified, company_name, commission_rate, location")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]));

      const transformed =
        middlemenData?.map((m: any) => ({
          user_id: m.user_id,
          full_name: m.full_name,
          email: m.email,
          is_verified: profilesMap.get(m.user_id)?.is_verified || false,
          company_name: profilesMap.get(m.user_id)?.company_name,
          commission_rate: profilesMap.get(m.user_id)?.commission_rate,
          location: profilesMap.get(m.user_id)?.location,
          created_at: m.created_at,
        })) || [];

      setMiddlemen(transformed);
    } catch (error) {
      console.error("Load middlemen error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Middlemen Management</h1>
          <p className="text-muted-foreground">{middlemen.length} middlemen</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            All Middlemen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : middlemen.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No middlemen found
                  </TableCell>
                </TableRow>
              ) : (
                middlemen.map((m) => (
                  <TableRow key={m.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{m.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{m.company_name || "—"}</TableCell>
                    <TableCell>
                      {m.commission_rate ? `${m.commission_rate}%` : "—"}
                    </TableCell>
                    <TableCell>{m.location || "—"}</TableCell>
                    <TableCell>
                      {m.is_verified ? (
                        <Badge className="bg-green-100 text-green-800 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(m.created_at).toLocaleDateString()}
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
