import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ServicesGateway } from "@/pages/public/ServicesGateway";
import { ProductList } from "@/pages/public/ProductList";
import { ProductDetail } from "@/pages/public/ProductDetail";
import ProductDetailsPage from "@/pages/public/ProductDetailsPage";
import { About } from "@/pages/public/About";
import { Contact } from "@/pages/public/Contact";
import { Help } from "@/pages/public/Help";
import { Login } from "@/pages/auth/Login";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";
import { NotFound } from "@/pages/errors/NotFound";
import { ServerError } from "@/pages/errors/ServerError";
import { ServicesSignup } from "@/pages/auth/ServicesSignup";
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
import { ServicesInbox } from "@/features/services/components/ServicesInbox";
import { ServicesChat } from "@/features/services/components/ServicesChat";
import { ServicesMessagingLayout } from "@/features/services/components/ServicesMessagingLayout";
import { useTranslation } from "react-i18next";
import { VercelAnalytics } from "@/components/VercelAnalytics";

// Services Module
import { ServicesHome } from "@/features/services/pages/ServicesHome";
import { ServiceCategoryPage } from "@/features/services/pages/ServiceCategoryPage";
import { ServiceDetailPage } from "@/features/services/pages/ServiceDetailPage";
import { ProviderProfilePage } from "@/features/services/pages/ProviderProfilePage";
import { CreateProviderProfile } from "@/features/services/pages/CreateProviderProfile";
import { CreateServiceListing } from "@/features/services/pages/CreateServiceListing";
import { ServiceOnboardingWizard } from "@/features/services/components/ServiceOnboardingWizard";
import { DashboardLayout } from "@/features/services/dashboard/components/layout/DashboardLayout";
import { DashboardHome } from "@/features/services/dashboard/pages/DashboardHome";
import { BookingsPage } from "@/features/services/dashboard/pages/BookingsPage";
import { ServiceBookingPage } from "@/features/services/bookings/pages/ServiceBookingPage";

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
  const { t } = useTranslation();
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <VercelAnalytics />
        <ErrorBoundary
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">{t("common.error")}</h1>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded"
                >
                  {t("common.refreshPage")}
                </button>
              </div>
            </div>
          }
        >
          <Routes>
            {/* Auth Routes (Full Page - No Layout) */}
            <Route path="/signup" element={<ServicesSignup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/" element={<Layout />}>
              {/* Default - Services Gateway */}
              <Route index element={<ServicesGateway />} />

              {/* Public Routes */}
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

              {/* Services Routes - Main Focus (Wrapped in ServicesLayout) */}
              <Route path="services" element={<ServicesHome />}>
                <Route index element={<ServicesHome />} />
                <Route path=":categorySlug" element={<ServiceCategoryPage />} />
                <Route
                  path="listing/:listingId"
                  element={<ServiceDetailPage />}
                />
                <Route
                  path="listing/:listingId/book"
                  element={<ServiceBookingPage />}
                />
                <Route
                  path="provider/:providerId"
                  element={<ProviderProfilePage />}
                />
              </Route>

              {/* Services Dashboard Routes (Separate Layout) */}
              <Route path="services/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route
                  path="projects"
                  element={
                    <div className="p-4">Projects Page (Coming Soon)</div>
                  }
                />
                <Route
                  path="listings"
                  element={
                    <div className="p-4">Listings Page (Coming Soon)</div>
                  }
                />
                <Route
                  path="finance"
                  element={
                    <div className="p-4">Finance Page (Coming Soon)</div>
                  }
                />
                <Route
                  path="clients"
                  element={
                    <div className="p-4">Clients Page (Coming Soon)</div>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <div className="p-4">Settings Page (Coming Soon)</div>
                  }
                />
              </Route>
              <Route
                path="services/dashboard/create-profile"
                element={<CreateProviderProfile />}
              />
              <Route
                path="services/dashboard/create-listing"
                element={<CreateServiceListing />}
              />
              <Route
                path="services/dashboard/onboard"
                element={<ServiceOnboardingWizard />}
              />
              <Route
                path="services/onboarding"
                element={<ServiceOnboardingWizard />}
              />

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
              <Route element={<ServicesMessagingLayout />}>
                <Route path="services/messages" element={<ServicesInbox />} />
                <Route
                  path="services/messages/:conversationId"
                  element={<ServicesChat />}
                />
              </Route>
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
