import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  MessageCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ShopSettings {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  show_hero: boolean;
  layout: "grid" | "list";
  hero_title?: string;
  hero_subtitle?: string;
}

interface ShopMetadata {
  bio?: string;
  phone?: string;
  location?: string;
  working_hours?: string;
  website?: string;
  // Doctor-specific
  services?: string[];
  certifications?: string[];
  // Factory-specific
  production_capacity?: string;
  factory_certifications?: string[];
  // Middleman-specific
  curation_tags?: string[];
  partner_count?: number;
}

interface ShopData {
  id: string;
  slug: string;
  shop_type: string;
  status: string;
  settings: ShopSettings;
  metadata: ShopMetadata;
  owner_id: string;
  template_id: string | null;
  created_at: string;
}

interface ShopProduct {
  id: string;
  title: string;
  price: number;
  images: any;
  description: string;
  status: string;
}

const defaultSettings: ShopSettings = {
  primary_color: "#2563eb",
  secondary_color: "#64748b",
  font_family: "Inter, sans-serif",
  show_hero: true,
  layout: "grid",
  hero_title: "Welcome to Our Shop",
  hero_subtitle: "Discover amazing products and services",
};

const SHOP_TYPE_LABELS: Record<string, string> = {
  doctor: "Doctor Portfolio",
  seller: "Seller Store",
  factory: "Factory Catalog",
  middleman: "Middleman Curator",
};

export function ShopPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<ShopData | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShop() {
      if (!slug) return;
      setLoading(true);
      setError(null);

      try {
        // Load shop data
        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select("*")
          .eq("slug", slug)
          .eq("status", "active")
          .maybeSingle();

        if (shopError || !shopData) {
          setError("Shop not found or not yet active.");
          setLoading(false);
          return;
        }

        setShop(shopData);

        // Load shop products
        const { data: shopProducts } = await supabase
          .from("shop_products")
          .select(
            `
            product_id,
            products!inner (
              id,
              title,
              price,
              images,
              description,
              status
            )
          `
          )
          .eq("shop_id", shopData.id);

        const extractedProducts =
          shopProducts?.map((sp: any) => sp.products).filter(Boolean) ?? [];
        setProducts(extractedProducts);

        // Load owner profile from users table
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", shopData.owner_id)
          .maybeSingle();

        if (profileData) {
          setOwnerProfile(profileData);
        }
      } catch (err: any) {
        setError(err.message ?? "Failed to load shop");
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Shop Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {error ?? "This shop doesn't exist or isn't active yet."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const settings = { ...defaultSettings, ...(shop.settings ?? {}) };
  const metadata = shop.metadata ?? {};

  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-950"
      style={{ fontFamily: settings.font_family }}
    >
      {/* Top Bar */}
      <header
        className="text-white"
        style={{ backgroundColor: settings.primary_color }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {metadata.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {metadata.phone}
              </span>
            )}
            {metadata.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {metadata.location}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="capitalize text-white/80">
              {SHOP_TYPE_LABELS[shop.shop_type] ?? shop.shop_type}
            </span>
          </div>
        </div>
      </header>

      {/* Main Header */}
      <nav className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store
              className="w-8 h-8"
              style={{ color: settings.primary_color }}
            />
            <div>
              <h1 className="text-xl font-bold">{shop.slug}</h1>
              {ownerProfile?.full_name && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  by {ownerProfile.full_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {metadata.website && (
              <a
                href={metadata.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline flex items-center gap-1"
              >
                Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <Link
              to="/messages"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: settings.primary_color }}
            >
              <MessageCircle className="w-4 h-4" />
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {settings.show_hero && (
        <section
          className="py-16"
          style={{
            background: `linear-gradient(135deg, ${settings.primary_color}15, ${settings.primary_color}05)`,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2
              className="text-4xl font-bold mb-3"
              style={{ color: settings.primary_color }}
            >
              {settings.hero_title ?? "Welcome to Our Shop"}
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: settings.secondary_color }}
            >
              {settings.hero_subtitle ??
                "Discover amazing products and services"}
            </p>
            {metadata.bio && (
              <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-3xl mx-auto">
                {metadata.bio}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Shop Info Cards */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metadata.working_hours && (
            <InfoCard
              icon={<Clock className="w-5 h-5" />}
              title="Working Hours"
              value={metadata.working_hours}
            />
          )}
          {metadata.location && (
            <InfoCard
              icon={<MapPin className="w-5 h-5" />}
              title="Location"
              value={metadata.location}
            />
          )}
          {metadata.phone && (
            <InfoCard
              icon={<Phone className="w-5 h-5" />}
              title="Phone"
              value={metadata.phone}
            />
          )}
        </div>
      </section>

      {/* Role-Specific Sections */}
      {shop.shop_type === "doctor" && metadata.services && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-xl font-bold mb-4">Services</h3>
          <div className="flex flex-wrap gap-2">
            {metadata.services.map((service: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-sm font-medium border"
                style={{
                  borderColor: settings.primary_color,
                  color: settings.primary_color,
                }}
              >
                {service}
              </span>
            ))}
          </div>
        </section>
      )}

      {shop.shop_type === "doctor" && metadata.certifications && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-xl font-bold mb-4">Certifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metadata.certifications.map((cert: string, i: number) => (
              <div
                key={i}
                className="p-3 border rounded-lg flex items-center gap-2"
              >
                <Star
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: settings.primary_color }}
                />
                <span className="text-sm">{cert}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {shop.shop_type === "factory" && metadata.factory_certifications && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-xl font-bold mb-4">Factory Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {metadata.factory_certifications.map((cert: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800"
              >
                {cert}
              </span>
            ))}
          </div>
          {metadata.production_capacity && (
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              <strong>Production Capacity:</strong>{" "}
              {metadata.production_capacity}
            </p>
          )}
        </section>
      )}

      {shop.shop_type === "middleman" && metadata.curation_tags && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-xl font-bold mb-4">Curation Focus</h3>
          <div className="flex flex-wrap gap-2">
            {metadata.curation_tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${settings.primary_color}20`,
                  color: settings.primary_color,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
          {metadata.partner_count && (
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              <strong>{metadata.partner_count}</strong> trusted partners
            </p>
          )}
        </section>
      )}

      {/* Products Section */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-xl font-bold mb-6">
            {shop.shop_type === "doctor"
              ? "Portfolio & Services"
              : shop.shop_type === "factory"
              ? "Product Catalog"
              : shop.shop_type === "middleman"
              ? "Curated Selection"
              : "Products"}
          </h3>
          <div
            className={
              settings.layout === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group border dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-900"
              >
                {product.images?.[0]?.url || product.images?.[0] ? (
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img
                      src={product.images[0].url ?? product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Store className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-medium truncate">{product.title}</h4>
                  <p
                    className="text-lg font-bold mt-1"
                    style={{ color: settings.primary_color }}
                  >
                    ${product.price?.toFixed(2) ?? "0.00"}
                  </p>
                  {product.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} {shop.slug}. Powered by{" "}
            <span className="font-semibold">Aurora</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="p-4 border dark:border-gray-800 rounded-lg flex items-center gap-3">
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
