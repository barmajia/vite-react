import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, Button } from "@/components/ui";
import {
  ArrowLeft,
  Star,
  ShoppingBag,
  Globe,
  Layers,
  User,
  Zap,
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_role: string | null;
  price: number;
  thumbnail_url: string | null;
  preview_url: string | null;
  theme_config: any;
  version: string | null;
  rating: number | null;
  review_count?: number | null;
  download_count?: number | null;
  total_sales?: number | null;
  is_published: boolean;
  [key: string]: any; // Allow any other columns
}

export default function TemplateDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Template ID is required");
      setLoading(false);
      return;
    }
    loadTemplate(id);
  }, [id]);

  const loadTemplate = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from("website_marketplace")
        .select("*")
        .eq("id", templateId)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError("Template not found or is not published");
      } else {
        setTemplate(data);
      }
    } catch (err: any) {
      console.error("Error loading template:", err);
      setError(err.message || "Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Template Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "This template is not available."}
          </p>
          <Button onClick={() => navigate("/webmarketplace")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="border-b bg-gray-50 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/webmarketplace"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{template.title}</h1>
            {template.description && (
              <p className="text-gray-600 text-lg">{template.description}</p>
            )}
          </div>
          <div className="ml-6">
            <span
              className={`px-4 py-2 rounded-full text-lg font-bold shadow-sm ${
                template.price === 0
                  ? "bg-green-100 text-green-800 border-2 border-green-300"
                  : "bg-blue-100 text-blue-800 border-2 border-blue-300"
              }`}
            >
              {template.price === 0 ? "FREE" : `$${template.price.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-100 rounded-xl overflow-hidden h-[500px] mb-8 border-2">
          {template.preview_url ? (
            <iframe
              src={template.preview_url}
              className="w-full h-full"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Globe className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">Preview Unavailable</p>
              <p className="text-sm">
                This template doesn't have a live preview
              </p>
            </div>
          )}
        </div>

        {/* Template Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Category
              </span>
            </div>
            <p className="text-lg font-bold capitalize">
              {template.category || "N/A"}
            </p>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">
                Target Role
              </span>
            </div>
            <p className="text-lg font-bold capitalize">
              {template.target_role || "N/A"}
            </p>
          </Card>

          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Version</span>
            </div>
            <p className="text-lg font-bold">{template.version || "1.0.0"}</p>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Rating</span>
            </div>
            <p className="text-lg font-bold">
              {template.rating?.toFixed(1) || "0.0"}
            </p>
          </Card>
        </div>

        {/* Download/Sales Count */}
        {(template.download_count || template.total_sales || 0) > 0 && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {template.download_count || template.total_sales || 0}{" "}
                {template.download_count
                  ? template.download_count === 1
                    ? "download"
                    : "downloads"
                  : template.total_sales === 1
                    ? "sale"
                    : "sales"}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-4">
          <Link
            to={`/webmarketplace/${template.id}/checkout`}
            className="flex-1"
          >
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 text-lg"
            >
              <Zap className="h-5 w-5 mr-2" />
              {template.price === 0
                ? "Claim Free Template & Deploy"
                : "Purchase & Deploy"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
