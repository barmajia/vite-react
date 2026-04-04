import { Link } from "react-router-dom";
import {
  Factory,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Package,
  Award,
  TrendingUp,
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
  primary_color: "#7c3aed",
  secondary_color: "#64748b",
  font_family: "Inter, sans-serif",
  show_hero: true,
  layout: "grid" as "grid" | "list",
  hero_title: "Industrial Manufacturing Excellence",
  hero_subtitle: "Quality products directly from our factory",
};

export function FactoryCatalog({ shop }: { shop: ShopData }) {
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
            <Factory
              className="w-8 h-8"
              style={{ color: settings.primary_color }}
            />
            <div>
              <h1 className="text-xl font-bold">{shop.slug}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Direct Factory Supply
              </p>
            </div>
          </div>
          <Link
            to="/messages"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: settings.primary_color }}
          >
            <MessageCircle className="w-4 h-4" />
            Request Quote
          </Link>
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

      {/* Factory Stats */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metadata.production_capacity && (
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Production Capacity"
              value={metadata.production_capacity}
            />
          )}
          {metadata.factory_certifications && (
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Certifications"
              value={`${metadata.factory_certifications.length} certified`}
            />
          )}
          <StatCard
            icon={<Package className="w-5 h-5" />}
            label="Products Available"
            value={shop.products.length.toString()}
          />
        </div>
      </section>

      {/* Certifications */}
      {metadata.factory_certifications && metadata.factory_certifications.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" style={{ color: settings.primary_color }} />
            Certifications
          </h3>
          <div className="flex flex-wrap gap-2">
            {metadata.factory_certifications.map((cert: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
              >
                {cert}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Product Catalog */}
      {shop.products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Package className="w-6 h-6" style={{ color: settings.primary_color }} />
            Product Catalog
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
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-medium truncate">{product.title}</h4>
                  {product.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="text-lg font-bold"
                      style={{ color: settings.primary_color }}
                    >
                      ${product.price?.toFixed(2) ?? "0.00"}
                    </span>
                    <span className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                      {product.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Factory Info */}
      <section className="max-w-7xl mx-auto px-4 py-12 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
        <h3 className="text-xl font-bold mb-4">Factory Information</h3>
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border flex items-center gap-3">
      <div className="p-2 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
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
