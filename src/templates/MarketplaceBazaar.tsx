import { Filter, ShoppingCart, Tag } from 'lucide-react';
import { TemplateProps } from '@/types/template';

export const MarketplaceBazaar = ({ siteName, products, onAddToCart }: TemplateProps) => (
  <div className="min-h-screen bg-gray-100 font-sans">
    <header className="bg-blue-700 text-white p-3 flex justify-between items-center">
      <h1 className="text-lg font-bold flex items-center gap-2"><Tag /> {siteName}</h1>
      <button className="bg-blue-800 px-3 py-1.5 rounded text-sm hover:bg-blue-900">My Cart (0)</button>
    </header>
    <div className="flex max-w-7xl mx-auto">
      <aside className="w-64 bg-white p-4 hidden md:block border-r min-h-screen">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Filter size={16} /> Filters</h3>
        <div className="space-y-3 text-sm">
          {['All Items', 'Under $50', 'New Arrivals', 'Top Sellers'].map(f => <div key={f} className="hover:text-blue-600 cursor-pointer">{f}</div>)}
        </div>
      </aside>
      <main className="flex-1 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow-sm p-3 hover:shadow transition">
              <div className="aspect-video bg-gray-200 rounded mb-2 overflow-hidden">
                <img src={p.image_url || '/placeholder.jpg'} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-medium text-sm truncate">{p.title}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-green-700">{p.display_price.toLocaleString()} EGP</span>
                <button onClick={() => onAddToCart?.(p.id)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><ShoppingCart size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
    <footer className="bg-white py-6 text-center text-sm text-gray-500 border-t mt-8">© {new Date().getFullYear()} {siteName} Marketplace</footer>
  </div>
);