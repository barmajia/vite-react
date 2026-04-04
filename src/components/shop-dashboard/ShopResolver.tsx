import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertTriangle } from "lucide-react";
import { DoctorPortfolio } from "./templates/DoctorPortfolio";
import { SellerStorefront } from "./templates/SellerStorefront";
import { FactoryCatalog } from "./templates/FactoryCatalog";
import { MiddlemanCurator } from "./templates/MiddlemanCurator";

type ShopType = "doctor" | "seller" | "factory" | "middleman";

interface ShopData {
  id: string;
  slug: string;
  shop_type: ShopType;
  template_id: string | null;
  status: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  products: any[];
}

const TemplateMap: Record<ShopType, React.FC<{ shop: ShopData }>> = {
  doctor: DoctorPortfolio,
  seller: SellerStorefront,
  factory: FactoryCatalog,
  middleman: MiddlemanCurator,
};

export function ShopResolver() {
  const { user } = useAuth();
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShop() {
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        // Fetch active shop with products
        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select(
            `
            id,
            slug,
            shop_type,
            template_id,
            status,
            settings,
            metadata,
            shop_products (
              products (
                id,
                title,
                price,
                images,
                description,
                status
              )
            )
          `
          )
          .eq("owner_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (shopError) throw shopError;

        if (!shopData) {
          setError("Shop not found or not active. Please activate your shop from the dashboard.");
          setLoading(false);
          return;
        }

        // Extract products from the nested join
        const products =
          shopData.shop_products
            ?.map((sp: any) => sp.products)
            .filter(Boolean) ?? [];

        setShop({
          ...shopData,
          shop_products: undefined,
          products,
        });
      } catch (err: any) {
        setError(err.message ?? "Failed to load shop");
      } finally {
        setLoading(false);
      }
    }

    loadShop();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading your storefront...
          </p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">Shop Unavailable</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {error ?? "Your shop couldn't be loaded."}
          </p>
          <a
            href="/shops/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Dynamically render the correct template
  const TemplateComponent = TemplateMap[shop.shop_type] ?? SellerStorefront;

  return <TemplateComponent shop={shop} />;
}
