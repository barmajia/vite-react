import { ShoppingBag } from 'lucide-react';
import { TemplateProps } from '@/types/template';

export const MinimalistClean = ({ siteName, products, onAddToCart }: TemplateProps) => (
  <div className="min-h-screen bg-white text-gray-900 font-sans">
    <header className="p-6 flex justify-between items-center border-b">
      <h1 className="text-2xl font-light tracking-widest uppercase">{siteName}</h1>
      <ShoppingBag className="w-6 h-6 cursor-pointer" />
    </header>
    <section className="py-20 text-center bg-gray-50">
      <h2 className="text-4xl md:text-5xl font-thin mb-4">Curated for You</h2>
      <p className="text-gray-500 max-w-lg mx-auto">Discover our handpicked collection of premium essentials.</p>
    </section>
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map(p => (
          <div key={p.id} className="group cursor-pointer">
            <div className="aspect-square bg-gray-100 mb-4 overflow-hidden rounded-sm">
              <img src={p.image_url || '/placeholder.jpg'} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            </div>
            <h3 className="font-medium">{p.title}</h3>
            <p className="text-gray-500 mt-1">{p.display_price.toLocaleString()} EGP</p>
            <button onClick={() => onAddToCart?.(p.id)} className="mt-3 text-sm underline hover:text-gray-700">Add to Bag</button>
          </div>
        ))}
      </div>
    </main>
    <footer className="py-12 border-t text-center text-sm text-gray-400">© {new Date().getFullYear()} {siteName}</footer>
  </div>
);