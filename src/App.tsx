import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Aurora</h1>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto p-8">
        <div className="text-center mt-20">
          <h2 className="text-4xl font-bold mb-4">Welcome to Aurora</h2>
          <p className="text-muted-foreground">Theme: {theme}</p>
          <p className="text-sm mt-4">Tailwind CSS is working!</p>
        </div>
      </main>
    </div>
  );
}

export default App;
