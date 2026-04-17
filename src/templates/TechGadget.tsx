import { Cpu, Zap, Shield } from 'lucide-react';
import { TemplateProps } from '@/types/template';

export const TechGadget = ({ siteName, products, onAddToCart }: TemplateProps) => (
  <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
    <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
      <h1 className="text-xl font-semibold flex items-center gap-2"><Cpu className="text-blue-600" /> {siteName}</h1>
      <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Cart</button>
    </header>
    <section className="bg-white py-16 px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-3">Next-Gen Technology</h2>
      <p className="text-gray-500 max-w-2xl mx-auto mb-8">Premium electronics engineered for performance and reliability.</p>
      <div className="flex justify-center gap-6 text-sm text-gray-600">
        <span className="flex items-center gap-1"><Zap size={14} /> Fast Shipping</span>
        <span className="flex items-center gap-1"><Shield size={14} /> 2Yr Warranty</span>
      </div>
    </section>
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
            <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
              <img src={p.image_url || '/placeholder.jpg'} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-semibold truncate">{p.title}</h3>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xl font-bold text-blue-600">{p.display_price.toLocaleString()} EGP</span>
              <button onClick={() => onAddToCart?.(p.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Buy Now</button>
            </div>
          </div>
        ))}
      </div>
    </main>
    <footer className="bg-gray-900 text-gray-300 py-10 px-4 text-center">
      <p>© {new Date().getFullYear()} {siteName}. Premium tech, delivered.</p>
    </footer>
  </div>
);