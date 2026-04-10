import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Book, Filter, ShoppingCart, FileText, Tablet, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type BookType = "pdf" | "epub" | "physical";
type BookCategory = 
  | "fiction" | "non-fiction" | "science" | "technology"
  | "history" | "biography" | "self-help" | "business"
  | "children" | "education";

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  price: number;
  rating: number;
  category: BookCategory;
  type: BookType;
  description?: string;
  pages?: number;
  language?: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  inStock?: boolean;
  downloadUrl?: string;
}

const mockBooks: Book[] = [
  {
    id: "1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover: "https://via.placeholder.com/150x225",
    price: 12.99,
    rating: 4.5,
    category: "fiction",
    type: "physical",
    pages: 180,
    language: "English",
    isbn: "978-0743273565",
    publisher: "Scribner",
    publicationYear: 1925,
    inStock: true,
  },
  {
    id: "2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    cover: "https://via.placeholder.com/150x225",
    price: 14.99,
    rating: 4.8,
    category: "fiction",
    type: "pdf",
    pages: 281,
    language: "English",
    isbn: "978-0061120084",
    publisher: "Harper Perennial",
    publicationYear: 1960,
    downloadUrl: "#",
  },
  {
    id: "3",
    title: "1984",
    author: "George Orwell",
    cover: "https://via.placeholder.com/150x225",
    price: 11.99,
    rating: 4.7,
    category: "fiction",
    type: "epub",
    pages: 328,
    language: "English",
    isbn: "978-0451524935",
    publisher: "Signet Classic",
    publicationYear: 1949,
    downloadUrl: "#",
  },
  {
    id: "4",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    cover: "https://via.placeholder.com/150x225",
    price: 9.99,
    rating: 4.6,
    category: "fiction",
    type: "physical",
    pages: 432,
    language: "English",
    isbn: "978-0141439518",
    publisher: "Penguin Classics",
    publicationYear: 1813,
    inStock: true,
  },
  {
    id: "5",
    title: "Clean Code",
    author: "Robert C. Martin",
    cover: "https://via.placeholder.com/150x225",
    price: 39.99,
    rating: 4.9,
    category: "technology",
    type: "pdf",
    pages: 464,
    language: "English",
    isbn: "978-0132350884",
    publisher: "Prentice Hall",
    publicationYear: 2008,
    downloadUrl: "#",
  },
  {
    id: "6",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    cover: "https://via.placeholder.com/150x225",
    price: 24.99,
    rating: 4.7,
    category: "history",
    type: "epub",
    pages: 443,
    language: "English",
    isbn: "978-0062316097",
    publisher: "Harper",
    publicationYear: 2015,
    downloadUrl: "#",
  },
  {
    id: "7",
    title: "Atomic Habits",
    author: "James Clear",
    cover: "https://via.placeholder.com/150x225",
    price: 27.99,
    rating: 4.8,
    category: "self-help",
    type: "physical",
    pages: 320,
    language: "English",
    isbn: "978-0735211292",
    publisher: "Avery",
    publicationYear: 2018,
    inStock: true,
  },
  {
    id: "8",
    title: "The Lean Startup",
    author: "Eric Ries",
    cover: "https://via.placeholder.com/150x225",
    price: 26.99,
    rating: 4.5,
    category: "business",
    type: "pdf",
    pages: 336,
    language: "English",
    isbn: "978-0307887894",
    publisher: "Crown Business",
    publicationYear: 2011,
    downloadUrl: "#",
  },
];

const categories = [
  { value: "all", label: "All Categories" },
  { value: "fiction", label: "Fiction" },
  { value: "non-fiction", label: "Non-Fiction" },
  { value: "science", label: "Science" },
  { value: "technology", label: "Technology" },
  { value: "history", label: "History" },
  { value: "biography", label: "Biography" },
  { value: "self-help", label: "Self-Help" },
  { value: "business", label: "Business" },
  { value: "children", label: "Children" },
  { value: "education", label: "Education" },
];

const bookTypes = [
  { value: "all", label: "All Types", icon: "book" },
  { value: "pdf", label: "PDF", icon: "file" },
  { value: "epub", label: "ePub", icon: "tablet" },
  { value: "physical", label: "Physical", icon: "package" },
];

export function ReadsPage() {
  const navigate = useNavigate();
  const [books] = useState<Book[]>(mockBooks);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");

  const filteredBooks = books.filter((book) => {
    const categoryMatch = selectedCategory === "all" || book.category === selectedCategory;
    const typeMatch = selectedType === "all" || book.type === selectedType;
    return categoryMatch && typeMatch;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      case "rating": return b.rating - a.rating;
      case "newest": return (b.publicationYear || 0) - (a.publicationYear || 0);
      default: return 0;
    }
  });

  const handleAddToCart = (book: Book) => {
    if (book.type === "physical" && !book.inStock) {
      toast.error("This book is currently out of stock");
      return;
    }
    toast.success(`${book.title} added to cart!`);
  };

  const handleBuyNow = (book: Book) => {
    if (book.type === "physical" && !book.inStock) {
      toast.error("This book is currently out of stock");
      return;
    }
    navigate("/checkout", { state: { book } });
  };

  const getTypeBadgeColor = (type: BookType) => {
    switch (type) {
      case "pdf": return "bg-red-100 text-red-800";
      case "epub": return "bg-blue-100 text-blue-800";
      case "physical": return "bg-green-100 text-green-800";
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "file": return <FileText className="w-4 h-4" />;
      case "tablet": return <Tablet className="w-4 h-4" />;
      case "package": return <Package className="w-4 h-4" />;
      default: return <Book className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Book className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Reads</h1>
        </div>
        <p className="text-muted-foreground">
          Discover your next favorite book from our curated collection
        </p>
      </div>

      <div className="mb-8 p-4 bg-card rounded-lg border shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {bookTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {renderIcon(type.icon)}
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-sm text-muted-foreground">
            {sortedBooks.length} book{sortedBooks.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {sortedBooks.map((book) => (
          <div
            key={book.id}
            className="group cursor-pointer transition-all duration-200 hover:shadow-lg rounded-lg overflow-hidden bg-card border flex flex-col"
          >
            <div className="relative aspect-[2/3] overflow-hidden bg-muted">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute top-2 right-2">
                <Badge className={`${getTypeBadgeColor(book.type)} text-xs`}>
                  {book.type.toUpperCase()}
                </Badge>
              </div>
              {book.type === "physical" && !book.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive">Out of Stock</Badge>
                </div>
              )}
            </div>

            <div className="p-3 flex-1 flex flex-col">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {book.author}
              </p>
              
              <div className="mb-2">
                <Badge variant="secondary" className="text-xs">
                  {book.category}
                </Badge>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-xs">★</span>
                  <span className="text-xs text-muted-foreground">
                    {book.rating}
                  </span>
                </div>
                <span className="text-sm font-bold">${book.price.toFixed(2)}</span>
              </div>

              {(book.type === "pdf" || book.type === "epub") && (
                <p className="text-xs text-muted-foreground mb-2">
                  Instant Download
                </p>
              )}

              <div className="mt-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleAddToCart(book)}
                  disabled={book.type === "physical" && !book.inStock}
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Add
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleBuyNow(book)}
                  disabled={book.type === "physical" && !book.inStock}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedBooks.length === 0 && (
        <div className="text-center py-12">
          <Book className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No books found</h2>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back soon for new arrivals!
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedType("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
