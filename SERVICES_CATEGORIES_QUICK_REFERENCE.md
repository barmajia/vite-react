# Services Categories - Quick Reference

## 🚀 Usage Examples

### Fetch All Categories with Subcategories

```typescript
import { useServiceCategories } from '@/features/services/hooks/useServiceCategories';

function MyComponent() {
  const { data: categories, isLoading } = useServiceCategories();
  
  // categories type: ServiceCategoryWithSubcategories[]
  // Each category has: id, name, slug, description, subcategories[]
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {categories.map((category) => (
        <div key={category.id}>
          <h2>{category.name}</h2>
          <div>
            {category.subcategories.map((sub) => (
              <Link to={`/services/${category.slug}/${sub.slug}`}>
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Fetch Single Category by Slug

```typescript
import { useServiceCategoryBySlug } from '@/features/services/hooks/useServiceCategories';

function CategoryPage({ slug }) {
  const { data: category, isLoading } = useServiceCategoryBySlug(slug);
  
  if (!category) return <NotFound />;
  
  return (
    <div>
      <h1>{category.name}</h1>
      <p>{category.description}</p>
      
      {/* Subcategory navigation */}
      <div>
        <Link to={`/services/${slug}`}>All</Link>
        {category.subcategories.map((sub) => (
          <Link to={`/services/${slug}/${sub.slug}`}>
            {sub.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Fetch Listings with Filters

```typescript
import { useServiceListings } from '@/features/services/hooks/useServiceListings';

function ListingsGrid({ categoryId, subcategoryId }) {
  const { data, isLoading } = useServiceListings({
    categoryId,           // Optional: filter by category
    subcategoryId,        // Optional: filter by subcategory
    searchQuery: 'translation',  // Optional: search term
    priceMin: 100,        // Optional: minimum price
    priceMax: 1000,       // Optional: maximum price
    verifiedOnly: true,   // Optional: only verified providers
    sortBy: 'featured',   // Options: 'featured', 'newest', 'price_low', 'price_high'
    page: 1,              // Pagination
    limit: 12,            // Items per page
  });
  
  // data.listings type: ServiceListingWithRelations[]
  // data.total: number
  // data.hasMore: boolean
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {data.listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
      
      {data.hasMore && <LoadMoreButton />}
    </div>
  );
}
```

### Fetch Single Listing by Slug

```typescript
import { useServiceListingBySlug } from '@/features/services/hooks/useServiceListings';

function ListingDetail({ slug }) {
  const { data: listing, isLoading } = useServiceListingBySlug(slug);
  
  if (!listing) return <NotFound />;
  
  return (
    <div>
      <h1>{listing.title}</h1>
      <p>{listing.description}</p>
      <p>Price: {listing.price_min} {listing.currency}</p>
      
      {/* Provider info */}
      {listing.provider && (
        <div>
          <h3>{listing.provider.provider_name}</h3>
          {listing.provider.is_verified && <VerifiedBadge />}
        </div>
      )}
      
      {/* Category info */}
      {listing.category && (
        <Link to={`/services/${listing.category.slug}`}>
          {listing.category.name}
        </Link>
      )}
      
      {/* Subcategory info */}
      {listing.subcategory && (
        <Link to={`/services/${listing.category.slug}/${listing.subcategory.slug}`}>
          {listing.subcategory.name}
        </Link>
      )}
    </div>
  );
}
```

---

## 🎯 Common Patterns

### Pattern 1: Category → Subcategory → Listings

```typescript
// Step 1: Get all categories
const { data: categories } = useServiceCategories();

// Step 2: User clicks category
<Link to={`/services/${category.slug}`}>{category.name}</Link>

// Step 3: User clicks subcategory
<Link to={`/services/${category.slug}/${subcategory.slug}`}>
  {subcategory.name}
</Link>

// Step 4: Page fetches filtered listings
const { data } = useServiceListings({
  categoryId: category.id,
  subcategoryId: subcategory.id,
});
```

### Pattern 2: Breadcrumb Navigation

```typescript
function Breadcrumb({ categorySlug, subcategorySlug }) {
  const { data: category } = useServiceCategoryBySlug(categorySlug);
  const subcategory = category?.subcategories.find(
    s => s.slug === subcategorySlug
  );
  
  return (
    <nav>
      <Link to="/services">Services</Link>
      {' → '}
      <Link to={`/services/${categorySlug}`}>{category?.name}</Link>
      {subcategory && (
        <>
          {' → '}
          <span>{subcategory.name}</span>
        </>
      )}
    </nav>
  );
}
```

### Pattern 3: Subcategory Filter Pills

```typescript
function SubcategoryFilter({ categorySlug, selectedSubcategory }) {
  const { data: category } = useServiceCategoryBySlug(categorySlug);
  
  if (!category?.subcategories.length) return null;
  
  return (
    <div className="flex gap-2 flex-wrap">
      <Link
        to={`/services/${categorySlug}`}
        className={!selectedSubcategory ? 'active' : ''}
      >
        All {category.name}
      </Link>
      
      {category.subcategories.map((sub) => (
        <Link
          key={sub.id}
          to={`/services/${categorySlug}/${sub.slug}`}
          className={selectedSubcategory === sub.slug ? 'active' : ''}
        >
          {sub.name}
        </Link>
      ))}
    </div>
  );
}
```

---

## 📊 Data Types

### ServiceCategoryWithSubcategories

```typescript
{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_active: boolean;
  sort_order: number;
  listing_count?: number;
  created_at: string;
  updated_at: string;
  subcategories: ServiceSubcategory[];
}
```

### ServiceSubcategory

```typescript
{
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

### ServiceListingWithRelations

```typescript
{
  id: string;
  provider_id: string;
  category_id: string;
  subcategory_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: 'fixed' | 'hourly' | 'project' | null;
  currency: string | null;
  image_url: string | null;
  is_active: boolean;
  status: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  provider: {
    id: string;
    provider_name: string;
    logo_url: string | null;
    is_verified: boolean;
    average_rating?: number;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  subcategory: {
    id: string;
    name: string;
    slug: string;
  } | null;
}
```

---

## 🔧 Advanced Usage

### Invalidate Cache After Mutation

```typescript
import { useInvalidateCategories } from '@/features/services/hooks/useServiceCategories';
import { useInvalidateListings } from '@/features/services/hooks/useServiceListings';

function EditCategoryForm() {
  const invalidateCategories = useInvalidateCategories();
  const invalidateListings = useInvalidateListings();
  
  const handleUpdate = async (data) => {
    await updateCategory(data);
    invalidateCategories(); // Refresh categories cache
  };
  
  // ...
}
```

### Custom Query Options

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function CustomCategoriesQuery() {
  const { data, isLoading } = useQuery({
    queryKey: ['custom-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('svc_categories')
        .select(`
          *,
          subcategories:svc_subcategories(*)
        `)
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
```

---

## 📝 Notes

1. **All queries automatically filter** for `is_active = true` on categories and subcategories
2. **Listings are filtered** for `is_active = true` and `status = 'active'`
3. **Cache is set to 5 minutes** for categories, 2 minutes for listings
4. **Retry logic** is built-in (2 retries by default)
5. **TypeScript types** are fully defined for all hooks

---

For more details, see [SERVICES_CATEGORIES_INTEGRATION.md](./SERVICES_CATEGORIES_INTEGRATION.md)
