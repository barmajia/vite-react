import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Check, X, Package, Loader2 } from "lucide-react";

export function ProductManager() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopProducts, setShopProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!shop) {
        setLoading(false);
        return;
      }

      setShopId(shop.id);

      // Fetch all products owned by this seller
      const { data: prods } = await supabase
        .from("products")
        .select("id, title, price, status, images")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      setProducts(prods ?? []);

      // Fetch currently assigned to shop
      const { data: assigned } = await supabase
        .from("shop_products")
        .select("product_id")
        .eq("shop_id", shop.id);

      setShopProducts(new Set(assigned?.map((a) => a.product_id) ?? []));
      setLoading(false);
    }
    load();
  }, [user]);

  const toggleProduct = async (productId: string) => {
    if (!shopId || toggling) return;
    setToggling(productId);

    const isInShop = shopProducts.has(productId);

    if (isInShop) {
      const { error } = await supabase
        .from("shop_products")
        .delete()
        .eq("shop_id", shopId)
        .eq("product_id", productId);

      if (!error) {
        setShopProducts((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    } else {
      const { error } = await supabase
        .from("shop_products")
        .insert({ shop_id: shopId, product_id: productId });

      if (!error) {
        setShopProducts((prev) => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
    }

    setToggling(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold mb-2">No Shop Found</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Create a shop first to manage products.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Shop Products</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Toggle products to add or remove them from your shop.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">
            No products found. Add products first from your seller dashboard.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border divide-y">
          {products.map((p) => {
            const isInShop = shopProducts.has(p.id);
            const isToggling = toggling === p.id;
            const imageUrl =
              p.images?.[0]?.url ?? p.images?.[0] ?? null;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={p.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ${p.price?.toFixed(2) ?? "0.00"} •{" "}
                      <span className="capitalize">{p.status}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleProduct(p.id)}
                  disabled={isToggling}
                  className={`p-2.5 rounded-lg transition flex-shrink-0 ${
                    isInShop
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  } disabled:opacity-50`}
                  title={isInShop ? "Remove from shop" : "Add to shop"}
                >
                  {isToggling ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isInShop ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {products.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            {shopProducts.size} of {products.length} products in shop
          </span>
          <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: `${(shopProducts.size / products.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
