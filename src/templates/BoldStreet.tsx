import { ArrowRight } from 'lucide-react';
import { TemplateProps } from '@/types/template';

export const BoldStreet = ({ siteName, products, onAddToCart }: TemplateProps) => (
  <div className="min-h-screen bg-black text-white font-sans">
    <header className="p-4 flex justify-between items-center border-b border-gray-800">
      <h1 className="text-xl font-black tracking-tighter">{siteName.toUpperCase()}</h1>
      <button className="bg-white text-black px-4 py-2 text-sm font-bold hover:bg-gray-200">CART (0)</button>
    </header>
    <section className="relative h-80 flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 to-black">
      <h2 className="text-6xl md:text-8xl font-black text-center leading-none px-4">DROP<br/>SEASON</h2>
    </section>
    <main className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-gray-900 p-4 border border-gray-800 hover:border-gray-600 transition">
            <div className="aspect-[3/4] bg-gray-800 mb-4 relative overflow-hidden rounded-sm">
              <img src={p.image_url || '/placeholder.jpg'} className="w-full h-full object-cover" />
              <span className="absolute top-2 right-2 bg-red-600 text-xs px-2 py-1 font-bold">NEW</span>
            </div>
            <h3 className="font-bold text-lg truncate">{p.title}</h3>
            <p className="text-gray-400 my-1">{p.display_price.toLocaleString()} EGP</p>
            <button onClick={() => onAddToCart?.(p.id)} className="w-full mt-2 bg-white text-black py-2 font-bold flex items-center justify-center gap-2 hover:bg-gray-200 rounded-sm">
              ADD <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </main>
    <footer className="py-8 border-t border-gray-800 text-center text-xs text-gray-500 uppercase tracking-widest">
      © {new Date().getFullYear()} {siteName} — All Rights Reserved
    </footer>
  </div>
);