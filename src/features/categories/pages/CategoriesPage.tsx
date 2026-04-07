import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Grid3X3,
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { ROUTES } from "@/lib/constants";

interface Category {
  id: string;
  name: string;
  nameKey: string;
  icon: string;
  color: string;
  hoverColor: string;
  shadowColor: string;
  count: number;
  subcategories: SubCategory[];
  trending?: boolean;
}

interface SubCategory {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    nameKey: "home.categories.electronics",
    icon: "📱",
    color: "from-blue-600 to-indigo-600",
    hoverColor: "hover:shadow-blue-500/30",
    shadowColor: "shadow-blue-500/20",
    count: 2500,
    trending: true,
    subcategories: [
      { id: "1-1", name: "Smartphones", icon: "📱" },
      { id: "1-2", name: "Laptops", icon: "💻" },
      { id: "1-3", name: "Headphones", icon: "🎧" },
      { id: "1-4", name: "Cameras", icon: "📷" },
    ],
  },
  {
    id: "2",
    name: "Fashion",
    nameKey: "home.categories.fashion",
    icon: "👕",
    color: "from-pink-600 to-rose-600",
    hoverColor: "hover:shadow-pink-500/30",
    shadowColor: "shadow-pink-500/20",
    count: 3200,
    trending: true,
    subcategories: [
      { id: "2-1", name: "Men's Clothing", icon: "👔" },
      { id: "2-2", name: "Women's Clothing", icon: "👗" },
      { id: "2-3", name: "Shoes", icon: "👟" },
      { id: "2-4", name: "Accessories", icon: "💍" },
    ],
  },
  {
    id: "3",
    name: "Home & Garden",
    nameKey: "home.categories.homeGarden",
    icon: "🏠",
    color: "from-emerald-600 to-teal-600",
    hoverColor: "hover:shadow-emerald-500/30",
    shadowColor: "shadow-emerald-500/20",
    count: 1800,
    subcategories: [
      { id: "3-1", name: "Furniture", icon: "🪑" },
      { id: "3-2", name: "Kitchen", icon: "🍳" },
      { id: "3-3", name: "Decor", icon: "🖼️" },
      { id: "3-4", name: "Garden", icon: "🌱" },
    ],
  },
  {
    id: "4",
    name: "Sports & Outdoors",
    nameKey: "home.categories.sports",
    icon: "⚽",
    color: "from-orange-600 to-amber-600",
    hoverColor: "hover:shadow-orange-500/30",
    shadowColor: "shadow-orange-500/20",
    count: 1500,
    subcategories: [
      { id: "4-1", name: "Fitness", icon: "💪" },
      { id: "4-2", name: "Camping", icon: "⛺" },
      { id: "4-3", name: "Cycling", icon: "🚴" },
      { id: "4-4", name: "Team Sports", icon: "🏆" },
    ],
  },
  {
    id: "5",
    name: "Beauty & Health",
    nameKey: "categories.beauty",
    icon: "💄",
    color: "from-purple-600 to-violet-600",
    hoverColor: "hover:shadow-purple-500/30",
    shadowColor: "shadow-purple-500/20",
    count: 2100,
    trending: true,
    subcategories: [
      { id: "5-1", name: "Skincare", icon: "🧴" },
      { id: "5-2", name: "Makeup", icon: "💋" },
      { id: "5-3", name: "Fragrances", icon: "🌸" },
      { id: "5-4", name: "Wellness", icon: "🧘" },
    ],
  },
  {
    id: "6",
    name: "Books & Media",
    nameKey: "categories.books",
    icon: "📚",
    color: "from-cyan-600 to-blue-600",
    hoverColor: "hover:shadow-cyan-500/30",
    shadowColor: "shadow-cyan-500/20",
    count: 900,
    subcategories: [
      { id: "6-1", name: "Fiction", icon: "📖" },
      { id: "6-2", name: "Non-Fiction", icon: "📚" },
      { id: "6-3", name: "Music", icon: "🎵" },
      { id: "6-4", name: "Movies", icon: "🎬" },
    ],
  },
  {
    id: "7",
    name: "Toys & Games",
    nameKey: "categories.toys",
    icon: "🎮",
    color: "from-red-600 to-pink-600",
    hoverColor: "hover:shadow-red-500/30",
    shadowColor: "shadow-red-500/20",
    count: 1200,
    subcategories: [
      { id: "7-1", name: "Action Figures", icon: "🦸" },
      { id: "7-2", name: "Board Games", icon: "🎲" },
      { id: "7-3", name: "Puzzles", icon: "🧩" },
      { id: "7-4", name: "Video Games", icon: "🕹️" },
    ],
  },
  {
    id: "8",
    name: "Automotive",
    nameKey: "categories.automotive",
    icon: "🚗",
    color: "from-slate-600 to-gray-700",
    hoverColor: "hover:shadow-slate-500/30",
    shadowColor: "shadow-slate-500/20",
    count: 800,
    subcategories: [
      { id: "8-1", name: "Car Accessories", icon: "🔧" },
      { id: "8-2", name: "Tools", icon: "🛠️" },
      { id: "8-3", name: "Car Care", icon: "🧽" },
      { id: "8-4", name: "Electronics", icon: "📻" },
    ],
  },
];

export function CategoriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.subcategories.some((sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const trendingCategories = categories.filter((cat) => cat.trending);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mx-auto transition-all duration-300">
              <Grid3X3 className="h-4 w-4" />
              <span>{t("category.exploreCategories")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                {t("category.shopByCategory")}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              {t("category.browseCategoriesDesc") ||
                "Browse through our extensive collection of products organized by categories for easy shopping"}
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mt-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    t("category.searchPlaceholder") || "Search categories..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Categories */}
      {!searchQuery && (
        <section className="py-16 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <TrendingUp className="h-4 w-4" />
                  <span>{t("category.trending")}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {t("category.trendingCategories")}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trendingCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    navigate(
                      `${ROUTES.CATEGORY_PRODUCTS.replace(":id", category.id)}`,
                    );
                  }}
                  className="group text-left"
                >
                  <Card
                    className={`h-full transition-all duration-500 border-2 hover:border-transparent hover:-translate-y-2 hover:shadow-2xl ${category.hoverColor} bg-white dark:bg-slate-800`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                        >
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {t(category.nameKey) || category.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {category.count.toLocaleString()}{" "}
                            {t("category.products") || "products"}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 transition-transform duration-300 group-hover:translate-x-2" />
                      </div>
                      <div className="flex gap-2">
                        {category.subcategories.slice(0, 3).map((sub) => (
                          <span
                            key={sub.id}
                            className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-300"
                          >
                            {sub.icon} {sub.name}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Categories */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                <span>{t("category.allCategories")}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {filteredCategories.length}{" "}
                {t("category.categoriesFound") || "Categories Found"}
              </h2>
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {t("category.noResults") || "No categories found"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t("category.tryDifferentSearch") ||
                  "Try a different search term"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category, index) => (
                <div
                  key={category.id}
                  className="group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card
                    className={`h-full transition-all duration-500 border-2 hover:border-transparent hover:-translate-y-2 hover:shadow-2xl ${category.hoverColor} bg-white dark:bg-slate-800 overflow-hidden`}
                  >
                    <div
                      className={`h-32 bg-gradient-to-br ${category.color} relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:1rem_1rem]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                          {category.icon}
                        </span>
                      </div>
                      {category.trending && (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                          {t("category.trending")}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {t(category.nameKey) || category.name}
                        </h3>
                        <ChevronRight className="h-5 w-5 text-slate-400 transition-transform duration-300 group-hover:translate-x-2" />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {category.count.toLocaleString()}{" "}
                        {t("category.products") || "products"}
                      </p>
                      <div className="space-y-2">
                        {category.subcategories.slice(0, 3).map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer"
                          >
                            <span>{sub.icon}</span>
                            <span>{sub.name}</span>
                          </div>
                        ))}
                      </div>
                      <Link
                        to={`${ROUTES.CATEGORY_PRODUCTS.replace(":id", category.id)}`}
                        className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-all duration-300 group-hover:gap-3"
                      >
                        {t("category.viewAllProducts") || "View All Products"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t("category.can'tFindCategory") ||
                "Can't Find What You're Looking For?"}
            </h2>
            <p className="text-lg text-white/70">
              {t("category.browseAllProducts") ||
                "Browse all our products or contact us for custom requests"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-slate-900 hover:bg-white/90"
                onClick={() => navigate("/products")}
              >
                {t("category.browseAllProducts") || "Browse All Products"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
                onClick={() => navigate("/contact")}
              >
                {t("category.contactUs") || "Contact Us"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
