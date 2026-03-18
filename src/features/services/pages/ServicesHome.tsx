import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Code,
  PenTool,
  Heart,
  Briefcase,
  Home,
  GraduationCap,
  FileText,
  TrendingUp,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useServices,
  type ServiceCategory,
  type ServiceListing,
} from "../hooks/useServices";

const categoryIcons: Record<string, JSX.Element> = {
  programming: <Code size={24} />,
  design: <PenTool size={24} />,
  healthcare: <Heart size={24} />,
  business: <Briefcase size={24} />,
  home: <Home size={24} />,
  education: <GraduationCap size={24} />,
  writing: <FileText size={24} />,
  marketing: <TrendingUp size={24} />,
};

export function ServicesHome() {
  const { getCategories, getListings } = useServices();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [cats, allListings] = await Promise.all([
        getCategories(),
        getListings(),
      ]);
      setCategories(cats);
      setListings(allListings.slice(0, 6)); // Show first 6 listings
      setLoading(false);
    };

    fetchData();
  }, [getCategories, getListings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-10 md:p-16 text-white mb-12 text-center shadow-xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Find Expert Services & Freelancers
        </h1>
        <p className="text-indigo-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          From software development to consulting, find the right professional
          for your needs.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Search for services..."
              className="w-full pl-12 pr-4 py-6 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-white/30 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/services/${cat.slug}`}
              className="flex flex-col items-center p-6 bg-card border rounded-xl hover:shadow-lg hover:border-primary transition-all cursor-pointer group"
            >
              <div className="text-primary mb-3 group-hover:scale-110 transition-transform">
                {categoryIcons[cat.slug] || <Briefcase />}
              </div>
              <span className="font-medium text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Listings */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Service Listings</h2>
          <Link
            to="/services"
            className="text-primary hover:underline text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/services/listing/${listing.slug}`}
                className="p-6 bg-card border rounded-xl hover:shadow-lg hover:border-primary transition-all"
              >
                <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                {listing.price && (
                  <p className="text-primary font-bold mb-2">
                    {listing.currency === "EGP" ? "EGP" : "$"}
                    {listing.price.toFixed(2)}
                    {listing.price_type && (
                      <span className="text-sm text-muted-foreground">
                        /{listing.price_type}
                      </span>
                    )}
                  </p>
                )}
                {listing.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {listing.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Active: {listing.is_active ? "Yes" : "No"}</span>
                  <span className="text-primary">View Details →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted rounded-xl">
            <p className="text-muted-foreground">No service listings yet</p>
            <Button asChild className="mt-4">
              <Link to="/services/dashboard/create-listing">
                Create First Listing
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-muted rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Are you a Service Provider?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Join Aurora and start offering your services. Create your profile and
          connect with clients.
        </p>
        <Button size="lg" asChild>
          <Link to="/services/dashboard">Start Offering Services</Link>
        </Button>
      </section>
    </div>
  );
}
