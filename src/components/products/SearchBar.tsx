import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { debounce } from '@/lib/utils';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const debouncedSearch = debounce((searchQuery: string) => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams(location.search);
      params.set('q', searchQuery.trim());
      navigate(`${ROUTES.PRODUCTS}?${params.toString()}`);
    } else {
      const params = new URLSearchParams(location.search);
      params.delete('q');
      navigate(`${ROUTES.PRODUCTS}${params.toString() ? `?${params.toString()}` : ''}`);
    }
  }, 300);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    const params = new URLSearchParams(location.search);
    params.delete('q');
    navigate(`${ROUTES.PRODUCTS}${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
          className="w-full pl-10 pr-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
