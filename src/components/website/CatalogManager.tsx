import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CatalogItem {
  id: string;
  product_id: string;
  display_price: number;
  products?: {
    title: string;
    price: number;
    image_url: string | null;
  };
}

interface CatalogManagerProps {
  catalog: CatalogItem[];
  onAdd: (product: { id: string; price: number }) => void;
  onRemove: (id: string) => void;
  role: string;
}

export function CatalogManager({ catalog, onAdd, onRemove, role }: CatalogManagerProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, price, images')
          .eq('status', 'active')
          .ilike('title', `%${search}%`)
          .limit(50);
        
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    if (search) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [search]);

  const existingIds = new Set(catalog.map(c => c.product_id));
  const availableProducts = products.filter(p => !existingIds.has(p.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Product Catalog ({catalog.length} items)</h3>
        <Button onClick={() => setShowAddModal(true)}>+ Add Product</Button>
      </div>

      {catalog.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No products in catalog yet. Add products to display on your store.
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {catalog.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                {item.products?.image_url ? (
                  <img src={item.products.image_url} alt={item.products.title} className="w-full h-full object-cover rounded" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <h4 className="font-medium text-sm truncate">{item.products?.title || 'Product'}</h4>
              <div className="flex justify-between items-center mt-2">
                <span className="text-primary font-bold">{Number(item.display_price).toLocaleString()} EGP</span>
                {role === 'middleman' && item.products?.price && (
                  <span className="text-xs text-gray-400 line-through">{item.products.price} EGP</span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2 text-red-500"
                onClick={() => onRemove(item.id)}
              >
                Remove
              </Button>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Product to Catalog</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500">✕</button>
            </div>
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4"
            />
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="space-y-2">
                {availableProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span>📦</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.title}</p>
                        <p className="text-xs text-gray-500">{Number(product.price).toLocaleString()} EGP</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        onAdd({ id: product.id, price: product.price });
                        setShowAddModal(false);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                ))}
                {availableProducts.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No products found</p>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}