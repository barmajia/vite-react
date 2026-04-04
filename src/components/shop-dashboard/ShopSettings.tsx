import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save, ExternalLink, UserCircle } from "lucide-react";
import { RoleSpecificMetadataEditor } from "./RoleSpecificMetadataEditor";

const schema = z.object({
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  status: z.enum(["draft", "active", "suspended"]),
  template_id: z
    .string()
    .uuid("Please select a template")
    .optional()
    .or(z.literal("")),
});

type SettingsForm = z.infer<typeof schema>;

export function ShopSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [shopType, setShopType] = useState<string | null>(null);
  const [shopMetadata, setShopMetadata] = useState<Record<string, any>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(schema),
  });

  const slug = watch("slug");

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("id, slug, status, template_id, shop_type, metadata")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shop) {
        setShopId(shop.id);
        setShopType(shop.shop_type);
        setShopMetadata(shop.metadata ?? {});
        setValue("slug", shop.slug);
        setValue("status", shop.status);
        setValue("template_id", shop.template_id ?? "");
      }

      const { data: templatesData } = await supabase
        .from("shop_templates")
        .select("id, name, shop_type, preview_image_url")
        .eq("status", "active");

      setTemplates(templatesData ?? []);
    }
    loadData();
  }, [user, setValue]);

  const onSubmit = async (data: SettingsForm) => {
    if (!shopId) return;
    setLoading(true);

    const { error } = await supabase
      .from("shops")
      .update({
        slug: data.slug,
        status: data.status,
        template_id: data.template_id || null,
      })
      .eq("id", shopId);

    setLoading(false);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert("Shop settings updated successfully!");
    }
  };

  // Filter templates by shop type
  const filteredTemplates = shopType
    ? templates.filter((t) => t.shop_type === shopType)
    : templates;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shop Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configure your shop's URL, visibility, and template.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Shop URL Slug */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Shop URL Slug
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
              /shops/
            </span>
            <input
              {...register("slug")}
              className="flex-1 p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="my-shop"
            />
            {slug && (
              <Link
                to={`/shops/${slug}`}
                target="_blank"
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                title="Preview shop"
              >
                <ExternalLink className="w-5 h-5" />
              </Link>
            )}
          </div>
          {errors.slug && (
            <p className="text-red-500 text-xs mt-1.5">{errors.slug.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Status</label>
          <select
            {...register("status")}
            className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="draft">Draft (Hidden from public)</option>
            <option value="active">Active (Visible to everyone)</option>
            <option value="suspended">Suspended (Temporarily disabled)</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
            Only active shops are visible to the public.
          </p>
        </div>

        {/* Template Selector */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Template</label>
          {filteredTemplates.length > 0 ? (
            <select
              {...register("template_id")}
              className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">No template (blank shop)</option>
              {filteredTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                No templates available for your shop type yet.
              </p>
              <Link
                to="/shops"
                className="text-sm text-blue-600 hover:underline"
              >
                Upload or request a template →
              </Link>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading || !isDirty}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Settings
            </>
          )}
        </button>
      </form>

      {/* Role-Specific Metadata Section */}
      {shopId && shopType && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">
              {shopType === "doctor"
                ? "Doctor Profile"
                : shopType === "factory"
                  ? "Factory Details"
                  : shopType === "middleman"
                    ? "Curation Details"
                    : "Store Details"}
            </h2>
          </div>
          <RoleSpecificMetadataEditor
            shopId={shopId}
            shopType={shopType}
            metadata={shopMetadata}
            onSave={() => {
              // Reload metadata after save
              supabase
                .from("shops")
                .select("metadata")
                .eq("id", shopId)
                .maybeSingle()
                .then(({ data }) => {
                  if (data) setShopMetadata(data.metadata ?? {});
                });
            }}
          />
        </div>
      )}
    </div>
  );
}
