import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ProductGrid } from '@/components/products/ProductGrid';
import { FilterSidebar } from '@/components/products/FilterSidebar.tsx';
import { Pagination } from '@/components/shared/Pagination';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1
  );

  const searchQuery = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('min_price') || undefined;
  const maxPrice = searchParams.get('max_price') || undefined;

  const { data, isLoading, error } = useProducts({
    page: currentPage,
    limit: 20,
    search: searchQuery,
    category,
    brand,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy: sortBy as 'created_at' | 'price' | 'title',
    sortOrder,
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [currentPage]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split('-');
    setSortBy(field);
    setSortOrder(order as 'asc' | 'desc');
    setCurrentPage(1);
    
    const params = new URLSearchParams(searchParams);
    params.set('sort', field);
    params.set('order', order as 'asc' | 'desc');
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {searchQuery ? `Search results for "${searchQuery}"` : 'All Products'}
          </h1>
          {data && (
            <p className="text-muted-foreground mt-1">
              {data.totalCount} products found
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select value={`${sortBy}-${sortOrder}`} onChange={handleSortChange}>
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title-asc">Name: A to Z</option>
            <option value="title-desc">Name: Z to A</option>
          </Select>

          {/* View Mode */}
          <div className="flex border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-r-none',
                viewMode === 'grid' && 'bg-accent'
              )}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-l-none',
                viewMode === 'list' && 'bg-accent'
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <FilterSidebar />

        {/* Products */}
        <div className="flex-1 min-w-0">
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Error loading products</p>
            </div>
          ) : isLoading ? (
            <ProductGrid isLoading={true} />
          ) : data && data.products.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <>
              <ProductGrid products={data?.products || []} />
              
              {data && data.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={data.totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={data.totalCount}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
