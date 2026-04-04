import { Link } from "react-router-dom";
import {
  Stethoscope,
  MapPin,
  Clock,
  Phone,
  Mail,
  Award,
  Calendar,
  MessageCircle,
  Star,
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
  primary_color: "#0ea5e9",
  secondary_color: "#64748b",
  font_family: "Inter, sans-serif",
  show_hero: true,
  hero_title: "Welcome to My Practice",
  hero_subtitle: "Compassionate care, expert treatment",
};

export function DoctorPortfolio({ shop }: { shop: ShopData }) {
  const settings = { ...defaultSettings, ...shop.settings };
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
            <Stethoscope
              className="w-8 h-8"
              style={{ color: settings.primary_color }}
            />
            <div>
              <h1 className="text-xl font-bold">Dr. {shop.slug}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Medical Professional
              </p>
            </div>
          </div>
          <Link
            to="/messages"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: settings.primary_color }}
          >
            <MessageCircle className="w-4 h-4" />
            Book Consultation
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

      {/* Services */}
      {metadata.services && metadata.services.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Stethoscope className="w-6 h-6" style={{ color: settings.primary_color }} />
            Services & Specialties
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metadata.services.map((service: string, i: number) => (
              <div
                key={i}
                className="p-4 border dark:border-gray-800 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" style={{ color: settings.primary_color }} />
                  <span className="font-medium">{service}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {metadata.certifications && metadata.certifications.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Award className="w-6 h-6" style={{ color: settings.primary_color }} />
            Certifications & Qualifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metadata.certifications.map((cert: string, i: number) => (
              <div
                key={i}
                className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg flex items-center gap-3"
              >
                <Award className="w-5 h-5 flex-shrink-0" style={{ color: settings.primary_color }} />
                <span className="text-sm">{cert}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio / Services as Products */}
      {shop.products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6" style={{ color: settings.primary_color }} />
            Available Appointments & Services
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shop.products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group border dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition bg-white dark:bg-gray-900"
              >
                <div className="p-6">
                  <h4 className="font-semibold text-lg">{product.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {product.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className="text-xl font-bold"
                      style={{ color: settings.primary_color }}
                    >
                      ${product.price?.toFixed(2) ?? "0.00"}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">
                      {product.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Contact Info */}
      <section className="max-w-7xl mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metadata.phone && (
            <ContactCard icon={<Phone className="w-5 h-5" />} label="Phone" value={metadata.phone} />
          )}
          {metadata.location && (
            <ContactCard icon={<MapPin className="w-5 h-5" />} label="Location" value={metadata.location} />
          )}
          {metadata.working_hours && (
            <ContactCard icon={<Clock className="w-5 h-5" />} label="Hours" value={metadata.working_hours} />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t dark:border-gray-800 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          &copy; {new Date().getFullYear()} Dr. {shop.slug}. Powered by{" "}
          <span className="font-semibold">Aurora</span>
        </p>
      </footer>
    </div>
  );
}

function ContactCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg flex items-center gap-3">
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
