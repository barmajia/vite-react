import { Leaf, ShoppingBag, Heart } from 'lucide-react';
import { TemplateProps } from '@/types/template';

export const OrganicFresh = ({ siteName, products, onAddToCart }: TemplateProps) => (
  <div className="min-h-screen bg-[#f8f5f2] text-gray-800 font-sans">
    <header className="p-6 flex justify-between items-center">
      <h1 className="text-2xl font-serif italic text-green-800 flex items-center gap-2"><Leaf /> {siteName}</h1>
      <button className="text-green-800 hover:bg-green-100 p-2 rounded-full"><ShoppingBag size={20} /></button>
    </header>
    <section className="relative py-20 px-6 text-center">
      <h2 className="text-4xl md:text-5xl font-serif text-green-900 mb-4">Pure & Natural</h2>
      <p className="text-gray-600 max-w-xl mx-auto mb-6">Handcrafted, sustainable, and made with love for you and the planet.</p>
      <button className="bg-green-700 text-white px-6 py-3 rounded-full hover:bg-green-800 transition">Shop Collection</button>
    </section>
    <main className="max-w-6xl mx-auto px-6 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group">
            <div className="aspect-[4/3] bg-green-50 relative overflow-hidden">
              <img src={p.image_url || '/placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <button className="absolute top-3 right-3 bg-white/80 p-2 rounded-full hover:bg-white"><Heart size={16} /></button>
            </div>
            <div className="p-5">
              <h3 className="font-medium text-lg mb-1">{p.title}</h3>
              <p className="text-gray-500 text-sm mb-3">Organic • Handmade • Eco-friendly</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-green-800">{p.display_price.toLocaleString()} EGP</span>
                <button onClick={() => onAddToCart?.(p.id)} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 text-sm">Add to Cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
    <footer className="bg-green-900 text-green-100 py-10 text-center">
      <p className="font-serif text-lg mb-2">{siteName}</p>
      <p className="text-sm opacity-70">© {new Date().getFullYear()} Nourishing lives, naturally.</p>
    </footer>
  </div>
);