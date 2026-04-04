import { Link } from "react-router-dom";
import {
  Store,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ShoppingBag,
  Star,
  Heart,
} from "lucide-react";

interface ShopData {
  id: string;
  slug: string;
  shop_type: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  products: any[];
}

const defaultSettings = {
  primary_color: "#2563eb",
  secondary_color: "#64748b",
  font_family: "Inter, sans-serif",
  show_hero: true,
  layout: "grid" as "grid" | "list",
  hero_title: "Welcome to Our Store",
  hero_subtitle: "Discover amazing products at great prices",
};

export function SellerStorefront({ shop }: { shop: ShopData }) {
  const settings = { ...defaultSettings, ...shop.settings };
  const metadata = shop.metadata ?? {};

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      style={{ fontFamily: settings.font_family }}
    >
      {/* Top Bar */}
      <header
        className="text-white"
        style={{ backgroundColor: settings.primary_color }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-sm">
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
          {metadata.working_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {metadata.working_hours}
            </span>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store
              className="w-8 h-8"
              style={{ color: settings.primary_color }}
            />
            <div>
              <h1 className="text-xl font-bold">{shop.slug}</h1>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                <span>Trusted Seller</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/messages"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: settings.primary_color }}
            >
              <MessageCircle className="w-4 h-4" />
              Contact Seller
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
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
              {settings.hero_title}
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: settings.secondary_color }}
            >
              {settings.hero_subtitle}
            </p>
            {metadata.bio && (
              <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-3xl mx-auto">
                {metadata.bio}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Products */}
      {shop.products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" style={{ color: settings.primary_color }} />
            Products ({shop.products.length})
          </h3>
          <div
            className={
              settings.layout === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {shop.products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition"
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
                    <ShoppingBag className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-medium truncate">{product.title}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-xs text-gray-500">
                      {product.average_rating ?? "New"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="text-lg font-bold"
                      style={{ color: settings.primary_color }}
                    >
                      ${product.price?.toFixed(2) ?? "0.00"}
                    </span>
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Store Info */}
      <section className="max-w-7xl mx-auto px-4 py-12 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
        <h3 className="text-xl font-bold mb-4">Store Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metadata.location && (
            <InfoCard icon={<MapPin className="w-5 h-5" />} label="Location" value={metadata.location} />
          )}
          {metadata.working_hours && (
            <InfoCard icon={<Clock className="w-5 h-5" />} label="Hours" value={metadata.working_hours} />
          )}
          {metadata.phone && (
            <InfoCard icon={<Phone className="w-5 h-5" />} label="Phone" value={metadata.phone} />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t dark:border-gray-800 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          &copy; {new Date().getFullYear()} {shop.slug}. Powered by{" "}
          <span className="font-semibold">Aurora</span>
        </p>
      </footer>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 border dark:border-gray-800 rounded-lg flex items-center gap-3">
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
