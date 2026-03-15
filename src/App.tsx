import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Home } from "@/pages/public/Home";
import { ProductList } from "@/pages/public/ProductList";
import { ProductDetail } from "@/pages/public/ProductDetail";
import ProductDetailsPage from "@/pages/public/ProductDetailsPage";
import { About } from "@/pages/public/About";
import { Contact } from "@/pages/public/Contact";
import { Help } from "@/pages/public/Help";
import { Login } from "@/pages/auth/Login";
import { Signup } from "@/pages/auth/Signup";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";
import { NotFound } from "@/pages/errors/NotFound";
import { ServerError } from "@/pages/errors/ServerError";
import { CategoriesPage } from "@/features/categories/pages/CategoriesPage";
import { CategoryProductsPage } from "@/features/categories/pages/CategoryProductsPage";
import { CartPage } from "@/features/cart/pages/CartPage";
import { CheckoutPage } from "@/features/checkout/pages/CheckoutPage";
import { OrderSuccessPage } from "@/features/orders/pages/OrderSuccessPage";
import { OrdersListPage } from "@/features/orders/pages/OrdersListPage";
import { OrderDetailPage } from "@/features/orders/pages/OrderDetailPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { AddressesPage } from "@/features/addresses/pages/AddressesPage";
import { WishlistPage } from "@/features/wishlist/pages/WishlistPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { Inbox } from "@/pages/messaging/Inbox";
import { Chat } from "@/pages/messaging/Chat";

// Factory pages
import { FactoryDashboardPage } from "@/pages/factory/FactoryDashboardPage";
import { FactoryProductionPage } from "@/pages/factory/FactoryProductionPage";
import { FactoryQuotesPage } from "@/pages/factory/FactoryQuotesPage";
import { FactoryConnectionsPage } from "@/pages/factory/FactoryConnectionsPage";

// Placeholder components for customer pages
function Reviews() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Reviews Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 5</p>
    </div>
  );
}

function Brands() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Brands Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
    </div>
  );
}

function BrandProducts() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Brand Products Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <ErrorBoundary
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">
                  Something went wrong
                </h1>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Routes */}
              <Route index element={<Home />} />
              <Route path="products" element={<ProductList />} />
              <Route path="product/:asin" element={<ProductDetail />} />
              <Route
                path="product-details/:asin"
                element={<ProductDetailsPage />}
              />
              <Route path="categories" element={<CategoriesPage />} />
              <Route
                path="categories/:slug"
                element={<CategoryProductsPage />}
              />
              <Route path="brands" element={<Brands />} />
              <Route path="brand/:id" element={<BrandProducts />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="help" element={<Help />} />

              {/* Auth Routes */}
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />

              {/* Customer Routes (Protected) */}
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order-success/:id" element={<OrderSuccessPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="orders" element={<OrdersListPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="messages" element={<Inbox />} />
              <Route path="messages/:conversationId" element={<Chat />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />

              {/* Factory Routes (Protected) */}
              <Route path="factory" element={<FactoryDashboardPage />} />
              <Route
                path="factory/production"
                element={<FactoryProductionPage />}
              />
              <Route path="factory/quotes" element={<FactoryQuotesPage />} />
              <Route
                path="factory/connections"
                element={<FactoryConnectionsPage />}
              />

              {/* Error Routes */}
              <Route path="error" element={<ServerError />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
