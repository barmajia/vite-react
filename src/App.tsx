import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun, ShoppingCart, User, Search, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              <span className="text-primary">AURORA</span>
            </Link>
            
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <Link to="/cart" className="p-2 rounded-md hover:bg-accent relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  0
                </span>
              </Link>
              
              <Link to="/profile" className="p-2 rounded-md hover:bg-accent">
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <section className="mb-12 p-8 rounded-2xl border bg-card">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to <span className="text-primary">Aurora</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Discover premium products from verified sellers worldwide.
          </p>
          <button className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90">
            Shop Now
          </button>
        </section>

        {/* Categories */}
        <section className="mb-8 flex gap-2 flex-wrap">
          {['All', 'Electronics', 'Fashion', 'Home', 'Sports', 'Beauty'].map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full text-sm bg-card border border-border hover:border-primary transition-colors"
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Products */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <div className="aspect-square bg-muted" />
                <div className="p-4">
                  <h3 className="font-medium mb-2">Product {i}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="text-sm">4.5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">$99.99</span>
                    <button className="p-2 bg-primary text-primary-foreground rounded-full">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Aurora. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;
