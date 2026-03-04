import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Aurora</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Welcome to Aurora
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Your premium e-commerce destination. Phase 1 setup complete.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
            <div className="p-6 rounded-lg border bg-card text-card-foreground">
              <h3 className="font-semibold mb-2">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</h3>
              <p className="text-sm text-muted-foreground">
                Click the theme toggle to switch between modes
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card text-card-foreground">
              <h3 className="font-semibold mb-2">Stack Ready</h3>
              <p className="text-sm text-muted-foreground">
                React + Vite + TypeScript + Tailwind + Supabase
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2026 Aurora E-commerce. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;
