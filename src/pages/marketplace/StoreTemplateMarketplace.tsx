import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShoppingCart,
  Check,
  X,
  Sparkles,
  Grid3X3,
  Layout,
  Palette,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StoreTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  preview_image_url: string;
  price: number;
  is_free: boolean;
  default_colors: Record<string, string>;
}

const CATEGORIES = [
  { value: "", label: "All Templates" },
  { value: "minimal", label: "Minimal" },
  { value: "dark", label: "Dark" },
  { value: "colorful", label: "Colorful" },
  { value: "luxury", label: "Luxury" },
  { value: "portfolio", label: "Portfolio" },
  { value: "vintage", label: "Vintage" },
];

export function StoreTemplateMarketplace() {
  const [templates, setTemplates] = useState<StoreTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<StoreTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      let query = supabase
        .from("store_templates")
        .select("id, name, slug, description, category, preview_image_url, price, is_free, default_colors")
        .eq("is_published", true);

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyTemplateToStore = async (template: StoreTemplate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to use this template");
        return;
      }

      const { data: store } = await supabase
        .from("middleman_stores")
        .select("*")
        .eq("middle_man_id", user.id)
        .maybeSingle();

      if (!store) {
        toast.error("Please set up your store first");
        return;
      }

      const colors = template.default_colors || {};
      const { error } = await supabase
        .from("middleman_stores")
        .update({
          custom_html: template.html_template,
          custom_css: template.css_template,
          primary_color: colors.primary || "#000000",
          secondary_color: colors.secondary || "#ffffff",
          accent_color: colors.accent || "#3b82f6",
        })
        .eq("id", store.id);

      if (error) throw error;
      toast.success(`Template "${template.name}" applied to your store!`);
    } catch (error: any) {
      toast.error("Failed to apply template");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <h1 className="text-3xl font-bold">Store Templates</h1>
        </div>

        <p className="text-muted-foreground mb-8 max-w-2xl">
          Choose from professionally designed templates for your store. 
          Simply click to apply any template to your store.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border rounded-xl overflow-hidden group"
            >
              <div className="aspect-video bg-muted relative overflow-hidden">
                {template.preview_image_url ? (
                  <img
                    src={template.preview_image_url}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layout className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
                {template.is_free ? (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    Free
                  </span>
                ) : (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-white text-xs rounded-full">
                    ${template.price}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className="text-xs text-muted-foreground capitalize">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                <Button
                  className="w-full mt-4"
                  onClick={() => copyTemplateToStore(template)}
                >
                  {template.is_free ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Apply Template
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase & Apply
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <Layout className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              Try a different search or category
            </p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-background">
              <div>
                <h2 className="text-xl font-semibold">{selectedTemplate.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 hover:bg-accent rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div
                className="border rounded-lg p-4 min-h-[300px]"
                style={{
                  background: selectedTemplate.default_colors?.secondary || "#fff",
                  color: selectedTemplate.default_colors?.primary || "#000",
                }}
              >
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <h3 className="text-2xl font-bold mb-2">
                    Sample Store Title
                  </h3>
                  <p className="text-muted-foreground">
                    This is how your store will look with this template
                  </p>
                  <div className="flex justify-center gap-4 mt-8">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-32 h-32 border rounded-lg"
                        style={{
                          background: selectedTemplate.default_colors?.primary || "#000",
                          opacity: 0.1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ background: selectedTemplate.default_colors?.primary }}
                  />
                  <span className="text-sm">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ background: selectedTemplate.default_colors?.secondary }}
                  />
                  <span className="text-sm">Secondary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ background: selectedTemplate.default_colors?.accent }}
                  />
                  <span className="text-sm">Accent</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  copyTemplateToStore(selectedTemplate);
                  setSelectedTemplate(null);
                }}
              >
                {selectedTemplate.is_free ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply This Template
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase for ${selectedTemplate.price}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}