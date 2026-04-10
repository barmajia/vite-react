import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Package, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function SellerProducts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-products", user?.id, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("seller_id", user?.id)
        .eq("is_deleted", false);

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .update({ is_deleted: true })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      toast.success("Product deleted");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
      inactive: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
    return <Badge className={variants[status] || variants.draft}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your product catalog</p>
        </div>
        <Button onClick={() => navigate("/seller/products/new")}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Package className="h-8 w-8" />
                      <p>No products yet</p>
                      <Button variant="outline" size="sm" onClick={() => navigate("/seller/products/new")}>
                        Add Your First Product
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products?.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt={product.title} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-slate-500">{product.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${product.price?.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.quantity}</span>
                        {product.quantity <= 10 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-slate-500">{new Date(product.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/seller/products/${product.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(product.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
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
