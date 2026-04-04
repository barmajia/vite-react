import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Loading skeleton component
const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load product pages
const ProductList = lazy(() => import('@/pages/public/ProductList').then(m => ({ default: m.ProductList })));
const ProductDetail = lazy(() => import('@/pages/public/ProductDetail').then(m => ({ default: m.ProductDetail })));
const ProductDetailsPage = lazy(() => import('@/pages/public/ProductDetailsPage').then(m => ({ default: m.default })));
const ProductDetailRedirect = lazy(() => import('@/pages/public/ProductDetailRedirect').then(m => ({ default: m.ProductDetailRedirect })));
const CategoriesPage = lazy(() => import('@/features/categories/pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const CategoryProductsPage = lazy(() => import('@/features/categories/pages/CategoryProductsPage').then(m => ({ default: m.CategoryProductsPage })));

// Cart & Checkout
const CartPage = lazy(() => import('@/features/cart/pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/features/checkout/pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('@/features/orders/pages/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));

// Orders
const OrdersListPage = lazy(() => import('@/features/orders/pages/OrdersListPage').then(m => ({ default: m.OrdersListPage })));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })));

// Wishlist & Addresses
const WishlistPage = lazy(() => import('@/features/wishlist/pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const AddressesPage = lazy(() => import('@/features/addresses/pages/AddressesPage').then(m => ({ default: m.AddressesPage })));

// Placeholder components
const Brands = () => (
  <Suspense fallback={<RouteSkeleton />}>
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Brands Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
    </div>
  </Suspense>
);

const BrandProducts = () => (
  <Suspense fallback={<RouteSkeleton />}>
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Brand Products Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
    </div>
  </Suspense>
);

export const productRoutes: RouteObject[] = [
  {
    path: 'products',
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ProductList />
          </Suspense>
        ),
      },
      {
        path: ':asin',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ProductDetail />
          </Suspense>
        ),
      },
      {
        path: 'details/:asin',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ProductDetailsPage />
          </Suspense>
        ),
      },
      {
        path: 'categories',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <CategoriesPage />
          </Suspense>
        ),
      },
      {
        path: 'categories/:slug',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <CategoryProductsPage />
          </Suspense>
        ),
      },
      {
        path: 'brands',
        element: <Brands />,
      },
      {
        path: 'brands/:id',
        element: <BrandProducts />,
      },
    ],
  },
  // Redirect old product routes
  {
    path: 'product/:id',
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <ProductDetailRedirect />
      </Suspense>
    ),
  },
  {
    path: 'product/:asin',
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <ProductDetail />
      </Suspense>
    ),
  },
  // Shopping flow
  {
    path: 'cart',
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <CartPage />
      </Suspense>
    ),
  },
  {
    path: 'checkout',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <CheckoutPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: 'order-success/:id',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <OrderSuccessPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: 'orders',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <OrdersListPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: 'orders/:id',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <OrderDetailPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: 'wishlist',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <WishlistPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: 'addresses',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <AddressesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];
