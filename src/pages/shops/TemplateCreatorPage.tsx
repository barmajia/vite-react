import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Upload,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

const requestSchema = z.object({
  shop_type: z.enum(["doctor", "seller", "factory", "middleman"]),
  description: z.string().min(20, "Please provide at least 20 characters"),
  reference_urls: z.string().optional(),
  files: z.any().optional(),
});

type RequestForm = z.infer<typeof requestSchema>;

type ShopType = "doctor" | "seller" | "factory" | "middleman";

const SHOP_TYPE_LABELS: Record<ShopType, string> = {
  doctor: "Doctor Portfolio",
  seller: "Seller Store",
  factory: "Factory Catalog",
  middleman: "Middleman Curator",
};

export function TemplateCreatorPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialShopType = searchParams.get("id") as ShopType | null;

  const [mode, setMode] = useState<"upload" | "request">("upload");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [existingShop, setExistingShop] = useState<{
    id: string;
    slug: string;
  } | null>(null);

  // Check if user already has a shop
  useEffect(() => {
    async function checkShop() {
      if (!user) return;
      const { data: shop } = await supabase
        .from("shops")
        .select("id, slug")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (shop) setExistingShop(shop);
    }
    checkShop();
  }, [user]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      shop_type: initialShopType || undefined,
    },
  });

  // Pre-select shop type from URL param
  useEffect(() => {
    if (initialShopType) {
      setValue("shop_type", initialShopType);
    }
  }, [initialShopType, setValue]);

  // Auto-create shop record if user doesn't have one
  const ensureShopExists = async (shopType: ShopType, templateId?: string) => {
    if (!user) return null;

    const { data: existing } = await supabase
      .from("shops")
      .select("id, slug")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (existing) return existing;

    // Auto-create a shop with a default slug
    const slug = `${shopType}-${user.id.slice(0, 8)}`;
    const { data: newShop, error } = await supabase
      .from("shops")
      .insert({
        owner_id: user.id,
        slug,
        shop_type: shopType,
        status: "draft",
        template_id: templateId ?? null,
      })
      .select("id, slug")
      .single();

    if (error) throw error;
    return newShop;
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("templateFile") as File;
    const preview = formData.get("previewImage") as File;
    const name = formData.get("templateName") as string;
    const shop_type = formData.get("shopType") as ShopType;

    if (!file || !preview || !name || !shop_type) {
      setMessage({ type: "error", text: "All fields are required" });
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to upload templates");

      // 1. Upload files
      const { data: fileData, error: fileErr } = await supabase.storage
        .from("template-uploads")
        .upload(`templates/${Date.now()}_${file.name}`, file, {
          upsert: false,
        });

      const { data: previewData, error: previewErr } = await supabase.storage
        .from("template-uploads")
        .upload(`previews/${Date.now()}_${preview.name}`, preview, {
          upsert: false,
        });

      if (fileErr || previewErr) throw fileErr || previewErr;

      // 2. Save template record
      const { data: template, error: dbErr } = await supabase
        .from("shop_templates")
        .insert({
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
          shop_type,
          preview_image_url: previewData?.fullPath,
          template_data: { source_path: fileData?.fullPath },
          created_by: user.id,
        })
        .select("id")
        .single();

      if (dbErr) throw dbErr;

      // 3. Auto-create shop if user doesn't have one
      const shop = await ensureShopExists(shop_type, template?.id);
      setExistingShop(shop);

      setMessage({
        type: "success",
        text: "Template uploaded successfully! It will be reviewed shortly.",
      });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Upload failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (data: RequestForm) => {
    setLoading(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to submit a request");

      let attachments: string[] = [];
      if (data.files?.[0]) {
        const { data: fileRes, error } = await supabase.storage
          .from("template-uploads")
          .upload(
            `requests/${Date.now()}_${data.files[0].name}`,
            data.files[0],
          );
        if (error) throw error;
        attachments.push(fileRes.fullPath);
      }

      const { error } = await supabase.from("template_requests").insert({
        user_id: user.id,
        shop_type: data.shop_type,
        description: data.description,
        reference_urls:
          data.reference_urls
            ?.split(",")
            .map((u) => u.trim())
            .filter(Boolean) || [],
        attachments,
      });

      if (error) throw error;

      // Auto-create shop if user doesn't have one
      const shop = await ensureShopExists(data.shop_type);
      if (shop) setExistingShop(shop);

      setMessage({
        type: "success",
        text: "Request submitted! Our design team will contact you within 48h.",
      });
      reset();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Existing Shop Banner */}
      {existingShop && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">
              You already have a shop:{" "}
              <span className="font-bold">{existingShop.slug}</span>
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Manage your shop from the dashboard.
            </p>
          </div>
          <Link
            to="/shops/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2">Website Template Creator</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Choose how you want to get your storefront template.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => setMode("upload")}
          className={`p-6 border-2 rounded-xl text-left transition ${
            mode === "upload"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <Upload className="w-8 h-8 mb-3 text-blue-500" />
          <h3 className="text-lg font-semibold">Upload Existing Template</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload a ZIP/HTML template you already own.
          </p>
        </button>

        <button
          onClick={() => setMode("request")}
          className={`p-6 border-2 rounded-xl text-left transition ${
            mode === "request"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <FileText className="w-8 h-8 mb-3 text-green-500" />
          <h3 className="text-lg font-semibold">Request Custom Template</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Describe your needs &amp; let our team build it.
          </p>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      {mode === "upload" ? (
        <form
          onSubmit={handleUpload}
          className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border"
        >
          <input
            name="templateName"
            placeholder="Template Name"
            className="w-full p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-800"
            required
          />
          <select
            name="shopType"
            className="w-full p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-800"
            required
            defaultValue={initialShopType || ""}
          >
            <option value="">Select Shop Type</option>
            <option value="doctor">Doctor Portfolio</option>
            <option value="seller">Seller Store</option>
            <option value="factory">Factory Catalog</option>
            <option value="middleman">Middleman Curator</option>
          </select>
          <div>
            <label className="block mb-2 text-sm font-medium">
              Template File (ZIP/HTML)
            </label>
            <input
              name="templateFile"
              type="file"
              accept=".zip,.html,.css,.js"
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">
              Preview Image
            </label>
            <input
              name="previewImage"
              type="file"
              accept="image/*"
              className="w-full"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Uploading...
              </>
            ) : (
              "Upload Template"
            )}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit(handleRequest)}
          className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border"
        >
          <select
            {...register("shop_type")}
            className="w-full p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-800"
            required
          >
            <option value="">What type of shop is this for?</option>
            <option value="doctor">Doctor Portfolio</option>
            <option value="seller">Seller Store</option>
            <option value="factory">Factory Catalog</option>
            <option value="middleman">Middleman Curator</option>
          </select>
          {errors.shop_type && (
            <p className="text-sm text-red-500">{errors.shop_type.message}</p>
          )}
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe your ideal template layout, features, branding..."
            className="w-full p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-800"
            required
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
          <input
            {...register("reference_urls")}
            placeholder="Reference URLs (comma separated)"
            className="w-full p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-800"
          />
          <div>
            <label className="block mb-2 text-sm font-medium">
              Attachments (Figma, PSD, ZIP, etc.)
            </label>
            <input {...register("files")} type="file" className="w-full" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Submitting...
              </>
            ) : (
              <>
                <Send size={18} /> Submit Request
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
