import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Home } from "@/pages/public/Home";
import { ProductList } from "@/pages/public/ProductList";
import { ProductDetail } from "@/pages/public/ProductDetail";
import { About } from "@/pages/public/About";
import { Contact } from "@/pages/public/Contact";
import { Help } from "@/pages/public/Help";
import { Login } from "@/pages/auth/Login";
import { Signup } from "@/pages/auth/Signup";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";
import { NotFound } from "@/pages/errors/NotFound";
import { ServerError } from "@/pages/errors/ServerError";

// Placeholder components for customer pages
function Cart() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Cart Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 2</p>
    </div>
  );
}
function Checkout() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Checkout Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 2</p>
    </div>
  );
}
function OrderSuccess() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Order Success Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 2</p>
    </div>
  );
}
function Profile() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Profile Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 3</p>
    </div>
  );
}
function Orders() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Orders Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 2</p>
    </div>
  );
}
function OrderDetail() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Order Detail Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 2</p>
    </div>
  );
}
function Wishlist() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Wishlist Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 3</p>
    </div>
  );
}
function Addresses() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Addresses Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 3</p>
    </div>
  );
}
function Reviews() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Reviews Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 5</p>
    </div>
  );
}
function Messages() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Messages Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 4</p>
    </div>
  );
}
function Conversation() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Conversation Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 4</p>
    </div>
  );
}
function Notifications() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Notifications Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 4</p>
    </div>
  );
}
function Settings() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Settings Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon in Phase 5</p>
    </div>
  );
}
function Categories() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Categories Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
    </div>
  );
}
function CategoryProducts() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Category Products Page</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
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
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="products" element={<ProductList />} />
            <Route path="product/:asin" element={<ProductDetail />} />
            <Route path="categories" element={<Categories />} />
            <Route path="category/:id" element={<CategoryProducts />} />
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
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-success/:id" element={<OrderSuccess />} />
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:id" element={<Conversation />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />

            {/* Error Routes */}
            <Route path="error" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
