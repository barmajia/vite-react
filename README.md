# Aurora E-commerce Platform

> A modern, production-ready full-stack B2B2C e-commerce platform built with React, Vite, TypeScript, Tailwind CSS, and Supabase. Features a minimalist, high-contrast luxury tech aesthetic with real-time messaging, factory management, services marketplace, and geolocation capabilities.

**Version:** 2.0.0  
**Status:** ✅ Production Ready (Phases 1-4 Complete + Factory Features)  
**Last Updated:** March 16, 2026  
**Developer:** Youssef

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Routes & Pages](#-routes--pages)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Build & Deployment](#-build--deployment)
- [Security](#-security)
- [Design System](#-design-system)
- [API Reference](#-api-reference)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Aurora is a comprehensive e-commerce platform that supports multiple business models:

1. **B2C E-commerce** - Traditional retail with products, cart, checkout, and orders
2. **B2B Factory** - Factory dashboard, production tracking, quote requests, and seller connections
3. **Services Marketplace** - Service providers can list services, manage bookings, and connect with clients

The platform features real-time messaging between buyers and sellers, geolocation for finding nearby sellers, dark/light theme support, and a production-ready deployment pipeline optimized for Vercel.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (PostgreSQL 17)
- Modern web browser

### Installation

```bash
# Clone the repository
cd vite-react

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your Supabase credentials
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_APP_URL=http://localhost:5173

# Start development server
npm run dev
```

The application will run at `http://localhost:5173`

---

## ✨ Features

### 🔐 Authentication System

- Email/password login & signup
- Password reset flow with email recovery
- Protected routes with authentication guards
- Session management with auto-refresh
- Role-based access (buyer, seller, factory, service provider)
- Onboarding wizard for new users

### 🛍️ Product Management

- Product listing with infinite scroll pagination
- Product details with multi-image gallery
- Full-text search using PostgreSQL `tsvector`
- Category-based browsing with hierarchy
- Advanced filtering (category, brand, price, rating, stock)
- Product sorting (price, name, date, popularity)
- Reviews and ratings with star display
- Brand pages (placeholder for future implementation)

### 🛒 Shopping Cart & Checkout

- Persistent cart with localStorage fallback
- Real-time cart count badge in header
- Add/remove items with quantity updates
- Stock validation and availability checks
- Complete checkout flow with address selection
- Multiple shipping address support
- Order creation with status tracking

### 📦 Order Management

- Order history with detailed views
- Order status tracking: `pending → confirmed → processing → shipped → delivered`
- Payment status tracking: `pending`, `paid`, `failed`, `refunded`
- Order timeline visualization
- Email notifications (via Supabase Edge Functions)

### 💬 Real-Time Messaging

- Buyer-seller conversation threads
- Live message delivery via Supabase Realtime
- Typing indicators and read receipts (✓✓)
- Unread message count badges
- Last message preview with timestamps
- Conversation inbox with filtering

### 🏭 Factory Features (B2B)

#### Factory Dashboard

- Real-time KPI analytics (revenue, orders, ratings)
- Revenue and order charts with time periods
- Growth percentage calculations
- Product inventory overview

#### Production Order Tracking

- Visual production pipeline with 7 stages
- Status updates with notes and timestamps
- Production logs and history
- Order filtering by production status
- Timeline tracking for each stage

#### Quote Request System

- Quote request inbox from buyers
- Price quotation with expiry dates
- Accept/Reject workflow
- Auto-expiry with pg_cron scheduled jobs
- Quote history and status tracking

#### Factory Connections

- Partnership requests from sellers
- Accept/Reject connection workflow
- Connected sellers management
- B2B relationship building

### 🧰 Services Marketplace

- Services gateway homepage
- Service category browsing
- Service provider profiles
- Service listings with booking
- Provider dashboard for managing services
- Create provider profile wizard
- Create service listing wizard
- Service bookings and appointments

### 🌍 Geolocation

- Browser-based location detection
- Find nearby sellers by distance
- Automatic distance calculations (Haversine formula)
- Auto-save location to user profile
- Manual coordinate input support
- Location-based product filtering

### 👤 User Features

- Profile management with avatar upload (Supabase Storage)
- Multiple shipping address management
- Default address selection
- Wishlist functionality
- In-app notifications system
- Comprehensive settings pages:
  - Profile settings
  - Account settings
  - Business settings (for sellers)
  - Privacy settings
  - Security settings (password change)
  - Location settings

### 🎨 UI/UX Features

- Dark/Light theme toggle (persisted in localStorage)
- Responsive design (mobile-first approach)
- Loading states with skeleton loaders
- Toast notifications (Sonner)
- Error boundaries for graceful failures
- Accessible components (ARIA labels, keyboard navigation)
- 19+ Shadcn/UI components
- Custom layout components (Header, Footer, MobileNav)
- 404 and error pages

---

## 🛠️ Tech Stack

### Frontend

| Technology                | Version | Purpose                              |
| ------------------------- | ------- | ------------------------------------ |
| **React**                 | 18.3.1  | UI framework                         |
| **TypeScript**            | 5.5.3   | Type safety                          |
| **Vite**                  | 5.4.1   | Build tool & dev server              |
| **Tailwind CSS**          | 3.4.1   | Utility-first CSS with CSS variables |
| **Shadcn/UI**             | -       | 19+ Radix UI primitives              |
| **Zustand**               | 5.0.11  | Client state management              |
| **TanStack Query**        | 5.90.21 | Server state management & caching    |
| **React Router DOM**      | 7.13.1  | Client-side routing                  |
| **Sonner**                | 2.0.7   | Toast notifications                  |
| **Lucide React**          | 0.577.0 | Icon library                         |
| **Recharts**              | 3.8.0   | Data visualization                   |
| **Vercel Analytics**      | 1.6.1   | Performance monitoring               |
| **Vercel Speed Insights** | 1.3.1   | Core Web Vitals                      |

### Backend (Supabase)

| Technology                   | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| **PostgreSQL 17**            | Primary relational database                      |
| **Supabase Auth**            | JWT authentication (email/password, OAuth ready) |
| **Supabase Realtime**        | Live updates for messaging & notifications       |
| **Supabase Storage**         | Product images, user avatars, documents          |
| **Row Level Security (RLS)** | Data protection at database level                |
| **Supabase Edge Functions**  | Serverless functions (optional)                  |

### PostgreSQL Extensions

- `pg_cron` - Scheduled jobs (quote expiry, analytics snapshots)
- `pg_graphql` - GraphQL API generation
- `pg_stat_statements` - Query performance monitoring
- `pgmq` - Message queue for async tasks
- `hypopg` - Hypothetical index analysis

---

## 📁 Project Structure

```
vite-react/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx              # Main navigation header
│   │   │   ├── Footer.tsx              # Site footer
│   │   │   ├── MobileNav.tsx           # Mobile navigation drawer
│   │   │   └── Layout.tsx              # Main layout wrapper
│   │   ├── products/
│   │   │   ├── ProductCard.tsx         # Product grid item
│   │   │   ├── ProductGrid.tsx         # Product grid container
│   │   │   ├── ProductGallery.tsx      # Image carousel
│   │   │   └── StarRating.tsx          # Star rating display
│   │   ├── shared/
│   │   │   ├── LoadingSpinner.tsx      # Loading indicator
│   │   │   ├── EmptyState.tsx          # Empty state component
│   │   │   └── Pagination.tsx          # Pagination controls
│   │   ├── ui/                         # Shadcn/UI components (19)
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── toast.tsx
│   │   ├── ErrorBoundary.tsx           # React error boundary
│   │   ├── ToastProvider.tsx           # Toast notification provider
│   │   └── VercelAnalytics.tsx         # Vercel analytics component
│   │
│   ├── features/                       # Feature-based modules
│   │   ├── addresses/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── cart/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   ├── categories/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── checkout/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── factory/                    # B2B Factory Features
│   │   │   ├── components/
│   │   │   │   ├── ConnectionRequestsList.tsx
│   │   │   │   ├── FactoryDashboard.tsx
│   │   │   │   ├── ProductionPipeline.tsx
│   │   │   │   ├── ProductionPipelineList.tsx
│   │   │   │   ├── QuoteRequestsList.tsx
│   │   │   │   ├── SalesChart.tsx
│   │   │   │   └── StatCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useFactoryAnalytics.ts
│   │   │   │   ├── useFactoryConnections.ts
│   │   │   │   ├── useProductionOrders.ts
│   │   │   │   └── useQuoteRequests.ts
│   │   │   ├── types/
│   │   │   │   └── factory.ts
│   │   │   └── index.ts
│   │   ├── messaging/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── notifications/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── orders/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── products/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── profile/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── services/                   # Services Marketplace
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   ├── settings/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   └── wishlist/
│   │       ├── components/
│   │       └── pages/
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useAuth.tsx                 # Authentication context
│   │   ├── useCart.ts                  # Cart state (Zustand)
│   │   ├── useProducts.ts              # Products (TanStack Query)
│   │   ├── useTheme.tsx                # Theme toggle
│   │   ├── useGeolocation.ts           # Browser geolocation
│   │   ├── useFullProfile.ts           # Full profile data
│   │   ├── useNotifications.ts         # Notifications
│   │   ├── useProfileLocation.ts       # User location
│   │   └── useSettings.ts              # Settings state
│   │
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client config
│   │   ├── supabase-realtime.ts        # Realtime subscriptions
│   │   └── utils.ts                    # Utilities (cn function)
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   ├── ServicesSignup.tsx
│   │   │   └── OnboardingWizard.tsx
│   │   ├── errors/
│   │   │   ├── NotFound.tsx
│   │   │   └── ServerError.tsx
│   │   ├── factory/
│   │   │   ├── FactoryDashboardPage.tsx
│   │   │   ├── FactoryProductionPage.tsx
│   │   │   ├── FactoryQuotesPage.tsx
│   │   │   └── FactoryConnectionsPage.tsx
│   │   ├── messaging/
│   │   │   ├── Inbox.tsx
│   │   │   └── Chat.tsx
│   │   └── public/
│   │       ├── Home.tsx
│   │       ├── ProductList.tsx
│   │       ├── ProductDetail.tsx
│   │       ├── ProductDetailsPage.tsx
│   │       ├── ServicesGateway.tsx
│   │       ├── About.tsx
│   │       ├── Contact.tsx
│   │       └── Help.tsx
│   │
│   ├── routes/                         # Route definitions
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── database.ts                 # TypeScript DB types
│   │   ├── env.d.ts                    # Environment variable types
│   │   └── profile.ts                  # Profile types
│   │
│   ├── utils/
│   │   └── avatarUtils.ts              # Avatar helpers
│   │
│   ├── assets/                         # Static assets
│   │   └── images/
│   │
│   ├── App.tsx                         # Main app with routing
│   ├── main.tsx                        # Entry point
│   └── index.css                       # Tailwind + theme CSS
│
├── supabase/
│   ├── config.toml                     # Supabase local config
│   └── snippets/                       # SQL snippets
│
├── public/
│   ├── grid.svg                        # Background grid pattern
│   └── vite.svg                        # Favicon
│
├── *.sql                               # Database migrations
├── package.json
├── vite.config.ts                      # Vite configuration
├── tailwind.config.js                  # Tailwind configuration
├── tsconfig.json                       # TypeScript configuration
├── eslint.config.js                    # ESLint configuration
├── vercel.json                         # Vercel SPA routing
├── .env.example                        # Environment variables template
├── .vercelignore                       # Vercel ignore file
└── Documentation files (*.md)
```

---

## 🗺️ Routes & Pages

### Public Routes

| Path                     | Component              | Description                             |
| ------------------------ | ---------------------- | --------------------------------------- |
| `/`                      | `ServicesGateway`      | Homepage with services/products gateway |
| `/products`              | `ProductList`          | Product listing with filters            |
| `/product/:asin`         | `ProductDetail`        | Product details (legacy)                |
| `/product-details/:asin` | `ProductDetailsPage`   | Product details page                    |
| `/categories`            | `CategoriesPage`       | Category listing                        |
| `/categories/:slug`      | `CategoryProductsPage` | Products by category                    |
| `/brands`                | `Brands`               | Brands listing (placeholder)            |
| `/brand/:id`             | `BrandProducts`        | Products by brand (placeholder)         |
| `/about`                 | `About`                | About page                              |
| `/contact`               | `Contact`              | Contact page                            |
| `/help`                  | `Help`                 | Help center                             |

### Services Routes

| Path                                 | Component               | Description               |
| ------------------------------------ | ----------------------- | ------------------------- |
| `/services`                          | `ServicesHome`          | Services marketplace home |
| `/services/:categorySlug`            | `ServiceCategoryPage`   | Services by category      |
| `/services/listing/:listingSlug`     | `ServiceDetailPage`     | Service details           |
| `/services/provider/:providerId`     | `ProviderProfilePage`   | Provider profile          |
| `/services/dashboard`                | `ProviderDashboardPage` | Provider dashboard        |
| `/services/dashboard/create-profile` | `CreateProviderProfile` | Create provider profile   |
| `/services/dashboard/create-listing` | `CreateServiceListing`  | Create service listing    |

### Factory Routes (Protected)

| Path                   | Component                | Description                 |
| ---------------------- | ------------------------ | --------------------------- |
| `/factory`             | `FactoryDashboardPage`   | Factory analytics dashboard |
| `/factory/production`  | `FactoryProductionPage`  | Production order tracking   |
| `/factory/quotes`      | `FactoryQuotesPage`      | Quote request management    |
| `/factory/connections` | `FactoryConnectionsPage` | Seller connections          |

### Protected User Routes

| Path                        | Component           | Description           |
| --------------------------- | ------------------- | --------------------- |
| `/cart`                     | `CartPage`          | Shopping cart         |
| `/checkout`                 | `CheckoutPage`      | Checkout flow         |
| `/order-success/:id`        | `OrderSuccessPage`  | Order confirmation    |
| `/profile`                  | `ProfilePage`       | User profile          |
| `/orders`                   | `OrdersListPage`    | Order history         |
| `/orders/:id`               | `OrderDetailPage`   | Order details         |
| `/wishlist`                 | `WishlistPage`      | Wishlist              |
| `/addresses`                | `AddressesPage`     | Address management    |
| `/reviews`                  | `Reviews`           | Reviews (placeholder) |
| `/messages`                 | `Inbox`             | Message inbox         |
| `/messages/:conversationId` | `Chat`              | Chat conversation     |
| `/notifications`            | `NotificationsPage` | Notifications         |
| `/settings`                 | `SettingsPage`      | User settings         |

### Auth Routes (Full Page)

| Path                   | Component          | Description         |
| ---------------------- | ------------------ | ------------------- |
| `/signup`              | `ServicesSignup`   | User registration   |
| `/login`               | `Login`            | User login          |
| `/services/onboarding` | `OnboardingWizard` | New user onboarding |
| `/forgot-password`     | `ForgotPassword`   | Password recovery   |
| `/reset-password`      | `ResetPassword`    | Password reset      |

### Error Routes

| Path     | Component     | Description       |
| -------- | ------------- | ----------------- |
| `/error` | `ServerError` | Server error page |
| `*`      | `NotFound`    | 404 page          |

---

## 🗄️ Database Schema

### Core Tables (16+)

| Table                         | Description               | Key Columns                                                                    |
| ----------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| `users`                       | User profiles             | `id`, `email`, `full_name`, `avatar`, `phone`, `latitude`, `longitude`, `role` |
| `sellers`                     | Seller profiles           | `id`, `user_id`, `business_name`, `description`, `rating`                      |
| `products`                    | Product catalog           | `id`, `seller_id`, `title`, `description`, `price`, `stock`, `search_vector`   |
| `cart`                        | Shopping cart items       | `id`, `user_id`, `product_id`, `quantity`                                      |
| `orders`                      | Order records             | `id`, `user_id`, `seller_id`, `status`, `payment_status`, `total`              |
| `order_items`                 | Order line items          | `id`, `order_id`, `product_id`, `quantity`, `price`                            |
| `shipping_addresses`          | User addresses            | `id`, `user_id`, `address_line1`, `city`, `is_default`                         |
| `reviews`                     | Product reviews           | `id`, `product_id`, `user_id`, `rating`, `comment`                             |
| `wishlist`                    | Wishlist items            | `id`, `user_id`, `product_id`                                                  |
| `conversations`               | Message threads           | `id`, `buyer_id`, `seller_id`, `last_message`, `updated_at`                    |
| `messages`                    | Chat messages             | `id`, `conversation_id`, `sender_id`, `content`, `is_read`                     |
| `notifications`               | In-app notifications      | `id`, `user_id`, `title`, `message`, `is_read`, `type`                         |
| `categories`                  | Product categories        | `id`, `name`, `slug`, `parent_id`, `icon`                                      |
| `factory_production_logs`     | Production tracking       | `id`, `order_id`, `status`, `notes`, `created_by`                              |
| `quote_requests`              | B2B quotes                | `id`, `factory_id`, `buyer_id`, `product_id`, `quantity`, `status`             |
| `factory_analytics_snapshots` | Cached KPIs               | `id`, `seller_id`, `snapshot_date`, `metrics`                                  |
| `factory_certifications`      | Factory certs             | `id`, `factory_id`, `certification_name`, `is_verified`                        |
| `service_providers`           | Service provider profiles | `id`, `user_id`, `business_name`, `rating`                                     |
| `service_listings`            | Service offerings         | `id`, `provider_id`, `title`, `price`, `category`                              |
| `service_bookings`            | Service appointments      | `id`, `listing_id`, `customer_id`, `date`, `status`                            |

### Database Functions

| Function                                            | Purpose                           |
| --------------------------------------------------- | --------------------------------- |
| `get_seller_kpis(seller_id, period_days)`           | Comprehensive seller analytics    |
| `get_production_orders(seller_id, status)`          | Fetch production orders by status |
| `update_production_status(order_id, status, notes)` | Update order status with logging  |
| `cleanup_expired_quotes()`                          | Auto-expire old quotes (pg_cron)  |
| `calculate_distance(lat1, lon1, lat2, lon2)`        | Distance calculation (km)         |
| `get_nearby_sellers(user_id, radius_km)`            | Find sellers within radius        |

### Database Types

```typescript
// Order Status
type order_status =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

// Payment Status
type payment_status = "pending" | "paid" | "failed" | "refunded";

// Production Status
type production_status =
  | "pending"
  | "in_production"
  | "quality_check"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled";

// Quote Status
type quote_status = "pending" | "quoted" | "accepted" | "rejected" | "expired";

// User Role
type user_role = "buyer" | "seller" | "factory" | "service_provider" | "admin";
```

---

## 🔐 Environment Variables

| Variable                 | Description                   | Example                   |
| ------------------------ | ----------------------------- | ------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL     | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbG...`               |
| `VITE_APP_URL`           | Application base URL          | `http://localhost:5173`   |

> ⚠️ **Important**: Never commit `.env` files to version control. Use `.env.example` as a template.

---

## 🛠️ Development

### Available Scripts

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Start development server (port 5173)    |
| `npm run build`   | Build for production (tsc + vite build) |
| `npm run preview` | Preview production build locally        |
| `npm run lint`    | Run ESLint code quality check           |

### Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Run database migrations
# Open Supabase SQL Editor and run:
# - all.sql (main schema)
# - factory-features-migration.sql (factory features)
# - factory-chat-deals-migration.sql (factory chat)

# 4. Start development server
npm run dev

# 5. Open browser
# http://localhost:5173
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: React hooks, refresh, and TypeScript rules
- **Prettier**: Integrated with ESLint
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Imports**: Absolute imports using `@/` alias

---

## 🚀 Build & Deployment

### Build Optimizations

The build is optimized with:

- **Code Splitting**: 7 chunks (vendor, ui, query, supabase, utils, state, icons)
- **ESBuild Minification**: Fastest minifier
- **Console Removal**: `console.log` and `debugger` removed in production
- **Tree Shaking**: Unused code eliminated
- **Target**: `esnext` for modern browsers

### Expected Build Metrics

| Metric       | Value      |
| ------------ | ---------- |
| Build Time   | ~4 seconds |
| Total Bundle | ~242 KB    |
| Gzipped      | ~56 KB     |
| Chunks       | 7-10       |

### Vercel Deployment

1. **Connect GitHub to Vercel**
   - Push code to GitHub
   - Import repository in Vercel dashboard

2. **Add Environment Variables**

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_URL=https://your-domain.vercel.app
   ```

3. **Deploy**

   ```bash
   git add .
   git commit -m "feat: your changes"
   git push
   ```

   Vercel auto-deploys on push to main branch.

4. **Configure Supabase Auth Redirects**
   - Add your Vercel URL to Supabase Auth > URL Configuration
   - Add redirect URLs: `https://your-domain.vercel.app/auth/callback`

### Build Commands

```bash
# Build locally
npm run build

# Preview build locally
npm run preview

# Analyze bundle (optional)
npm install -D vite-bundle-visualizer
npm run analyze
```

### Pre-Deploy Checklist

- [ ] Run database migrations in Supabase
- [ ] Verify all tables and functions created
- [ ] Test locally with `npm run dev`
- [ ] Build locally with `npm run build`
- [ ] Set environment variables in Vercel
- [ ] Configure Supabase auth redirects
- [ ] Deploy to Vercel
- [ ] Test production URL

---

## 🔐 Security

### Authentication & Authorization

- **JWT-based authentication** with auto-refresh tokens
- **Row Level Security (RLS)** on all database tables
- **Protected routes** require authentication
- **Role-based permissions** (buyer, seller, factory, service_provider, admin)
- **Session management** with secure cookies

### Data Protection

- **Input validation** on all forms
- **Strict TypeScript typing** for type safety
- **No exposed secrets** (environment variables only)
- **Secure headers** on API requests
- **CORS configuration** via Supabase

### Geolocation Privacy

- Browser permission required for location access
- User can deny/revoke permission anytime
- Location data only visible to user (RLS protected)
- Location used only for nearby seller features

### RLS Policies

All tables have RLS enabled with policies for:

- Users can only view/edit their own data
- Sellers can only manage their own products
- Factories can only view their own production data
- Buyers can only view their own orders and quotes
- Admins have full access for moderation

---

## 🎨 Design System

### Theme Colors

**Light Mode:**

- Background: `#FFFFFF` (White)
- Surface: `#F8F8F8` (Light Gray)
- Text: `#000000` (Black)
- Accent: `#1A1A1A` (Dark Gray)
- Primary: `#000000` (Black)
- Muted: `#6B7280` (Gray)

**Dark Mode:**

- Background: `#000000` (Pure Black)
- Surface: `#121212` (Dark Gray)
- Text: `#FFFFFF` (White)
- Accent: `#333333` (Gray)
- Primary: `#FFFFFF` (White)
- Muted: `#9CA3AF` (Light Gray)

### Typography

- **Font Family**: Inter (Google Fonts)
- **Font Sizes**: 12px - 48px (responsive scale)
- **Line Heights**: 1.5 (body), 1.2 (headings)
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing Scale

- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

### Component Library

19+ Shadcn/UI components available:

- Alert, Avatar, Badge, Button, Card
- Checkbox, Dialog, Dropdown Menu, Input, Label
- Progress, Scroll Area, Select, Separator, Skeleton
- Switch, Tabs, Textarea, Toast

### Responsive Breakpoints

| Breakpoint | Min Width | Target           |
| ---------- | --------- | ---------------- |
| `sm`       | 640px     | Mobile landscape |
| `md`       | 768px     | Tablets          |
| `lg`       | 1024px    | Laptops          |
| `xl`       | 1280px    | Desktops         |
| `2xl`      | 1536px    | Large screens    |

---

## 📚 API Reference

### Supabase Client Usage

```typescript
import { supabase } from "@/lib/supabase";

// Fetch products
const { data: products, error } = await supabase
  .from("products")
  .select("*")
  .eq("active", true)
  .limit(10);

// Call RPC function
const { data: kpis } = await supabase.rpc("get_seller_kpis", {
  p_seller_id: userId,
  p_period_days: 30,
});

// Subscribe to realtime
const channel = supabase
  .channel("messages")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
    },
    (payload) => {
      console.log("New message:", payload);
    },
  )
  .subscribe();
```

### Custom Hooks

```typescript
// Authentication
import { useAuth } from "@/hooks/useAuth";
const { user, isLoading, signIn, signUp, signOut } = useAuth();

// Cart
import { useCart } from "@/hooks/useCart";
const { items, count, addToCart, removeFromCart, updateQuantity } = useCart();

// Products
import { useProducts } from "@/hooks/useProducts";
const { products, isLoading, error, refetch } = useProducts(filters);

// Theme
import { useTheme } from "@/hooks/useTheme";
const { theme, toggleTheme } = useTheme();

// Geolocation
import { useGeolocation } from "@/hooks/useGeolocation";
const { location, isLoading, error, requestLocation } = useGeolocation();
```

---

## 📖 Documentation

| Document                                                       | Description                                  |
| -------------------------------------------------------------- | -------------------------------------------- |
| [DEPLOYMENT.md](./DEPLOYMENT.md)                               | Detailed deployment guide with optimizations |
| [FACTORY_IMPLEMENTATION.md](./FACTORY_IMPLEMENTATION.md)       | Factory features complete guide              |
| [GEOLOCATION_COMPLETE.md](./GEOLOCATION_COMPLETE.md)           | Geolocation feature documentation            |
| [LOCATION_FEATURE_COMPLETE.md](./LOCATION_FEATURE_COMPLETE.md) | Location settings guide                      |
| [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md)                   | Phase 1 completion report                    |
| [PHASE_4_COMPLETE.md](./PHASE_4_COMPLETE.md)                   | Phase 4 (Messaging) completion               |
| [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)                   | Comprehensive project analysis               |
| [ROUTES_REFERENCE.md](./ROUTES_REFERENCE.md)                   | Complete routes reference                    |
| [MESSAGING_FIX.md](./MESSAGING_FIX.md)                         | Messaging bug fix documentation              |

---

## 📈 Development Phases

| Phase                    | Status      | Description                                                           |
| ------------------------ | ----------- | --------------------------------------------------------------------- |
| **Phase 1**              | ✅ Complete | Project Setup (Vite, TS, Tailwind, Supabase, base components)         |
| **Phase 2**              | ✅ Complete | Authentication System (login, signup, reset, protected routes)        |
| **Phase 3**              | ✅ Complete | Product Listing & Cart (products, categories, cart, checkout, orders) |
| **Phase 4**              | ✅ Complete | Messaging (real-time chat, conversations, typing indicators)          |
| **Geolocation**          | ✅ Complete | Browser geolocation for nearby sellers                                |
| **Factory Features**     | ✅ Complete | Dashboard, production tracking, quotes, connections                   |
| **Services Marketplace** | ✅ Complete | Services gateway, provider profiles, listings                         |
| **Phase 5**              | 🔮 Planned  | Reviews Management (review CRUD, seller responses)                    |
| **Future**               | 🔮 Planned  | Analytics Dashboard, Admin Panel, Mobile App                          |

---

## 🤝 Contributing

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow existing code style
   - Add TypeScript types
   - Update documentation if needed
4. **Run linting**
   ```bash
   npm run lint
   ```
5. **Test your changes**
   - Test in both light and dark modes
   - Test on mobile and desktop
   - Test with different user roles
6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
7. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Build/config changes

---

## 📞 Project Info

- **Developer:** Youssef
- **Project:** Aurora E-commerce Platform
- **Version:** 2.0.0
- **License:** © 2026 Aurora E-commerce. All rights reserved.
- **Contact:** support@aurora.com

---

## 🆘 Troubleshooting

### Common Issues

**Issue: Build fails with "module not found"**

```bash
# Solution: Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

**Issue: Supabase functions not found**

```sql
-- Solution: Re-run migrations in Supabase SQL Editor
-- Check functions exist:
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';
```

**Issue: RLS permission denied**

```sql
-- Solution: Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
-- Re-run migration if policies missing
```

**Issue: Realtime not working**

```typescript
// Solution: Check Supabase Realtime is enabled
// Verify subscription in browser console
```

**Issue: Geolocation not working**

- Ensure browser has location permission
- Test on HTTPS (required for geolocation API)
- Check browser console for permission errors

---

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [React](https://react.dev/) - The library for web and native user interfaces
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Shadcn/UI](https://ui.shadcn.com/) - Beautifully designed components
- [Supabase](https://supabase.com/) - The open source Firebase alternative
- [TanStack Query](https://tanstack.com/query) - Powerful asynchronous state management
- [Zustand](https://zustand-demo.pmnd.rs/) - Bear necessities for state management
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons
- [Vercel](https://vercel.com/) - Develop. Preview. Ship.

---

**Built with ❤️ using React, Vite, TypeScript, Tailwind CSS, and Supabase**

---

_Last Updated: March 16, 2026_
