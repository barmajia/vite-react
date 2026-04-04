import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  Eye,
  CheckCircle,
  Loader2,
  Palette,
  LayoutTemplate,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type ShopType = "doctor" | "seller" | "factory" | "middleman";

interface Template {
  id: string;
  name: string;
  slug: string;
  shop_type: ShopType;
  preview_image_url: string | null;
  template_data: any;
  is_custom: boolean;
  created_at: string;
  is_applied?: boolean;
}

const SHOP_TYPE_COLORS: Record<ShopType, string> = {
  doctor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  seller:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  factory:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  middleman:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const SHOP_TYPE_LABELS: Record<ShopType, string> = {
  doctor: "Doctor Portfolio",
  seller: "Seller Store",
  factory: "Factory Catalog",
  middleman: "Middleman Curator",
};

export function TemplateMarketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [shopId, setShopId] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(
    null
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ShopType | "all">("all");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadShopAndTemplates();
  }, [user]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedType]);

  async function loadShopAndTemplates() {
    try {
      // Load user's shop
      const { data: shopData } = await supabase
        .from("shops")
        .select("id, template_id")
        .eq("owner_id", user?.id)
        .maybeSingle();

      if (shopData) {
        setShopId(shopData.id);
        setCurrentTemplateId(shopData.template_id);
      }

      // Load all active templates
      const { data: templatesData } = await supabase
        .from("shop_templates")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      setTemplates(templatesData ?? []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  function filterTemplates() {
    let filtered = [...templates];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.shop_type.toLowerCase().includes(query)
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((t) => t.shop_type === selectedType);
    }

    // Mark applied template
    filtered = filtered.map((t) => ({
      ...t,
      is_applied: t.id === currentTemplateId,
    }));

    setFilteredTemplates(filtered);
  }

  async function applyTemplate(templateId: string) {
    if (!shopId) {
      alert("You need to create a shop first!");
      navigate("/shops");
      return;
    }

    setApplyingTemplate(templateId);
    try {
      const { error } = await supabase
        .from("shops")
        .update({ template_id: templateId })
        .eq("id", shopId);

      if (error) throw error;

      setCurrentTemplateId(templateId);
      setShowPreview(false);
      alert("Template applied successfully! View your shop to see the changes.");
    } catch (error: any) {
      console.error("Error applying template:", error);
      alert("Failed to apply template. Please try again.");
    } finally {
      setApplyingTemplate(null);
    }
  }

  function openPreview(template: Template) {
    setSelectedTemplate(template);
    setShowPreview(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Template Marketplace</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Choose a professional template for your storefront.
          </p>
        </div>
        <Link
          to="/shops/dashboard"
          className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {(["all", "doctor", "seller", "factory", "middleman"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition ${
                  selectedType === type
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {type === "all" ? "All Types" : SHOP_TYPE_LABELS[type]}
              </button>
            )
          )}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border">
          <LayoutTemplate className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No templates found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow"
            >
              {/* Preview Image */}
              <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                {template.preview_image_url ? (
                  <img
                    src={template.preview_image_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    template.preview_image_url ? "hidden absolute inset-0" : ""
                  }`}
                >
                  <Palette className="w-12 h-12 text-gray-400" />
                </div>

                {/* Applied Badge */}
                {template.is_applied && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle size={14} />
                    Applied
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      SHOP_TYPE_COLORS[template.shop_type]
                    }`}
                  >
                    {SHOP_TYPE_LABELS[template.shop_type]}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-2">{template.name}</h3>

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-500" />
                    4.8
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    Popular
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openPreview(template)}
                    className="flex-1 px-4 py-2 border dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 text-sm font-medium transition"
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                  <button
                    onClick={() => applyTemplate(template.id)}
                    disabled={
                      applyingTemplate === template.id || template.is_applied
                    }
                    className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition ${
                      template.is_applied
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                        : applyingTemplate === template.id
                        ? "bg-blue-400 cursor-wait"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {applyingTemplate === template.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : template.is_applied ? (
                      <>
                        <CheckCircle size={14} />
                        Applied
                      </>
                    ) : (
                      "Apply to Shop"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedTemplate.name}
                </h2>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                    SHOP_TYPE_COLORS[selectedTemplate.shop_type]
                  }`}
                >
                  {SHOP_TYPE_LABELS[selectedTemplate.shop_type]}
                </span>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedTemplate.preview_image_url ? (
                <img
                  src={selectedTemplate.preview_image_url}
                  alt={selectedTemplate.name}
                  className="w-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <Palette className="w-16 h-16 text-gray-400" />
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Features</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>&#10003; Responsive Design</li>
                    <li>&#10003; SEO Optimized</li>
                    <li>&#10003; Fast Loading</li>
                    <li>&#10003; Mobile Friendly</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Includes</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>&#10003; Hero Section</li>
                    <li>&#10003; Product Grid</li>
                    <li>&#10003; Contact Form</li>
                    <li>&#10003; Social Links</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 border-t dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-4 py-3 border dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Close
              </button>
              <button
                onClick={() => applyTemplate(selectedTemplate.id)}
                disabled={
                  applyingTemplate === selectedTemplate.id ||
                  selectedTemplate.is_applied
                }
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                  selectedTemplate.is_applied
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {selectedTemplate.is_applied
                  ? "Currently Applied"
                  : "Apply This Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
