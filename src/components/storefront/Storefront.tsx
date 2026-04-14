/**
 * Dynamic Storefront Renderer
 * Renders a seller's storefront based on their template and store configuration
 */

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStoreConfig, useProducts } from "@/hooks/useSeller";
import type { Template, StoreConfig, Seller, Product } from "@/services/storefront";

// ── Types ─────────────────────────────────────────────────────────────

interface StorefrontProps {
  // Optional override for testing
  sellerSlug?: string;
}

interface TemplateConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    header_style: string;
    product_grid: string;
    footer_style: string;
  };
  sections: {
    hero?: {
      enabled: boolean;
      title: string;
      subtitle: string;
      cta_text: string;
      background_image: string | null;
    };
    featured_products?: {
      enabled: boolean;
      title: string;
      max_items: number;
    };
    testimonials?: {
      enabled: boolean;
      title: string;
    };
  };
}

// ── Hero Section Component ───────────────────────────────────────────

interface HeroSectionProps {
  config: TemplateConfig["sections"]["hero"];
  colors: TemplateConfig["colors"];
}

const HeroSection: React.FC<HeroSectionProps> = ({ config, colors }) => {
  if (!config?.enabled) return null;

  return (
    <section
      className="relative py-20 px-4 text-center"
      style={{
        background: config.background_image
          ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${config.background_image})`
          : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: config.background_image ? "#fff" : "#fff",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h1
          className="text-4xl md:text-6xl font-bold mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {config.title}
        </h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          {config.subtitle}
        </p>
        <button
          className="px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg"
          style={{
            backgroundColor: colors.accent,
            color: colors.text,
          }}
        >
          {config.cta_text}
        </button>
      </div>
    </section>
  );
};

// ── Product Card Component ───────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  colors: TemplateConfig["colors"];
}

const ProductCard: React.FC<ProductCardProps> = ({ product, colors }) => {
  const images = (product.images as any[]) || [];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative">
        {images.length > 0 && images[0] ? (
          <img
            src={images[0].url || images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Sale Badge */}
        {product.compare_at_price && product.compare_at_price > product.price && (
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-white text-sm font-semibold"
            style={{ backgroundColor: colors.accent }}
          >
            SALE
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3
          className="font-semibold text-lg mb-2 line-clamp-2"
          style={{ fontFamily: "var(--font-heading)", color: colors.text }}
        >
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-2xl font-bold"
            style={{ color: colors.primary }}
          >
            ${product.price.toFixed(2)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-gray-400 line-through">
              ${product.compare_at_price.toFixed(2)}
            </span>
          )}
        </div>

        <button
          className="w-full py-2 rounded-lg font-semibold transition-all hover:opacity-90"
          style={{
            backgroundColor: colors.primary,
            color: "#fff",
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

// ── Featured Products Section ────────────────────────────────────────

interface FeaturedProductsSectionProps {
  config: TemplateConfig["sections"]["featured_products"];
  colors: TemplateConfig["colors"];
  products: Product[];
}

const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  config,
  colors,
  products,
}) => {
  if (!config?.enabled || products.length === 0) return null;

  const featuredProducts = products
    .filter((p) => p.is_featured)
    .slice(0, config.max_items);

  const displayProducts =
    featuredProducts.length > 0 ? featuredProducts : products.slice(0, config.max_items);

  const gridCols = {
    "2-column": "grid-cols-1 sm:grid-cols-2",
    "3-column": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "4-column": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[config.max_items > 8 ? "4-column" : "3-column"];

  return (
    <section className="py-16 px-4" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          style={{
            fontFamily: "var(--font-heading)",
            color: colors.text,
          }}
        >
          {config.title}
        </h2>

        <div className={`grid ${gridCols} gap-6`}>
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              colors={colors}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Header Component ─────────────────────────────────────────────────

interface HeaderProps {
  seller: Seller;
  config: StoreConfig;
  templateConfig: TemplateConfig;
}

const Header: React.FC<HeaderProps> = ({ seller, config, templateConfig }) => {
  const { colors } = templateConfig;

  return (
    <header
      className="sticky top-0 z-50 shadow-md"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo & Store Name */}
        <div className="flex items-center gap-3">
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt={seller.store_name}
              className="w-12 h-12 object-contain rounded"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: colors.primary }}
            >
              {seller.store_name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1
            className="text-xl font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: colors.text,
            }}
          >
            {seller.store_name}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#products"
            className="font-medium hover:opacity-80 transition-opacity"
            style={{ color: colors.text }}
          >
            Products
          </a>
          <a
            href="#about"
            className="font-medium hover:opacity-80 transition-opacity"
            style={{ color: colors.text }}
          >
            About
          </a>
          <a
            href="#contact"
            className="font-medium hover:opacity-80 transition-opacity"
            style={{ color: colors.text }}
          >
            Contact
          </a>
        </nav>

        {/* Cart Icon */}
        <div className="flex items-center gap-4">
          <button
            className="relative p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ color: colors.text }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

// ── Footer Component ─────────────────────────────────────────────────

interface FooterProps {
  seller: Seller;
  templateConfig: TemplateConfig;
}

const Footer: React.FC<FooterProps> = ({ seller, templateConfig }) => {
  const { colors } = templateConfig;

  return (
    <footer
      className="py-12 px-4"
      style={{
        backgroundColor: colors.text,
        color: colors.background,
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Store Info */}
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {seller.store_name}
          </h3>
          <p className="opacity-80 text-sm">
            Thank you for visiting our store. We're committed to providing
            quality products and excellent customer service.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#products" className="opacity-80 hover:opacity-100">
                Products
              </a>
            </li>
            <li>
              <a href="#about" className="opacity-80 hover:opacity-100">
                About Us
              </a>
            </li>
            <li>
              <a href="#contact" className="opacity-80 hover:opacity-100">
                Contact
              </a>
            </li>
            <li>
              <a href="#privacy" className="opacity-80 hover:opacity-100">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Follow Us
          </h3>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: colors.primary }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: colors.primary }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-700 text-center text-sm opacity-80">
        <p>&copy; {new Date().getFullYear()} {seller.store_name}. All rights reserved.</p>
        <p className="mt-2">Powered by Aurora E-Commerce</p>
      </div>
    </footer>
  );
};

// ── Store Not Found Component ────────────────────────────────────────

const StoreNotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <svg
          className="w-24 h-24 mx-auto text-gray-400 mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Store Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          This store may have been closed or the URL is incorrect.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Go to Homepage
        </a>
      </div>
    </div>
  );
};

// ── Main Storefront Component ────────────────────────────────────────

export const Storefront: React.FC<StorefrontProps> = ({ sellerSlug: overrideSlug }) => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const sellerSlug = overrideSlug || urlSlug;

  const { storeData, loading, error } = useStoreConfig(sellerSlug);
  const { products, loading: productsLoading } = useProducts("store", sellerSlug);

  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);

  useEffect(() => {
    if (storeData) {
      // Merge template defaults with seller customizations
      const merged = {
        ...(storeData.template.default_config as any),
        ...storeData.storeConfig.custom_config,
      };

      setTemplateConfig(merged);
    }
  }, [storeData]);

  // Loading state
  if (loading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading store...</p>
        </div>
      </div>
    );
  }

  // Error or not found
  if (error || !storeData || !templateConfig) {
    return <StoreNotFound />;
  }

  const { seller, storeConfig, template } = storeData;

  // Apply CSS variables for fonts
  document.documentElement.style.setProperty("--font-heading", templateConfig.fonts.heading);
  document.documentElement.style.setProperty("--font-body", templateConfig.fonts.body);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: templateConfig.colors.background,
        color: templateConfig.colors.text,
        fontFamily: templateConfig.fonts.body,
      }}
    >
      {/* Header */}
      <Header
        seller={seller}
        config={storeConfig}
        templateConfig={templateConfig}
      />

      {/* Hero Section */}
      <HeroSection
        config={templateConfig.sections.hero}
        colors={templateConfig.colors}
      />

      {/* Featured Products */}
      <FeaturedProductsSection
        config={templateConfig.sections.featured_products}
        colors={templateConfig.colors}
        products={products}
      />

      {/* All Products */}
      <section id="products" className="py-16 px-4" style={{ backgroundColor: templateConfig.colors.background }}>
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{
              fontFamily: "var(--font-heading)",
              color: templateConfig.colors.text,
            }}
          >
            All Products
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                colors={templateConfig.colors}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer seller={seller} templateConfig={templateConfig} />
    </div>
  );
};

export default Storefront;
