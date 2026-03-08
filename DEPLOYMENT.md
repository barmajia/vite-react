# Deployment Optimization Guide

## ✅ Completed Optimizations

### 1. Code Splitting (vite.config.ts)
The build now splits bundles into smaller chunks for better caching and loading:

```typescript
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],      // ~150kB
  ui: ['@radix-ui/react-dialog', ...],                     // ~50kB
  query: ['@tanstack/react-query'],                        // ~45kB
  supabase: ['@supabase/supabase-js'],                     // ~30kB
  utils: ['clsx', 'tailwind-merge', ...],                  // ~10kB
  state: ['zustand'],                                      // ~5kB
  icons: ['lucide-react'],                                 // ~80kB
}
```

**Benefits:**
- Better browser caching (vendor libraries rarely change)
- Faster subsequent loads (only download changed chunks)
- Parallel downloading of multiple small chunks

### 2. Grid SVG Asset
Created `/public/grid.svg` to resolve the build warning.

**Location:** `public/grid.svg`
**Used in:** `src/pages/public/Home.tsx`

### 3. Vercel Ignore File
Created `.vercelignore` to exclude unnecessary files from builds:
- SQL backups
- Documentation files
- Development configs
- Local environment files

### 4. Production Console Cleanup
Added `esbuild.drop` to remove `console.log` and `debugger` statements in production builds.

### 5. Vercel SPA Routing Configuration
Created `vercel.json` to handle client-side routing for Single Page Application:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Why this is needed:**
- Direct navigation to `/contact` would return 404 without this
- Vercel needs to serve `index.html` for all routes
- React Router then handles the route client-side

---

## 📊 Expected Build Improvements

| Metric | Before | After (Expected) |
|--------|--------|------------------|
| Main JS Bundle | 647.61 kB | ~200-300 kB |
| Number of Chunks | 1 large | 7-10 smaller |
| Build Warning | 2 | 0 |
| First Load | Slower | 30-40% faster |
| Cached Loads | Less efficient | Much faster |

---

## 🚀 Additional Optimization Recommendations

### 1. Lazy Load Routes (High Impact)
Add route-based code splitting in `App.tsx`:

```tsx
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/public/Home'));
const ProductDetails = lazy(() => import('./pages/public/ProductDetails'));
const Cart = lazy(() => import('./pages/cart/Cart'));

// In your routes:
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### 2. Image Optimization
Use WebP format and lazy loading for product images:

```tsx
<img 
  src={product.image} 
  alt={product.title}
  loading="lazy"
  className="..."
/>
```

### 3. Component Lazy Loading
For heavy components used on specific pages:

```tsx
const ProductGrid = lazy(() => import('@/components/products/ProductGrid'));
```

### 4. Tree Shaking Icons
Import only used icons (you're already doing this ✅):

```tsx
// ✅ Good
import { ShoppingBag, Truck } from 'lucide-react';

// ❌ Avoid
import * as Icons from 'lucide-react';
```

### 5. Enable Compression
Already using `minify: 'esbuild'` ✅ (fastest minifier)

---

## 🔍 Monitoring Build Size

Install bundle visualizer to analyze chunks:

```bash
npm install --save-dev vite-bundle-visualizer
```

Add to `package.json`:
```json
"scripts": {
  "analyze": "vite-bundle-visualizer"
}
```

Run: `npm run analyze`

---

## 📋 Pre-Deploy Checklist

- [x] Code splitting configured
- [x] Grid.svg asset created
- [x] .vercelignore file created
- [x] Console.log removal in production
- [x] vercel.json for SPA routing
- [ ] Environment variables set in Vercel
- [ ] Supabase Auth redirects configured
- [ ] Test build locally: `npm run build && npm run preview`

---

## 🎯 Next Steps

1. **Test the optimized build locally:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "build: optimize bundle splitting and assets"
   git push
   ```

3. **Monitor Vercel build logs** for new chunk sizes

4. **Test production URL** and check Network tab for multiple chunks

---

## 🆘 Troubleshooting

### Build Fails After Changes
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Chunks Still Too Large
- Check `vite-bundle-visualizer` output
- Identify which dependencies are largest
- Consider alternatives (e.g., `dayjs` instead of `moment`)

### Runtime Errors After Deploy
- Check browser console for missing chunks
- Verify Vercel environment variables match local `.env`
- Ensure all imports use correct paths (`@/` alias)

---

**Last Updated:** March 8, 2026
**Build Target:** Production (Vercel)
