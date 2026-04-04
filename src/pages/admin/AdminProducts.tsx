// src/pages/admin/AdminProducts.tsx
// Admin Products Management - View and manage all products

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Package,
  DollarSign,
  TrendingUp,
  Filter,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProductImageUrl, getProductImageAlt } from "@/utils/productshelper";

interface Product {
  id: string;
  asin: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  seller_id: string;
  seller_name?: string;
  created_at: string;
  currency: string;
  is_deleted: boolean;
}

export function AdminProducts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      // First get all products
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: productsData, error } = await query;

      if (error) throw error;

      // Then get seller names separately from users table
      const sellerIds = [
        ...new Set(productsData?.map((p) => p.seller_id).filter(Boolean)),
      ];
      const { data: sellersData } = await supabase
        .from("users")
        .select("user_id, full_name")
        .in("user_id", sellerIds);

      const sellersMap = new Map(
        sellersData?.map((s) => [s.user_id, s.full_name]) || [],
      );

      const transformed =
        productsData?.map((p: any) => ({
          ...p,
          seller_name: sellersMap.get(p.seller_id) || "Unknown",
        })) || [];

      setProducts(transformed);
    } catch (error) {
      console.error("Load products error:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq("id", productId);

      if (error) throw error;
      toast.success("Product deleted");
      loadProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.asin?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between p-5">
        <div>
          <h1 className="text-2xl font-bold">Products Management</h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} products
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {products.filter((p) => p.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}{" "}
              {products[0]?.currency || "USD"}
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
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>ASIN</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted">
                          {getProductImageUrl(product.images) ? (
                            <img
                              src={getProductImageUrl(product.images)!}
                              alt={getProductImageAlt(
                                product.images,
                                product.title,
                              )}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23f0f0f0' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                              }}
                              className="h-full w-full object-cover rounded"
                            />
                          ) : (
                            <Package className="h-full w-full p-2 text-muted-foreground" />
                          )}
                        </div>
                        <div className="max-w-[300px]">
                          <p className="font-medium truncate">
                            {product.title}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {product.asin}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {product.price?.toFixed(2)} {product.currency}
                    </TableCell>
                    <TableCell>{product.seller_name || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(product.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/products/${product.asin}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/admin/products/${product.id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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
    </div>
  );
}
