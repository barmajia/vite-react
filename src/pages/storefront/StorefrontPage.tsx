import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Globe, AlertCircle, Loader2 } from "lucide-react";

interface Website {
  id: string;
  subdomain: string;
  theme_config: any;
  logo_url: string | null;
  is_published: boolean;
  is_active: boolean;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  content: any;
  sort_order: number;
}

export default function StorefrontPage() {
  const { username } = useParams<{ username: string }>();
  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    loadStorefront(username);
  }, [username]);

  const loadStorefront = async (subdomain: string) => {
    try {
      // Fetch website
      const { data: websiteData, error: websiteError } = await supabase
        .from("websites")
        .select(
          "id, subdomain, theme_config, logo_url, is_published, is_active",
        )
        .eq("subdomain", subdomain)
        .eq("is_published", true)
        .eq("is_active", true)
        .maybeSingle();

      if (websiteError) throw websiteError;
      if (!websiteData) {
        setError("Store not found or is not published");
        return;
      }
      setWebsite(websiteData);

      // Fetch website pages
      const { data: pagesData, error: pagesError } = await supabase
        .from("website_pages")
        .select("id, title, slug, content, sort_order")
        .eq("website_id", websiteData.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (pagesError) {
        console.warn("Could not load website pages:", pagesError.message);
      } else {
        setPages(pagesData || []);
      }
    } catch (err: any) {
      console.error("Error loading storefront:", err);
      setError(err.message || "Failed to load storefront");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-gray-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Store Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "This store is not available."}
          </p>
        </div>
      </div>
    );
  }

  const theme = website.theme_config || {};
  const storeName = theme.storeName || `${username}'s Store`;
  const heroText = theme.heroText || `Welcome to ${storeName}`;
  const heroSubtext =
    theme.heroSubtext || "Discover our amazing products and services.";

  // Apply theme colors
  const primaryColor = theme.colors?.primary || "#2563eb";
  const secondaryColor = theme.colors?.secondary || "#f3f4f6";
  const textColor = theme.colors?.text || "#374151";
  const footerColor = theme.colors?.footer || "#111827";
  const fontFamily =
    theme.fonts?.body || "system-ui, -apple-system, sans-serif";

  return (
    <div style={{ fontFamily }}>
      {/* Header */}
      <header
        style={{ background: primaryColor, color: "#fff" }}
        className="sticky top-0 z-50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {website.logo_url && (
              <img
                src={website.logo_url}
                alt={storeName}
                className="h-10 w-10 rounded-full object-cover border-2 border-white"
              />
            )}
            <h1 className="text-xl font-bold">{storeName}</h1>
          </div>

          <nav className="hidden md:flex gap-6">
            <a
              href="#"
              className="hover:opacity-80 transition-opacity font-medium"
            >
              Home
            </a>
            <a
              href="#products"
              className="hover:opacity-80 transition-opacity font-medium"
            >
              Products
            </a>
            <a
              href="#about"
              className="hover:opacity-80 transition-opacity font-medium"
            >
              About
            </a>
            <a
              href="#contact"
              className="hover:opacity-80 transition-opacity font-medium"
            >
              Contact
            </a>
          </nav>

          <button className="md:hidden text-white">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{ background: secondaryColor, color: textColor }}
        className="py-20 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">{heroText}</h2>
          <p className="text-xl mb-8 opacity-80">{heroSubtext}</p>
          <button
            style={{ background: primaryColor }}
            className="text-white px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            Shop Now
          </button>
        </div>
      </section>

      {/* Dynamic Pages Content */}
      {pages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          {pages.map((page) => (
            <div key={page.id} className="mb-12" id={page.slug}>
              <h3
                className="text-3xl font-bold mb-4"
                style={{ color: primaryColor }}
              >
                {page.title}
              </h3>
              <div className="prose max-w-none">
                {page.content?.blocks?.map((block: any, index: number) => (
                  <div key={index} className="mb-4">
                    {block.type === "paragraph" && (
                      <p className="text-gray-700">{block.data}</p>
                    )}
                    {block.type === "heading" && (
                      <h4 className="text-2xl font-semibold">{block.data}</h4>
                    )}
                    {block.type === "image" && (
                      <img
                        src={block.data.url}
                        alt={block.data.caption || ""}
                        className="rounded-lg shadow-md"
                      />
                    )}
                  </div>
                ))}
                {!page.content?.blocks && (
                  <p className="text-gray-600">Page content coming soon...</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Products Placeholder */}
      <section id="products" className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold mb-8" style={{ color: primaryColor }}>
          Featured Products
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md overflow-hidden border"
            >
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <Globe className="h-12 w-12 text-gray-400" />
              </div>
              <div className="p-4">
                <h4 className="font-bold mb-2">Product {i}</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Product description goes here
                </p>
                <div className="flex justify-between items-center">
                  <span
                    className="text-lg font-bold"
                    style={{ color: primaryColor }}
                  >
                    $29.99
                  </span>
                  <button
                    style={{ background: primaryColor }}
                    className="text-white px-4 py-2 rounded text-sm hover:opacity-90 transition-opacity"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3
            className="text-3xl font-bold mb-4"
            style={{ color: primaryColor }}
          >
            About Us
          </h3>
          <p className="text-lg text-gray-700">
            {theme.aboutText ||
              `Welcome to ${storeName}. We're dedicated to providing the best products and services to our customers.`}
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-4xl mx-auto px-4 py-12">
        <h3
          className="text-3xl font-bold mb-8 text-center"
          style={{ color: primaryColor }}
        >
          Contact Us
        </h3>
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-center text-gray-600 mb-6">
            Get in touch with us! We'd love to hear from you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              rows={4}
              placeholder="Your message..."
            />
          </div>
          <button
            style={{ background: primaryColor }}
            className="mt-4 w-full text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Send Message
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{ background: footerColor, color: "#fff" }}
        className="py-8 px-4"
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} {storeName} • Powered by YourPlatform
          </p>
        </div>
      </footer>
    </div>
  );
}
