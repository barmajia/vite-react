import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { useTranslation } from "react-i18next";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// ==================== Layouts ====================
import { DashboardLayout } from "@/features/services/dashboard/components/layout/DashboardLayout";
import HealthLayout from "@/features/health/layouts/HealthLayout";

// ==================== Auth Routes ====================
import { Login } from "@/pages/auth/Login";
import { SignupPage } from "@/pages/signup/SignupPage";
import { MiddlemanSignup } from "@/pages/middleman/MiddlemanSignup";
import { AuthCallback } from "@/pages/auth/AuthCallback";

// ==================== Public Pages ====================
import { ServicesGateway } from "@/pages/public/ServicesGateway";
import { ProductList } from "@/pages/public/ProductList";
import { ProductDetail } from "@/pages/public/ProductDetail";
import ProductDetailsPage from "@/pages/public/ProductDetailsPage";
import { ProductDetailRedirect } from "@/pages/public/ProductDetailRedirect";
import { About } from "@/pages/public/About";
import { Contact } from "@/pages/public/Contact";
import { Help } from "@/pages/public/Help";
import { CategoriesPage } from "@/features/categories/pages/CategoriesPage";
import { CategoryProductsPage } from "@/features/categories/pages/CategoryProductsPage";

// ==================== Products & E-commerce ====================
import { CartPage } from "@/features/cart/pages/CartPage";
import { CheckoutPage } from "@/features/checkout/pages/CheckoutPage";
import { OrderSuccessPage } from "@/features/orders/pages/OrderSuccessPage";
import { OrdersListPage } from "@/features/orders/pages/OrdersListPage";
import { OrderDetailPage } from "@/features/orders/pages/OrderDetailPage";
import { AddressesPage } from "@/features/addresses/pages/AddressesPage";
import { WishlistPage } from "@/features/wishlist/pages/WishlistPage";

// ==================== User Profile & Settings ====================
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { PublicProfilePage } from "@/pages/profile/PublicProfilePage";
import { EditProfile } from "@/pages/profile/EditProfile";
import { ProfileDirectoryPage } from "@/pages/profile/ProfileDirectoryPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import { FeedPage } from "@/components/feed/FeedPage";

// ==================== Messages (Unified Chat System) ====================

// ==================== Services ====================
import { ServicesHome } from "@/features/services/pages/ServicesHome";
import { ServiceCategoryPage } from "@/features/services/pages/ServiceCategoryPage";
import { ServiceDetailPage } from "@/features/services/pages/ServiceDetailPage";
import { ProviderProfilePage } from "@/features/services/pages/ProviderProfilePage";
import { ServiceBookingPage } from "@/features/services/bookings/pages/ServiceBookingPage";
import { CreateProviderProfile } from "@/features/services/pages/CreateProviderProfile";
import { CreateServiceListing } from "@/features/services/pages/CreateServiceListing";
import { ServiceOnboardingWizard } from "@/features/services/components/ServiceOnboardingWizard";
import { DashboardHome } from "@/features/services/dashboard/pages/DashboardHome";
import { BookingsPage } from "@/features/services/dashboard/pages/BookingsPage";

// ==================== Healthcare ====================
import HealthLanding from "@/features/health/pages/HealthLanding";
import DoctorList from "@/features/health/pages/DoctorList";
import DoctorSignup from "@/features/health/pages/DoctorSignup";
import DoctorPendingApproval from "@/features/health/pages/DoctorPendingApproval";
import BookingPage from "@/features/health/pages/BookingPage";
import PatientDashboard from "@/features/health/pages/PatientDashboard";
import DoctorDashboard from "@/features/health/pages/DoctorDashboard";
import AdminVerification from "@/features/health/pages/AdminVerification";
import ConsultationRoom from "@/features/health/pages/ConsultationRoom";
import PharmacyList from "@/features/health/pages/PharmacyList";
import { ConsentForm } from "@/features/health/pages/ConsentForm";
import { DataExport } from "@/features/health/pages/DataExport";
import { AuditLogs } from "@/features/health/pages/AuditLogs";

// ==================== Factory ====================
import { FactoryDashboardPage } from "@/pages/factory/FactoryDashboardPage";
import { FactoryProductionPage } from "@/pages/factory/FactoryProductionPage";
import { FactoryQuotesPage } from "@/pages/factory/FactoryQuotesPage";
import { FactoryConnectionsPage } from "@/pages/factory/FactoryConnectionsPage";
import { FactoryStartChat } from "@/pages/factory/FactoryStartChat";

// ==================== Admin ====================
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminProfileEditor } from "@/pages/admin/AdminProfileEditor";
import { AdminUsersDashboard } from "@/pages/admin/AdminUsersDashboard";
import { AdminUserDetail } from "@/pages/admin/AdminUserDetail";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminProducts } from "@/pages/admin/AdminProducts";
import { AdminProductEdit } from "@/features/profile/components/adminproductedit";
import { AdminProductNew } from "@/features/profile/components/AdminProductNew";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminFactories } from "@/pages/admin/AdminFactories";
import { AdminMiddlemen } from "@/pages/admin/AdminMiddlemen";
import { AdminConversations } from "@/pages/admin/AdminConversations";
import { AdminDelivery } from "@/pages/admin/AdminDelivery";
import { AdminSettings } from "@/pages/admin/AdminSettings";

// ==================== Middleman ====================
import { MiddlemanDashboard } from "@/pages/middleman/MiddlemanDashboard";
import { MiddlemanDeals } from "@/pages/middleman/MiddlemanDeals";
import { MiddlemanCreateDeal } from "@/pages/middleman/MiddlemanCreateDeal";
import { MiddlemanDealDetails } from "@/pages/middleman/MiddlemanDealDetails";
import { MiddlemanOrders } from "@/pages/middleman/MiddlemanOrders";
import { MiddlemanAnalytics } from "@/pages/middleman/MiddlemanAnalytics";
import { MiddlemanConnections } from "@/pages/middleman/MiddlemanConnections";
import { MiddlemanCommission } from "@/pages/middleman/MiddlemanCommission";
import { MiddlemanProfile } from "@/pages/middleman/MiddlemanProfile";
import { MiddlemanSettings } from "@/pages/middleman/MiddlemanSettings";

// ==================== Wallet ====================
import { WalletDashboard } from "@/pages/wallet/WalletDashboard";
import { TransactionHistory } from "@/pages/wallet/TransactionHistory";
import { PayoutRequest } from "@/pages/wallet/PayoutRequest";
import { PayoutHistory } from "@/pages/wallet/PayoutHistory";

// ==================== Delivery ====================
import { DeliveryDashboard } from "@/pages/delivery/DeliveryDashboard";

// ==================== Customer ====================
import { OrderTracking } from "@/pages/customer/OrderTracking";

// ==================== Seller ====================
import { CommissionReport } from "@/pages/seller/CommissionReport";

// ==================== Error Pages ====================
import { NotFound } from "@/pages/errors/NotFound";
import { ServerError } from "@/pages/errors/ServerError";
import { Chat } from "./chats/chat";

// ==================== Placeholder Components ====================
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

// ==================== Coming Soon Placeholder ====================
function ComingSoon({ title = "Page" }: { title?: string }) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
    </div>
  );
}

function App() {
  const { t } = useTranslation();

  return (
    <ThemeProvider>
      <AuthProvider>
        <PreferencesProvider>
          <CurrencyProvider>
            <Toaster position="top-right" richColors />
            <ErrorBoundary
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">
                      {t("common.error")}
                    </h1>
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
                {/* ==================== AUTH ROUTES (No Layout) ==================== */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/signup/middleman" element={<MiddlemanSignup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* ==================== MAIN LAYOUT ROUTES ==================== */}
                <Route path="/" element={<Layout />}>
                  {/* Home */}
                  <Route index element={<ServicesGateway />} />

                  {/* ==================== PRODUCTS VERTICAL ==================== */}
                  <Route path="products">
                    <Route index element={<ProductList />} />
                    <Route path=":asin" element={<ProductDetail />} />
                    <Route
                      path="details/:asin"
                      element={<ProductDetailsPage />}
                    />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route
                      path="categories/:slug"
                      element={<CategoryProductsPage />}
                    />
                    <Route path="brands" element={<Brands />} />
                    <Route path="brands/:id" element={<BrandProducts />} />
                  </Route>

                  {/* Redirect /product/:id to /products/:asin */}
                  <Route
                    path="product/:id"
                    element={<ProductDetailRedirect />}
                  />
                  {/* Alias: /product/:asin (singular) also works */}
                  <Route path="product/:asin" element={<ProductDetail />} />

                  {/* Shopping Flow */}
                  <Route path="cart" element={<CartPage />} />
                  <Route
                    path="checkout"
                    element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="order-success/:id"
                    element={
                      <ProtectedRoute>
                        <OrderSuccessPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="orders"
                    element={
                      <ProtectedRoute>
                        <OrdersListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="wishlist"
                    element={
                      <ProtectedRoute>
                        <WishlistPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="addresses"
                    element={
                      <ProtectedRoute>
                        <AddressesPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== SERVICES VERTICAL ==================== */}
                  <Route path="services">
                    <Route index element={<ServicesHome />} />
                    <Route
                      path=":categorySlug"
                      element={<ServiceCategoryPage />}
                    />
                    <Route
                      path=":categorySlug/:subcategorySlug"
                      element={<ServiceCategoryPage />}
                    />
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

                    {/* Services Dashboard */}
                    <Route
                      path="dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<DashboardHome />} />
                      <Route path="bookings" element={<BookingsPage />} />
                      <Route
                        path="projects"
                        element={<ComingSoon title="Projects" />}
                      />
                      <Route
                        path="listings"
                        element={<ComingSoon title="Listings" />}
                      />
                      <Route
                        path="finance"
                        element={<ComingSoon title="Finance" />}
                      />
                      <Route
                        path="clients"
                        element={<ComingSoon title="Clients" />}
                      />
                      <Route
                        path="settings"
                        element={<ComingSoon title="Settings" />}
                      />
                    </Route>
                    <Route
                      path="dashboard/create-profile"
                      element={<CreateProviderProfile />}
                    />
                    <Route
                      path="dashboard/create-listing"
                      element={<CreateServiceListing />}
                    />
                    <Route
                      path="dashboard/onboard"
                      element={<ServiceOnboardingWizard />}
                    />
                    <Route
                      path="onboarding"
                      element={<ServiceOnboardingWizard />}
                    />

                    {/* ==================== HEALTHCARE SUB-VERTICAL ==================== */}
                    <Route path="health" element={<HealthLayout />}>
                      <Route index element={<HealthLanding />} />
                      <Route path="doctors" element={<DoctorList />} />
                      <Route path="doctor/signup" element={<DoctorSignup />} />
                      <Route
                        path="doctor/pending-approval"
                        element={<DoctorPendingApproval />}
                      />
                      <Route path="book/:id" element={<BookingPage />} />
                      <Route
                        path="patient/dashboard"
                        element={<PatientDashboard />}
                      />
                      <Route
                        path="doctor/dashboard"
                        element={<DoctorDashboard />}
                      />
                      <Route
                        path="admin/verify"
                        element={<AdminVerification />}
                      />
                      <Route
                        path="consult/:id"
                        element={<ConsultationRoom />}
                      />
                      <Route path="pharmacies" element={<PharmacyList />} />

                      {/* Healthcare Compliance */}
                      <Route
                        path="patient/consent/:appointmentId"
                        element={<ConsentForm />}
                      />
                      <Route
                        path="patient/data-export"
                        element={<DataExport />}
                      />
                    </Route>
                  </Route>

                  {/* ==================== MIDDLEMAN VERTICAL ==================== */}
                  <Route path="middleman">
                    <Route index element={<MiddlemanDashboard />} />
                    <Route path="dashboard" element={<MiddlemanDashboard />} />
                    <Route path="deals" element={<MiddlemanDeals />} />
                    <Route path="deals/new" element={<MiddlemanCreateDeal />} />
                    <Route
                      path="deals/:dealId"
                      element={<MiddlemanDealDetails />}
                    />
                    <Route path="orders" element={<MiddlemanOrders />} />
                    <Route path="analytics" element={<MiddlemanAnalytics />} />
                    <Route
                      path="connections"
                      element={<MiddlemanConnections />}
                    />
                    <Route
                      path="commission"
                      element={<MiddlemanCommission />}
                    />
                    <Route path="profile" element={<MiddlemanProfile />} />
                    <Route path="settings" element={<MiddlemanSettings />} />
                  </Route>

                  {/* ==================== WALLET VERTICAL ==================== */}
                  <Route
                    path="wallet"
                    element={
                      <ProtectedRoute>
                        <WalletDashboard />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<WalletDashboard />} />
                    <Route
                      path="transactions"
                      element={<TransactionHistory />}
                    />
                    <Route path="payouts" element={<PayoutRequest />} />
                    <Route path="payout-history" element={<PayoutHistory />} />
                  </Route>

                  {/* ==================== DELIVERY VERTICAL ==================== */}
                  <Route path="delivery">
                    <Route
                      index
                      element={
                        <ProtectedRoute
                          allowedAccountTypes={["delivery_driver"]}
                        >
                          <DeliveryDashboard />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* ==================== CUSTOMER VERTICAL ==================== */}
                  <Route path="customer">
                    <Route
                      path="orders/tracking"
                      element={
                        <ProtectedRoute>
                          <OrderTracking />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* ==================== SELLER VERTICAL ==================== */}
                  <Route path="seller">
                    <Route
                      path="commission"
                      element={
                        <ProtectedRoute allowedAccountTypes={["seller"]}>
                          <CommissionReport />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* ==================== FACTORY VERTICAL ==================== */}
                  <Route path="factory">
                    <Route index element={<FactoryDashboardPage />} />
                    <Route
                      path="production"
                      element={<FactoryProductionPage />}
                    />
                    <Route path="quotes" element={<FactoryQuotesPage />} />
                    <Route
                      path="connections"
                      element={<FactoryConnectionsPage />}
                    />
                    <Route
                      path="start-chat"
                      element={
                        <ProtectedRoute>
                          <FactoryStartChat />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* ==================== PROFILE & SOCIAL (Cross-Vertical) ==================== */}
                  <Route path="profile">
                    <Route index element={<ProfilePage />} />
                    <Route path=":userId" element={<PublicProfilePage />} />
                    <Route path=":userId/edit" element={<EditProfile />} />
                  </Route>
                  <Route path="profiles" element={<ProfileDirectoryPage />} />
                  <Route path="feed" element={<FeedPage />} />
                  <Route path="reviews" element={<Reviews />} />

                  {/* ==================== SETTINGS & NOTIFICATIONS ==================== */}
                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== INFO PAGES ==================== */}
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="help" element={<Help />} />
                </Route>

                {/* ==================== ADMIN ROUTES (No Layout - Full Screen) ==================== */}
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsersDashboard />} />
                  <Route path="users/:userId" element={<AdminUserDetail />} />
                  <Route
                    path="users/:userId/edit"
                    element={<AdminProfileEditor />}
                  />
                  <Route path="products" element={<AdminProducts />} />
                  <Route
                    path="products/:id/edit"
                    element={<AdminProductEdit />}
                  />
                  <Route path="products/new" element={<AdminProductNew />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="factories" element={<AdminFactories />} />
                  <Route path="middlemen" element={<AdminMiddlemen />} />
                  <Route
                    path="conversations"
                    element={<AdminConversations />}
                  />
                  <Route path="delivery" element={<AdminDelivery />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route
                    path="health"
                    element={<ComingSoon title="Health Management" />}
                  />
                  <Route
                    path="pharmacy"
                    element={<ComingSoon title="Pharmacy Management" />}
                  />
                  <Route
                    path="payments"
                    element={<ComingSoon title="Payment Management" />}
                  />
                  <Route
                    path="analytics"
                    element={<ComingSoon title="Analytics" />}
                  />
                  <Route
                    path="settings"
                    element={<ComingSoon title="Admin Settings" />}
                  />
                </Route>
                <Route path="Chat" element={<Chat />}></Route>

                {/* ==================== ERROR ROUTES ==================== */}
                <Route path="error" element={<ServerError />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
            <CookieConsentBanner />
          </CurrencyProvider>
        </PreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
