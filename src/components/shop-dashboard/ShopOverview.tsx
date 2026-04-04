import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Package,
  TrendingUp,
  Eye,
  ExternalLink,
  Settings,
  Palette,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function ShopOverview() {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);

      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shopData) {
        setShop(shopData);

        const { count } = await supabase
          .from("shop_products")
          .select("*", { count: "exact", head: true })
          .eq("shop_id", shopData.id);

        setProductCount(count ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Store className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold mb-2">No Shop Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You haven't created a shop yet. Get started by choosing a template or
          requesting a custom one.
        </p>
        <Link
          to="/shops"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Your Shop
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{shop.slug}</h1>
          <p className="text-gray-500 dark:text-gray-400 capitalize">
            {shop.shop_type} Shop
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              statusColors[shop.status] ?? "bg-gray-100 text-gray-800"
            }`}
          >
            {shop.status}
          </span>
          {shop.status === "active" && (
            <Link
              to={`/shops/${shop.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded"
            >
              <ExternalLink className="w-4 h-4" />
              View Live
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Products"
          value={productCount.toString()}
          color="blue"
        />
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Views (30d)"
          value="—"
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Conversion"
          value="—"
          color="purple"
        />
        <StatCard
          icon={<Store className="w-5 h-5" />}
          label="Template"
          value={shop.template_id ? "Custom" : "Default"}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/shops/dashboard/settings"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Shop Settings</p>
              <p className="text-sm text-gray-500">URL, status, template</p>
            </div>
          </Link>
          <Link
            to="/shops/dashboard/products"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Package className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Manage Products</p>
              <p className="text-sm text-gray-500">Add or remove items</p>
            </div>
          </Link>
          <Link
            to="/shops/dashboard/appearance"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Palette className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium">Appearance</p>
              <p className="text-sm text-gray-500">Colors, fonts, layout</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Shop Info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Shop Details</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">URL</dt>
            <dd className="font-mono text-sm">
              /shops/{shop.slug}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Type</dt>
            <dd className="capitalize">{shop.shop_type}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Status</dt>
            <dd className="capitalize">{shop.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Created</dt>
            <dd>{new Date(shop.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600",
    green: "bg-green-50 dark:bg-green-950/30 text-green-600",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600",
    orange: "bg-orange-50 dark:bg-orange-950/30 text-orange-600",
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${colorMap[color] ?? "bg-gray-50 text-gray-600"}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
