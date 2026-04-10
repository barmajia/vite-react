// src/pages/admin/AdminReads.tsx
// Admin Books Management - Manage books for the Reads section

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
  Book,
  DollarSign,
  TrendingUp,
  Filter,
  Loader2,
  FileText,
  Tablet,
  Package,
  Plus,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type BookType = "pdf" | "epub" | "physical";
type BookCategory = 
  | "fiction" | "non-fiction" | "science" | "technology"
  | "history" | "biography" | "self-help" | "business"
  | "children" | "education";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  price: number;
  rating: number;
  category: BookCategory;
  type: BookType;
  description?: string;
  pages?: number;
  language?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  in_stock?: boolean;
  stock_quantity?: number;
  download_url?: string;
  file_size?: string;
  created_at: string;
  updated_at: string;
}

export function AdminReads() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, typeFilter]);

  const loadBooks = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      const { data: booksData, error } = await query;

      if (error) throw error;
      setBooks(booksData || []);
    } catch (error) {
      console.error("Load books error:", error);
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId);

      if (error) throw error;
      toast.success("Book deleted");
      loadBooks();
    } catch (error) {
      toast.error("Failed to delete book");
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.author?.toLowerCase().includes(search.toLowerCase()) ||
      book.isbn?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getTypeBadgeColor = (type: BookType) => {
    switch (type) {
      case "pdf": return "bg-red-100 text-red-800";
      case "epub": return "bg-blue-100 text-blue-800";
      case "physical": return "bg-green-100 text-green-800";
    }
  };

  const getTypeIcon = (type: BookType) => {
    switch (type) {
      case "pdf": return <FileText className="h-3 w-3 mr-1" />;
      case "epub": return <Tablet className="h-3 w-3 mr-1" />;
      case "physical": return <Package className="h-3 w-3 mr-1" />;
    }
  };

  const totalRevenue = books.reduce((sum, book) => sum + (book.price || 0), 0);
  const totalBooks = books.length;
  const digitalBooks = books.filter(b => b.type === "pdf" || b.type === "epub").length;
  const physicalBooks = books.filter(b => b.type === "physical").length;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Book className="h-6 w-6" />
            Books Management
          </h1>
          <p className="text-muted-foreground">
            Manage your book catalog for the Reads section
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Book
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Books
            </CardTitle>
            <Book className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalBooks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Digital Books
            </CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{digitalBooks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Physical Books
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{physicalBooks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${totalRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, or ISBN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fiction">Fiction</SelectItem>
                <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="biography">Biography</SelectItem>
                <SelectItem value="self-help">Self-Help</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="children">Children</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="epub">ePub</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredBooks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No books found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div className="h-12 w-8 rounded bg-muted overflow-hidden">
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 150'%3E%3Crect fill='%23f0f0f0' width='100' height='150'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENo Cover%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <Book className="h-full w-full p-1 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate">{book.title}</p>
                        {book.isbn && (
                          <p className="text-xs text-muted-foreground font-mono">
                            ISBN: {book.isbn}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>
                      <Badge className={`${getTypeBadgeColor(book.type)} text-xs`}>
                        {getTypeIcon(book.type)}
                        {book.type.toUpperCase()}
                      </Badge>
                      {(book.type === "pdf" || book.type === "epub") && book.download_url && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ✓ Digital file ready
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {book.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${book.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {book.type === "physical" ? (
                        book.in_stock ? (
                          <Badge className="bg-green-100 text-green-800">
                            In Stock ({book.stock_quantity})
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">
                          Instant Download
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(book.created_at).toLocaleDateString()}
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
                            onClick={() => navigate(`/reads`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/books/${book.id}/edit`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(book.id)}
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

      {/* Add Book Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Book</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Book creation form will be implemented here with fields for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Title, Author, Description</li>
                <li>Category and Type (PDF/ePub/Physical)</li>
                <li>Price and ISBN</li>
                <li>Cover image upload</li>
                <li>Digital file upload (for PDF/ePub)</li>
                <li>Stock quantity (for Physical books)</li>
                <li>Pages, Language, Publisher, Publication Year</li>
              </ul>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast.info("Book creation form coming soon!");
                  setShowAddModal(false);
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Create Book
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
