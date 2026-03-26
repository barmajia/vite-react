// src/pages/admin/AdminConversations.tsx
// Admin Conversations - View all platform chats

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Filter, Eye, Loader2 } from "lucide-react";
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

interface Conversation {
  id: string;
  context: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
  is_archived: boolean;
  participants: {
    user_id: string;
    full_name: string;
    account_type: string;
  }[];
}

export function AdminConversations() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [contextFilter, setContextFilter] = useState("all");

  useEffect(() => {
    loadConversations();
  }, [contextFilter]);

  const loadConversations = async () => {
    try {
      setLoading(true);

      const { data: conversationsData, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get participants for each conversation
      const convIds = conversationsData?.map((c) => c.id) || [];
      const { data: participantsData } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", convIds);

      // Get user details for participants
      const participantUserIds = [
        ...new Set(participantsData?.map((p) => p.user_id).filter(Boolean)),
      ];
      const { data: usersData } = await supabase
        .from("users")
        .select("user_id, full_name, account_type")
        .in("user_id", participantUserIds);

      const usersMap = new Map(
        usersData?.map((u) => [
          u.user_id,
          { name: u.full_name, type: u.account_type },
        ]),
      );

      // Group participants by conversation
      const participantsByConv = new Map();
      participantsData?.forEach((p) => {
        if (!participantsByConv.has(p.conversation_id)) {
          participantsByConv.set(p.conversation_id, []);
        }
        const userInfo = usersMap.get(p.user_id);
        participantsByConv.get(p.conversation_id).push({
          user_id: p.user_id,
          full_name: userInfo?.name || "Unknown",
          account_type: userInfo?.type || "unknown",
        });
      });

      const transformed =
        conversationsData?.map((conv: any) => ({
          id: conv.id,
          context: conv.context || "general",
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          created_at: conv.created_at,
          is_archived: conv.is_archived,
          participants: participantsByConv.get(conv.id) || [],
        })) || [];

      setConversations(transformed);
    } catch (error) {
      console.error("Load conversations error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.last_message?.toLowerCase().includes(search.toLowerCase()) ||
      conv.participants.some((p) =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()),
      );

    const matchesContext =
      contextFilter === "all" || conv.context === contextFilter;

    return matchesSearch && matchesContext;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Conversations</h1>
          <p className="text-muted-foreground">Monitor all platform chats</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {conversations.filter((c) => !c.is_archived).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {conversations.filter((c) => c.is_archived).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={contextFilter} onValueChange={setContextFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contexts</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="trading">Trading</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="product">Product</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Context</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredConversations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No conversations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredConversations.map((conv) => (
                  <TableRow key={conv.id}>
                    <TableCell>
                      <Badge className="capitalize">{conv.context}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {conv.participants.slice(0, 2).map((p, i) => (
                          <div key={i} className="text-sm">
                            {p.full_name || "Unknown"} ({p.account_type})
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {conv.last_message || "No messages yet"}
                    </TableCell>
                    <TableCell>
                      {conv.last_message_at
                        ? new Date(conv.last_message_at).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {conv.is_archived ? (
                        <Badge variant="outline">Archived</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
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
