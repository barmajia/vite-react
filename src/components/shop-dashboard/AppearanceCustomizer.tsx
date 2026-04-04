import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Save, Loader2, Eye } from "lucide-react";

interface ShopSettings {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  show_hero: boolean;
  layout: "grid" | "list";
  hero_title?: string;
  hero_subtitle?: string;
}

const defaultSettings: ShopSettings = {
  primary_color: "#2563eb",
  secondary_color: "#64748b",
  font_family: "Inter, sans-serif",
  show_hero: true,
  layout: "grid",
  hero_title: "Welcome to My Shop",
  hero_subtitle: "Discover amazing products",
};

const fontOptions = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Poppins, sans-serif", label: "Poppins" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "Open Sans, sans-serif", label: "Open Sans" },
  { value: "Montserrat, sans-serif", label: "Montserrat" },
];

export function AppearanceCustomizer() {
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("id, settings")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shop) {
        setShopId(shop.id);
        setSettings((s) => ({ ...s, ...shop.settings }));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleSave = async () => {
    if (!shopId) return;
    setSaving(true);

    const { error } = await supabase
      .from("shops")
      .update({ settings })
      .eq("id", shopId);

    setSaving(false);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert("Appearance saved successfully!");
    }
  };

  const updateSetting = <K extends keyof ShopSettings>(
    key: K,
    value: ShopSettings[K]
  ) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">No Shop Found</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Create a shop first to customize its appearance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appearance Customizer</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Customize colors, fonts, and layout for your shop.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6 bg-white dark:bg-gray-900 rounded-xl border p-6">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) => updateSetting("primary_color", e.target.value)}
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={settings.primary_color}
                onChange={(e) => updateSetting("primary_color", e.target.value)}
                className="flex-1 p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.secondary_color}
                onChange={(e) =>
                  updateSetting("secondary_color", e.target.value)
                }
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={settings.secondary_color}
                onChange={(e) =>
                  updateSetting("secondary_color", e.target.value)
                }
                className="flex-1 p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium mb-2">Font Family</label>
            <select
              value={settings.font_family}
              onChange={(e) => updateSetting("font_family", e.target.value)}
              className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Layout */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Product Layout
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => updateSetting("layout", "grid")}
                className={`flex-1 p-3 border rounded-lg text-sm font-medium transition ${
                  settings.layout === "grid"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => updateSetting("layout", "list")}
                className={`flex-1 p-3 border rounded-lg text-sm font-medium transition ${
                  settings.layout === "list"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Show Hero */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="show_hero"
              checked={settings.show_hero}
              onChange={(e) => updateSetting("show_hero", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="show_hero" className="text-sm font-medium">
              Show Hero Section
            </label>
          </div>

          {/* Hero Title */}
          {settings.show_hero && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={settings.hero_title ?? ""}
                  onChange={(e) => updateSetting("hero_title", e.target.value)}
                  className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="Welcome to My Shop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Hero Subtitle
                </label>
                <input
                  type="text"
                  value={settings.hero_subtitle ?? ""}
                  onChange={(e) =>
                    updateSetting("hero_subtitle", e.target.value)
                  }
                  className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="Discover amazing products"
                />
              </div>
            </>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Apply Changes
              </>
            )}
          </button>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Live Preview</h3>
          </div>
          <div
            className="border rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
            style={{ fontFamily: settings.font_family }}
          >
            {/* Preview Header */}
            <div
              className="p-4 text-white"
              style={{ backgroundColor: settings.primary_color }}
            >
              <p className="font-bold text-lg">Shop Preview</p>
            </div>

            {/* Preview Hero */}
            {settings.show_hero && (
              <div className="p-6 bg-gray-50 dark:bg-gray-800">
                <h3
                  className="text-xl font-bold mb-1"
                  style={{ color: settings.primary_color }}
                >
                  {settings.hero_title ?? "Welcome to My Shop"}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: settings.secondary_color }}
                >
                  {settings.hero_subtitle ?? "Discover amazing products"}
                </p>
              </div>
            )}

            {/* Preview Products */}
            <div className="p-4">
              <p className="text-sm font-medium mb-3">Sample Products</p>
              <div
                className={
                  settings.layout === "grid"
                    ? "grid grid-cols-2 gap-3"
                    : "space-y-3"
                }
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="h-20 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Image</span>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">
                        Product {i}
                      </p>
                      <p
                        className="text-xs font-bold mt-0.5"
                        style={{ color: settings.primary_color }}
                      >
                        ${i * 9.99}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
