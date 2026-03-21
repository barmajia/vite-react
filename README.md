# Aurora E-commerce Platform

> A modern, production-ready full-stack B2B2C e-commerce platform built with React, Vite, TypeScript, Tailwind CSS, and Supabase. Features a minimalist, high-contrast luxury tech aesthetic with real-time messaging, factory management, services marketplace, geolocation capabilities, and multi-language support (i18n).

**Version:** 2.5.0  
**Status:** ✅ Production Ready (Phases 1-4 Complete + Factory Features + Services Marketplace + Services Messaging + Healthcare + i18n + Unified Messaging System)  
**Last Updated:** March 21, 2026  
**Developer:** Youssef  
**Overall Score:** 91/100 (See [Project Analysis Report](./PROJECT_ANALYSIS_REPORT.md))

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Routes & Pages](#-routes--pages)
  - [Public Routes](#public-routes)
  - [🌟 Middleman Routes (Special Role)](#-middleman-routes-special-role)
  - [Services Routes](#services-routes)
  - [Factory Routes](#factory-routes)
  - [Healthcare Routes](#healthcare-routes)
  - [Protected User Routes](#protected-user-routes)
  - [Auth Routes](#auth-routes)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Build & Deployment](#-build--deployment)
- [Security](#-security)
- [Design System](#-design-system)
- [API Reference](#-api-reference)
- [Analytics & Performance](#-analytics--performance)
- [TypeScript Implementation](#-complete-typescript-implementation)
- [Documentation](#-documentation)
- [Project Analysis](#-project-analysis)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Aurora is a comprehensive e-commerce platform that supports multiple business models:

1. **B2C E-commerce** - Traditional retail with products, cart, checkout, and orders
2. **B2B Factory** - Factory dashboard, production tracking, quote requests, and seller connections
3. **Services Marketplace** - Service providers can list services, manage bookings, and connect with clients
4. **Healthcare Module** - Doctor profiles, patient records, appointments, and telemedicine consultations
5. **Multi-Language Support (i18n)** - 12+ languages with automatic geolocation-based detection and RTL support

The platform features real-time messaging between buyers and sellers, geolocation for finding nearby sellers, dark/light theme support, internationalization (i18n), and a production-ready deployment pipeline optimized for Vercel.

### 📊 Key Metrics

| Metric                  | Value                                                                             |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Feature Modules**     | 15 (Auth, Cart, Products, Orders, Messaging, Factory, Services, Healthcare, etc.) |
| **Database Tables**     | 20+ with Row Level Security                                                       |
| **SQL Migrations**      | 40+ files                                                                         |
| **Supported Languages** | 12 (with RTL for Arabic, Hebrew, Persian, Urdu)                                   |
| **UI Components**       | 21 Shadcn/UI primitives + 30+ custom components                                   |
| **Custom Hooks**        | 13 reusable hooks                                                                 |
| **Documentation Files** | 30+ markdown files                                                                |
| **Lines of Code**       | ~50,000+                                                                          |

### 🏗️ Architecture Highlights

- **Feature-based folder structure** for scalability and maintainability
- **Type-safe** with comprehensive TypeScript definitions (100% coverage)
- **Multi-layer state management**: Zustand (client), TanStack Query (server), Context API (global)
- **Real-time capabilities** via Supabase Realtime (messaging, notifications)
- **API layer** using Supabase client with RPC functions
- **Isolated messaging systems**: Product messaging & Services messaging (separate tables)

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

### 🌍 Multi-Language Support (i18n)

- **12+ Supported Languages:** English, Arabic, French, Chinese, German, Spanish, Italian, Portuguese, Russian, Japanese, Korean, Turkish
- **Geolocation Detection:** Auto-detects user language based on IP location
- **RTL Support:** Full right-to-left layout for Arabic, Hebrew, Persian, Urdu
- **Persistent Preference:** Language choice saved in localStorage
- **Dynamic Language Switching:** Change language without page reload

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
- **Payment Methods:**
  - Credit/Debit Card (placeholder for Stripe integration)
  - **Fawry (Egypt)** - Online PayPage or kiosk payment (EGP)

### 📦 Order Management

- Order history with detailed views
- Order status tracking: `pending → confirmed → processing → shipped → delivered`
- Payment status tracking: `pending`, `paid`, `failed`, `refunded`
- Order timeline visualization
- Email notifications (via Supabase Edge Functions)

### 💬 Real-Time Messaging

#### Product Messaging (B2C/B2B)

- Buyer-seller conversation threads
- Live message delivery via Supabase Realtime
- Typing indicators and read receipts (✓✓)
- Unread message count badges
- Last message preview with timestamps
- Conversation inbox with filtering
- Route: `/messages`

#### Services Messaging (Isolated System)

- **Completely separate** from product messaging
- Dedicated tables: `services_conversations` & `services_messages`
- Tied to specific service listings
- Provider ↔ Client communication only
- Real-time message delivery with read receipts
- Automatic get-or-create conversation logic via RPC
- Full-text search on message content
- Secure RLS policies ensuring participant-only access
- Routes: `/services/messages`, `/services/messages/:conversationId`

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

A comprehensive **Professional Services Ecosystem** supporting multiple verticals:

#### Health & Wellness Sector

- **Providers:** Doctors, Clinics, Hospitals
- **Features:**
  - Verified license badges
  - Geolocation-based search ("Find nearest Cardiologist")
  - Hybrid booking: In-clinic visits or online telemedicine
  - Secure patient records (metadata)

#### Freelance & Professional Gigs

- **Providers:** Developers, Designers, Translators, Writers
- **Engagement Models:**
  - **Hourly Contracts:** Time-tracking ready
  - **Fixed-Price Projects:** Milestone-based payments
  - **B2B Hiring:** Companies can hire specialists
- **Features:**
  - Portfolio showcase
  - Skill-based filtering
  - Proposal system for custom jobs

#### 🔑 Unified Identity System

- **One Account, Multiple Roles:** A single user account can be a **Shopper**, **Product Seller**, AND **Service Provider** simultaneously
- **Dynamic Onboarding:** System adapts data collection based on whether user registers as "Doctor" or "Freelancer"
- **Isolated Flow:** Services browsing and booking happen in `/services`, completely separate from product shopping

#### Service Categories

- **Health:** Doctors, Hospitals, Clinics (License verification required)
- **Freelance:** Developers, Designers, Translators, Writers
- **Home Services:** Plumbers, Electricians, Cleaners
- **Professional:** Lawyers, Consultants, Accountants
- **Education:** Tutors, Trainers, Courses

### 🏥 Healthcare Module

A complete **Healthcare Ecosystem** integrated within the services marketplace:

#### Doctor Features

- **Doctor Profiles:** Specialization, experience, location, availability
- **License Verification:** Admin verification system for medical licenses
- **Appointment Management:** Regular appointments and emergency slots
- **Patient Records:** Secure consultation history and notes
- **Dashboard:** Appointment calendar, patient list, earnings tracking

#### Patient Features

- **Doctor Search:** Filter by specialization, location, availability
- **Appointment Booking:** In-clinic or telemedicine consultations
- **Health Records:** Access to consultation history and prescriptions
- **Emergency Booking:** Quick booking for urgent care
- **Dashboard:** Upcoming appointments, medical history

#### Telemedicine

- **Virtual Consultations:** Secure video/chat consultation rooms
- **Prescription Management:** Digital prescription generation
- **Follow-up Scheduling:** Automated follow-up appointment reminders

#### Pharmacy Integration

- **Pharmacy Locator:** Find nearby pharmacies with geolocation
- **Medicine Availability:** Check stock at local pharmacies
- **Prescription Fulfillment:** Link prescriptions to pharmacy orders

#### Admin Features

- **Doctor Verification:** Review and approve doctor license submissions
- **Quality Assurance:** Monitor ratings and patient feedback
- **System Oversight:** Manage healthcare module settings

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

| Technology                   | Version | Purpose                              |
| ---------------------------- | ------- | ------------------------------------ |
| **React**                    | 18.3.1  | UI framework                         |
| **TypeScript**               | 5.5.3   | Type safety                          |
| **Vite**                     | 5.4.1   | Build tool & dev server              |
| **Tailwind CSS**             | 3.4.1   | Utility-first CSS with CSS variables |
| **Shadcn/UI**                | -       | 21 Radix UI primitives               |
| **Zustand**                  | 5.0.11  | Client state management              |
| **TanStack Query**           | 5.90.21 | Server state management & caching    |
| **React Router DOM**         | 7.13.1  | Client-side routing                  |
| **Sonner**                   | 2.0.7   | Toast notifications                  |
| **Lucide React**             | 0.577.0 | Icon library                         |
| **Recharts**                 | 3.8.0   | Data visualization                   |
| **i18next**                  | 25.8.19 | Internationalization (i18n)          |
| **react-i18next**            | 16.5.8  | React i18n integration               |
| **date-fns**                 | 4.1.0   | Date formatting                      |
| **Vercel Analytics**         | 1.6.1   | Performance monitoring               |
| **Vercel Speed Insights**    | 1.3.1   | Core Web Vitals                      |
| **class-variance-authority** | 0.7.1   | Component variants                   |
| **clsx**                     | 2.1.1   | Conditional classes                  |
| **tailwind-merge**           | 3.5.0   | Class merging                        |

### Backend (Supabase)

| Technology                   | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| **PostgreSQL 17**            | Primary relational database                      |
| **Supabase Auth**            | JWT authentication (email/password, OAuth ready) |
| **Supabase Realtime**        | Live updates for messaging & notifications       |
| **Supabase Storage**         | Product images, user avatars, documents          |
| **Row Level Security (RLS)** | Data protection at database level                |
| **Supabase Edge Functions**  | Serverless functions (Fawry payment)             |
| **Supabase RPC Functions**   | Database functions for complex operations        |

### PostgreSQL Extensions

- `pg_cron` - Scheduled jobs (quote expiry, analytics snapshots)
- `pg_graphql` - GraphQL API generation
- `pg_stat_statements` - Query performance monitoring
- `pgmq` - Message queue for async tasks
- `hypopg` - Hypothetical index analysis

### Development Tools

| Technology               | Version | Purpose                  |
| ------------------------ | ------- | ------------------------ |
| **ESLint**               | 9.39.3  | Code linting             |
| **TypeScript ESLint**    | 8.0.1   | TypeScript linting       |
| **@vitejs/plugin-react** | 4.3.1   | React HMR & Fast Refresh |
| **@wtdlee/repomap**      | 0.11.3  | Route visualization      |
| **PostCSS**              | 8.5.8   | CSS processing           |
| **Autoprefixer**         | 10.4.27 | CSS vendor prefixes      |

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
│   │   ├── ui/                         # Shadcn/UI components (21)
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
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
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
│   │   │   ├── hooks/
│   │   │   ├── types/
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
│   ├── i18n/                           # Internationalization
│   │   └── config.ts                   # i18next configuration
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
│   │   │   ├── Inbox.tsx               # Product messages inbox
│   │   │   ├── Chat.tsx                # Product messages chat
│   │   │   ├── ServicesInbox.tsx       # Services messages inbox
│   │   │   └── ServicesChat.tsx        # Services messages chat
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
├── public/
│   ├── grid.svg                        # Background grid pattern
│   ├── vite.svg                        # Favicon
│   └── locales/                        # i18n translation files
│       ├── en/
│       │   └── translation.json
│       ├── ar/
│       │   └── translation.json
│       └── ... (other languages)
│
├── supabase/
│   ├── config.toml                     # Supabase local config
│   └── snippets/                       # SQL snippets
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

---

### 🌟 Middleman Routes (Special Role)

**The Middleman role has special privileges with a dedicated dashboard and comprehensive deal management system.**

#### Main Dashboard Routes

| Path                   | Component            | Description                  |
| ---------------------- | -------------------- | ---------------------------- |
| `/middleman`           | `MiddlemanDashboard` | **Main middleman hub**       |
| `/middleman/dashboard` | `MiddlemanDashboard` | Dashboard overview with KPIs |

#### Deal Management Routes

| Path                            | Component              | Description                   |
| ------------------------------- | ---------------------- | ----------------------------- |
| `/middleman/deals`              | `MiddlemanDeals`       | **All deals list**            |
| `/middleman/deals/new`          | `MiddlemanCreateDeal`  | **Create new deal**           |
| `/middleman/deals/:dealId`      | `MiddlemanDealDetails` | **Deal details & management** |
| `/middleman/deals/:dealId/edit` | `MiddlemanEditDeal`    | Edit deal                     |

#### Order & Commission Routes

| Path                    | Component             | Description                        |
| ----------------------- | --------------------- | ---------------------------------- |
| `/middleman/orders`     | `MiddlemanOrders`     | **Orders linked to deals**         |
| `/middleman/commission` | `MiddlemanCommission` | **Commission reports & analytics** |
| `/middleman/analytics`  | `MiddlemanAnalytics`  | **Performance metrics & charts**   |

#### Network & Profile Routes

| Path                     | Component              | Description                      |
| ------------------------ | ---------------------- | -------------------------------- |
| `/middleman/connections` | `MiddlemanConnections` | **Factory & seller connections** |
| `/middleman/profile`     | `MiddlemanProfile`     | **Profile settings**             |
| `/middleman/settings`    | `MiddlemanSettings`    | **Account settings**             |
| `/middleman/messages`    | `MiddlemanMessages`    | **Deal-related messages**        |

---

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
| `/services/messages`                 | `ServicesInbox`         | Services messages inbox   |
| `/services/messages/:conversationId` | `ServicesChat`          | Services chat             |

### Factory Routes (Protected)

| Path                   | Component                | Description                 |
| ---------------------- | ------------------------ | --------------------------- |
| `/factory`             | `FactoryDashboardPage`   | Factory analytics dashboard |
| `/factory/production`  | `FactoryProductionPage`  | Production order tracking   |
| `/factory/quotes`      | `FactoryQuotesPage`      | Quote request management    |
| `/factory/connections` | `FactoryConnectionsPage` | Seller connections          |

### Healthcare Routes

| Path                                 | Component           | Description                    |
| ------------------------------------ | ------------------- | ------------------------------ |
| `/services/health`                   | `HealthLanding`     | Healthcare landing page        |
| `/services/health/doctors`           | `DoctorList`        | Doctor directory               |
| `/services/health/doctor/signup`     | `DoctorSignup`      | Doctor registration            |
| `/services/health/book/:id`          | `BookingPage`       | Appointment booking            |
| `/services/health/patient/dashboard` | `PatientDashboard`  | Patient dashboard              |
| `/services/health/doctor/dashboard`  | `DoctorDashboard`   | Doctor dashboard               |
| `/services/health/admin/verify`      | `AdminVerification` | Admin license verification     |
| `/services/health/consult/:id`       | `ConsultationRoom`  | Telemedicine consultation room |
| `/services/health/pharmacies`        | `PharmacyList`      | Pharmacy directory             |

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

### Core Tables (20+)

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
| `service_providers`           | Service provider profiles | `id`, `user_id`, `business_name`, `rating`, `phone`, `website`                 |
| `service_listings`            | Service offerings         | `id`, `provider_id`, `title`, `price`, `category`, `slug`                      |
| `service_bookings`            | Service appointments      | `id`, `listing_id`, `customer_id`, `date`, `status`                            |
| `services_conversations`      | Services message threads  | `id`, `provider_id`, `customer_id`, `listing_id`, `last_message`               |
| `services_messages`           | Services chat messages    | `id`, `conversation_id`, `sender_id`, `content`, `is_read`                     |
| `health_doctor_profiles`      | Doctor profiles           | `id`, `user_id`, `specialization`, `license_number`, `is_verified`             |
| `health_patient_profiles`     | Patient profiles          | `id`, `user_id`, `medical_history`, `emergency_contact`                        |
| `health_appointments`         | Medical appointments      | `id`, `doctor_id`, `patient_id`, `appointment_type`, `status`                  |
| `health_pharmacy_profiles`    | Pharmacy profiles         | `id`, `user_id`, `location`, `operating_hours`                                 |

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

## 📊 Project Analysis

### Overall Health Score: 91/100 ✅

| Category                 | Score   | Status       |
| ------------------------ | ------- | ------------ |
| **Code Quality**         | 95/100  | ✅ Excellent |
| **Type Safety**          | 100/100 | ✅ Complete  |
| **Architecture**         | 98/100  | ✅ Excellent |
| **Security**             | 95/100  | ✅ Excellent |
| **Performance**          | 88/100  | ✅ Good      |
| **Documentation**        | 85/100  | ✅ Good      |
| **Testing**              | 0/100   | ❌ Missing   |
| **Feature Completeness** | 85/100  | ✅ Good      |

### Build Metrics

| Metric           | Value      | Status        |
| ---------------- | ---------- | ------------- |
| **Build Time**   | ~8 seconds | ✅ Good       |
| **Total Bundle** | 1,427 KB   | ⚠️ Large      |
| **Gzipped**      | 399 KB     | ✅ Acceptable |
| **Modules**      | 3,138      | ⚠️ Many       |
| **Chunks**       | 10         | ✅ Optimized  |

### Code Quality

| Metric              | Value | Target | Status        |
| ------------------- | ----- | ------ | ------------- |
| TypeScript Coverage | 100%  | 100%   | ✅ Pass       |
| ESLint Errors       | 0     | 0      | ✅ Pass       |
| ESLint Warnings     | 112   | <50    | ⚠️ Needs Work |
| Build Success Rate  | 100%  | 100%   | ✅ Pass       |

### Key Findings

✅ **Strengths:**

- Excellent feature-based architecture
- Comprehensive feature set (B2C, B2B, Services)
- Modern technology stack
- Strong security foundation (RLS, JWT)
- Professional code quality
- Comprehensive documentation (37+ docs)

⚠️ **Areas for Improvement:**

- No test coverage (critical gap)
- 67 `any` types in TypeScript
- Large bundle size (862 KB main chunk)
- 112 ESLint warnings (mostly `any` types)
- Missing image optimization
- No service worker for offline support

### Recommended Next Steps

1. **Critical (Week 1-2):**
   - Replace `any` types with proper interfaces
   - Fix useEffect dependency warnings
   - Implement basic test coverage
   - Conduct payment security audit

2. **High Priority (Week 3-4):**
   - Implement route lazy loading
   - Add image optimization
   - Set up E2E testing with Playwright
   - Fix remaining ESLint warnings

3. **Medium Priority (Week 5-6):**
   - Add service worker for PWA support
   - Implement virtual scrolling for long lists
   - Set up Storybook for components
   - Add API documentation (OpenAPI)

📖 **For detailed analysis, see:** [PROJECT_ANALYSIS_REPORT.md](./PROJECT_ANALYSIS_REPORT.md)

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
| `npm run routes`  | Start repomap routes server             |

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
# - services-marketplace-migration.sql (services marketplace)
# - services-messaging-isolated.sql (services messaging)

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

21+ Shadcn/UI components available:

- Alert, Avatar, Badge, Button, Card
- Checkbox, Dialog, Dropdown Menu, Input, Label
- Popover, Progress, Radio Group, Scroll Area, Select
- Separator, Skeleton, Switch, Tabs, Textarea, Toast

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
| [README.md](./README.md)                                       | **Complete project documentation**           |
| [ROUTES.md](./ROUTES.md)                                       | **All routes and parameters reference**      |
| [DEPLOYMENT.md](./DEPLOYMENT.md)                               | Detailed deployment guide with optimizations |
| [FACTORY_IMPLEMENTATION.md](./FACTORY_IMPLEMENTATION.md)       | Factory features complete guide              |
| [SIMPLE_SERVICES_SCHEMA.md](./SIMPLE_SERVICES_SCHEMA.md)       | Services marketplace schema guide            |
| [SERVICES-MESSAGING.md](./SERVICES-MESSAGING.md)               | Services messaging system guide              |
| [FAWRY_INTEGRATION.md](./FAWRY_INTEGRATION.md)                 | Fawry payment integration guide              |
| [GEOLOCATION_COMPLETE.md](./GEOLOCATION_COMPLETE.md)           | Geolocation feature documentation            |
| [LOCATION_FEATURE_COMPLETE.md](./LOCATION_FEATURE_COMPLETE.md) | Location settings guide                      |
| [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md)                   | Phase 1 completion report                    |
| [PHASE_4_COMPLETE.md](./PHASE_4_COMPLETE.md)                   | Phase 4 (Messaging) completion               |
| [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)                   | Comprehensive project analysis               |
| [MESSAGING_FIX.md](./MESSAGING_FIX.md)                         | Messaging bug fix documentation              |
| [FIX-SVC-PROVIDERS.md](./FIX-SVC-PROVIDERS.md)                 | Service providers table fix                  |
| [SERVICES-ECOSYSTEM-PLAN.md](./SERVICES-ECOSYSTEM-PLAN.md)     | Services ecosystem planning                  |
| [ONBOARDING-COMPLETE.md](./ONBOARDING-COMPLETE.md)             | Onboarding wizard completion                 |

---

## 📈 Development Phases

| Phase                      | Status      | Description                                                           |
| -------------------------- | ----------- | --------------------------------------------------------------------- |
| **Phase 1**                | ✅ Complete | Project Setup (Vite, TS, Tailwind, Supabase, base components)         |
| **Phase 2**                | ✅ Complete | Authentication System (login, signup, reset, protected routes)        |
| **Phase 3**                | ✅ Complete | Product Listing & Cart (products, categories, cart, checkout, orders) |
| **Phase 4**                | ✅ Complete | Messaging (real-time chat, conversations, typing indicators)          |
| **Geolocation**            | ✅ Complete | Browser geolocation for nearby sellers                                |
| **Factory Features**       | ✅ Complete | Dashboard, production tracking, quotes, connections                   |
| **Services Marketplace**   | ✅ Complete | Services gateway, provider profiles, listings                         |
| **Services Messaging**     | ✅ Complete | Dedicated messaging for service providers & customers                 |
| **Healthcare Module**      | ✅ Complete | Doctor profiles, patient records, appointments, telemedicine          |
| **i18n Integration**       | ✅ Complete | Multi-language support with geolocation detection                     |
| **Analytics Integration**  | ✅ Complete | Vercel Analytics & Speed Insights                                     |
| **Phase 5**                | 🔮 Planned  | Reviews Management (review CRUD, seller responses)                    |
| **Testing Infrastructure** | 🔮 Planned  | Unit tests (Vitest), Component tests (RTL), E2E tests (Playwright)    |
| **Future**                 | 🔮 Planned  | Analytics Dashboard, Admin Panel, Mobile App, SEO Optimization        |

### Testing Roadmap

**Current Status:** ❌ No tests implemented

**Planned Testing Stack:**

- **Unit Tests:** Vitest + React Testing Library
- **Component Tests:** React Testing Library
- **E2E Tests:** Playwright
- **Integration Tests:** Vitest + Supabase

**Critical Files to Test:**

1. Authentication hooks (`useAuth.tsx`)
2. Cart state management (`useCart.ts`)
3. Checkout flow (`useCheckout.ts`)
4. Product fetching (`useProducts.ts`)
5. Messaging components (`ChatWindow.tsx`, `ConversationList.tsx`)
6. Service booking flow (`ServiceBookingPage.tsx`)

**Critical E2E Flows:**

1. User registration → onboarding → first purchase
2. Product search → add to cart → checkout → order confirmation
3. Service provider signup → create listing → receive booking
4. Buyer-seller messaging flow
5. Factory quote request workflow

---

## 📊 Analytics & Performance

### Vercel Integration

The app is integrated with Vercel's analytics and performance monitoring tools:

#### Vercel Analytics

- **Package:** `@vercel/analytics`
- **Implementation:** `src/components/VercelAnalytics.tsx`
- **Features:**
  - Page views tracking
  - User engagement metrics
  - Traffic sources
  - Geographic data

#### Vercel Speed Insights

- **Package:** `@vercel/speed-insights`
- **Implementation:** `src/components/VercelAnalytics.tsx`
- **Features:**
  - Core Web Vitals monitoring
  - Page load performance
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Cumulative Layout Shift (CLS)
  - First Input Delay (FID)

### Viewing Analytics

1. Deploy to Vercel
2. Visit your Vercel dashboard
3. Navigate to **Analytics** tab
4. View **Speed Insights** for performance metrics

---

## 💻 Complete TypeScript Implementation

### Project Structure (TypeScript)

```
src/
├── components/
│   ├── common/
│   │   ├── CookieConsentBanner.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── dashboard/
│   │   ├── SellerDashboard.tsx
│   │   ├── FactoryDashboard.tsx
│   │   ├── MiddlemanDashboard.tsx
│   │   ├── DeliveryDashboard.tsx
│   │   └── CustomerDashboard.tsx
│   ├── middleman/
│   │   ├── DealCard.tsx
│   │   ├── DealList.tsx
│   │   ├── CreateDealForm.tsx
│   │   ├── DealDetails.tsx
│   │   ├── CommissionCalculator.tsx
│   │   ├── FactoryConnections.tsx
│   │   └── CommissionReports.tsx
│   ├── products/
│   │   ├── ProductList.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductForm.tsx
│   │   └── ProductDetails.tsx
│   ├── orders/
│   │   ├── OrderList.tsx
│   │   ├── OrderDetails.tsx
│   │   └── OrderStatus.tsx
│   ├── chat/
│   │   ├── ConversationList.tsx
│   │   ├── ChatWindow.tsx
│   │   └── MessageBubble.tsx
│   ├── analytics/
│   │   ├── SellerAnalytics.tsx
│   │   ├── KPICards.tsx
│   │   └── Charts.tsx
│   └── settings/
│       ├── PreferencesForm.tsx
│       ├── ProfileSettings.tsx
│       └── CookieSettings.tsx
├── context/
│   ├── AuthContext.tsx
│   ├── PreferencesContext.tsx
│   ├── RoleContext.tsx
│   └── MiddlemanContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePreferences.ts
│   ├── useRole.ts
│   ├── useMiddleman.ts
│   ├── useRealtime.ts
│   └── useAnalytics.ts
├── pages/
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── SignUp.tsx
│   ├── Dashboard.tsx
│   ├── middleman/
│   │   ├── Dashboard.tsx
│   │   ├── Deals.tsx
│   │   ├── DealDetails.tsx
│   │   ├── CreateDeal.tsx
│   │   ├── Orders.tsx
│   │   ├── Analytics.tsx
│   │   ├── Connections.tsx
│   │   ├── Messages.tsx
│   │   ├── Profile.tsx
│   │   ├── Settings.tsx
│   │   └── Commission.tsx
│   ├── Products.tsx
│   ├── Orders.tsx
│   ├── Messages.tsx
│   ├── Analytics.tsx
│   ├── Settings.tsx
│   └── NotFound.tsx
├── services/
│   ├── supabaseClient.ts
│   ├── authService.ts
│   ├── productService.ts
│   ├── orderService.ts
│   ├── chatService.ts
│   ├── analyticsService.ts
│   └── middlemanService.ts
├── types/
│   ├── database.types.ts
│   ├── auth.types.ts
│   ├── user.types.ts
│   ├── middleman.types.ts
│   ├── preferences.types.ts
│   └── api.types.ts
├── utils/
│   ├── rolePermissions.ts
│   ├── formatters.ts
│   └── validators.ts
├── App.tsx
└── main.tsx
```

### TypeScript Types (Based on Supabase Schema)

```typescript
// src/types/database.types.ts

export type UserRole =
  | "factory"
  | "seller"
  | "middleman"
  | "customer"
  | "delivery";

export interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: UserRole;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  user_id: string;
  role: UserRole;
  company_name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string;
  is_verified: boolean;
  store_name: string | null;
  commission_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface MiddlemanProfile {
  user_id: string;
  company_name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string;
  commission_rate: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  middleman_id: string;
  party_a_id: string;
  party_b_id: string;
  product_id: string | null;
  commission_rate: number | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  seller_id: string | null;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  payment_method: "cash" | "card" | "bank_transfer" | "digital_wallet" | "cod";
  payment_status: "pending" | "completed" | "failed" | "refunded";
  deal_id: string | null;
  commission_rate: number | null;
  commission_amount: number | null;
  delivery_id: string | null;
  delivery_status:
    | "pending"
    | "assigned"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "failed";
  created_at: string;
  updated_at: string;
}

export interface Preference {
  theme: "light" | "dark" | "system";
  language: "en" | "es" | "fr" | "ar";
  currency: "USD" | "EUR" | "EGP" | "GBP";
  sidebar: "expanded" | "collapsed";
  cookieConsent: "accepted" | "rejected" | null;
}
```

### Context Providers

#### AuthContext

Manages authentication state with cookie-based session storage:

- `user` - Current authenticated user
- `session` - Supabase session
- `signIn()` - Email/password login
- `signUp()` - User registration with metadata
- `signOut()` - Logout

#### RoleContext

Determines user role and permissions:

- `role` - Current user role (factory, seller, middleman, customer, delivery)
- `businessProfile` - User's business profile
- `hasPermission()` - Check role permissions
- `isSeller()`, `isFactory()`, `isMiddleman()`, etc. - Role checks

#### PreferencesContext

Manages user preferences with localStorage + database sync:

- `theme` - Light/Dark/System
- `language` - Preferred language
- `currency` - Preferred currency
- `sidebar` - Expanded/Collapsed
- `cookieConsent` - Accepted/Rejected

#### MiddlemanContext

Manages middleman-specific data and operations:

- `profile` - Middleman profile
- `deals` - Active deals
- `stats` - Commission and deal statistics
- `createDeal()` - Create new deal
- `updateDeal()` - Update deal
- `deleteDeal()` - Delete deal

### Role-Based Routing

```typescript
// Main App Router - Middleman routes placed right after public routes
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <PreferencesProvider>
            <MiddlemanProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />

                {/* 🌟 Middleman Routes (Special Role - Right After Public) */}
                <Route path="/middleman/*" element={
                  <ProtectedRoute allowedRoles={[ROLE_TYPES.MIDDLEMAN]}>
                    <MiddlemanLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<MiddlemanDashboard />} />
                  <Route path="dashboard" element={<MiddlemanDashboard />} />
                  <Route path="deals" element={<MiddlemanDeals />} />
                  <Route path="deals/new" element={<MiddlemanCreateDeal />} />
                  <Route path="deals/:dealId" element={<MiddlemanDealDetails />} />
                  <Route path="orders" element={<MiddlemanOrders />} />
                  <Route path="analytics" element={<MiddlemanAnalytics />} />
                  <Route path="connections" element={<MiddlemanConnections />} />
                  <Route path="commission" element={<MiddlemanCommission />} />
                  <Route path="profile" element={<MiddlemanProfile />} />
                  <Route path="settings" element={<MiddlemanSettings />} />
                </Route>

                {/* Other Role Dashboards */}
                <Route path="/dashboard/seller" element={
                  <ProtectedRoute allowedRoles={[ROLE_TYPES.SELLER]}>
                    <Dashboard role={ROLE_TYPES.SELLER} />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/factory" element={
                  <ProtectedRoute allowedRoles={[ROLE_TYPES.FACTORY]}>
                    <Dashboard role={ROLE_TYPES.FACTORY} />
                  </ProtectedRoute>
                } />

                {/* More routes... */}
              </Routes>
            </MiddlemanProvider>
          </PreferencesProvider>
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

### Role Permission Matrix

| Feature              | Customer | Seller   | Factory | Middleman  | Delivery      |
| -------------------- | -------- | -------- | ------- | ---------- | ------------- |
| View Products        | ✅       | ✅       | ✅      | ✅         | ✅            |
| Create Products      | ❌       | ✅       | ✅      | ❌         | ❌            |
| View Orders          | ✅ (own) | ✅ (own) | ❌      | ✅ (deals) | ✅ (assigned) |
| View Analytics       | ❌       | ✅       | ✅      | ✅         | ❌            |
| Chat                 | ✅       | ✅       | ✅      | ✅         | ✅            |
| Manage Deals         | ❌       | ✅       | ✅      | ✅         | ❌            |
| Delivery Assignments | ❌       | ✅       | ❌      | ❌         | ✅            |
| Cart/Wishlist        | ✅       | ❌       | ❌      | ❌         | ❌            |

### Database Migration for Preferences

```sql
-- Add preference columns to users table
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "preferred_language" text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS "preferred_currency" text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS "theme_preference" text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS "sidebar_state" text DEFAULT 'expanded';

-- Add constraints
ALTER TABLE "public"."users"
ADD CONSTRAINT "check_theme_preference" CHECK ("theme_preference" IN ('light', 'dark', 'system')),
ADD CONSTRAINT "check_sidebar_state" CHECK ("sidebar_state" IN ('expanded', 'collapsed'));

-- RLS Policy for preferences
CREATE POLICY "users_update_own_preferences" ON "public"."users"
FOR UPDATE TO "authenticated"
USING ("auth"."uid"() = "user_id")
WITH CHECK ("auth"."uid"() = "user_id");
```

### Installation Commands

```bash
# Create React App with TypeScript
npm create vite@latest my-app -- --template react-ts
cd my-app

# Install dependencies
npm install @supabase/supabase-js react-router-dom

# Install TypeScript types
npm install -D @types/react @types/react-router-dom

# Install UI libraries
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional utilities
npm install date-fns recharts lucide-react
npm install -D @types/date-fns
```

---

## 🤝 Contributing

### Contribution Guidelines

We welcome contributions! Please follow these steps:

1. **Fork the repository**

2. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add TypeScript types (no `any` types)
   - Update documentation if needed
   - Add tests for new features (coming soon)

4. **Run linting**

   ```bash
   npm run lint
   ```

5. **Test your changes**
   - Test in both light and dark modes
   - Test on mobile and desktop
   - Test with different user roles
   - Verify responsive design

6. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

7. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Quality Standards

**TypeScript:**

- ❌ No `any` types - use proper interfaces
- ✅ Strict mode enabled
- ✅ Proper type definitions for all functions
- ✅ Generic types for reusable utilities

**React:**

- ✅ Functional components with hooks
- ✅ Proper useEffect dependencies
- ✅ Memoization for expensive computations
- ✅ Error boundaries for graceful failures

**Styling:**

- ✅ Tailwind CSS utility classes
- ✅ Responsive design (mobile-first)
- ✅ Dark mode support
- ✅ Consistent spacing scale

**Testing (Planned):**

- Unit tests for hooks and utilities
- Component tests for UI components
- E2E tests for critical user flows
- Integration tests for API calls

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features (e.g., `feat: add wishlist functionality`)
- `fix:` - Bug fixes (e.g., `fix: resolve cart update issue`)
- `docs:` - Documentation changes (e.g., `docs: update README installation`)
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring without changing functionality
- `test:` - Test additions and updates
- `chore:` - Build/config changes, dependency updates

**Examples:**

```bash
feat: add product comparison feature
fix: resolve messaging realtime subscription issue
docs: update deployment guide with Vercel steps
refactor: extract cart logic to custom hook
chore: update Supabase client to latest version
```

### Pull Request Guidelines

**PR Title:** Use conventional commit format

**PR Description Template:**

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tested locally
- [ ] Added tests (if applicable)
- [ ] Tested on mobile
- [ ] Tested in dark mode

## Checklist

- [ ] Code follows project guidelines
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated
```

### Code Review Process

1. **Automated Checks:**
   - TypeScript compilation ✅
   - ESLint validation ✅
   - Build success ✅

2. **Manual Review:**
   - Code quality and readability
   - Type safety
   - Performance impact
   - Security considerations
   - Test coverage (when implemented)

3. **Approval:**
   - At least 1 approval required
   - All automated checks must pass
   - No unresolved comments

---

## 📞 Project Info

- **Project:** Aurora E-commerce Platform
- **Version:** 2.4.0
- **Developer:** Youssef
- **License:** © 2026 Aurora E-commerce. All rights reserved.
- **Contact:** support@aurora.com
- **Documentation:** [View Full Documentation](./README.md)
- **Analysis Report:** [Project Analysis](./PROJECT_ANALYSIS_REPORT.md)

### 🎯 Key Features Summary

| Category            | Features                                                  |
| ------------------- | --------------------------------------------------------- |
| **E-commerce**      | Products, Cart, Checkout, Orders, Wishlist, Reviews       |
| **B2B Factory**     | Dashboard, Production Tracking, Quotes, Connections       |
| **Services**        | Marketplace, Bookings, Provider Profiles, Messaging       |
| **Healthcare**      | Doctors, Patients, Appointments, Telemedicine, Pharmacies |
| **Communication**   | Real-time Messaging (2 systems), Notifications            |
| **User Experience** | Multi-language (12), Dark/Light Theme, Geolocation        |
| **Security**        | JWT Auth, RLS Policies, Role-based Access                 |

### 📊 Project Statistics

### 🌟 Middleman Role - Special Privileges

The **Middleman** role is designed as a **premium power user** with:

- ✅ **Dedicated Routes** - Placed right after public routes for easy access (`/middleman/*`)
- ✅ **Custom Layout** - Special `MiddlemanLayout` component
- ✅ **Deal Management** - Full CRUD operations for deals
- ✅ **Commission Tracking** - Real-time commission reports and analytics
- ✅ **Network Building** - Connect with factories and sellers
- ✅ **Analytics Dashboard** - Performance metrics and insights
- ✅ **Order Oversight** - View all orders linked to their deals

**Route Priority:** Public → **Middleman** → Other Roles → Customer

---

### 📊 Project Statistics

| Metric              | Count             |
| ------------------- | ----------------- |
| **Total Features**  | 15 modules        |
| **Database Tables** | 26+ tables        |
| **API Functions**   | 10+ RPC functions |
| **UI Components**   | 50+ components    |
| **Custom Hooks**    | 13 hooks          |
| **Routes**          | 60+ routes        |
| **Languages**       | 12 languages      |
| **SQL Migrations**  | 40+ files         |
| **Documentation**   | 37+ MD files      |

### 🚀 Quick Links

- 📊 [Project Analysis Report](./PROJECT_ANALYSIS_REPORT.md) - Comprehensive analysis with recommendations
- 📖 [Project Analysis](./PROJECT_ANALYSIS.md) - Detailed project overview
- 🚀 [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- 🗺️ [Routes Reference](./ROUTES.md) - All routes and parameters
- 🏭 [Factory Implementation](./FACTORY_IMPLEMENTATION.md) - B2B factory features
- 💬 [Services Messaging](./SERVICES-MESSAGING.md) - Services messaging system
- 💳 [Fawry Integration](./FAWRY_INTEGRATION.md) - Payment integration guide
- 🌍 [Geolocation](./GEOLOCATION_COMPLETE.md) - Location features
- 🏥 [Healthcare Schema](./healthcare-schema.sql) - Healthcare module SQL
- 📨 [Unified Messaging](./UNIFIED_MESSAGING_SUMMARY.md) - Complete messaging system
- 📦 [Phase Reports](./PHASE_1_COMPLETE.md) - Development phase completions

### Support

For issues, questions, or contributions:

- 📧 Email: support@aurora.com
- 📚 Documentation: See `/docs` folder and `.md` files
- 🐛 Bug Reports: Create an issue with detailed steps
- 💡 Feature Requests: Submit with use case description

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

**Issue: Service Provider 400 Bad Request (svc_providers)**

If you get a 400 error when creating a service provider profile:

```sql
-- Solution: Run the fix migration in Supabase SQL Editor
-- File: fix-svc-providers-all-columns.sql

-- Add missing columns to svc_providers table
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS website VARCHAR(200);

-- Update status constraint to include 'pending_review'
ALTER TABLE public.svc_providers
DROP CONSTRAINT IF EXISTS svc_providers_status_check;

ALTER TABLE public.svc_providers
ADD CONSTRAINT svc_providers_status_check
CHECK (status IN ('active', 'inactive', 'suspended', 'pending_review'));
```

See [FIX-SVC-PROVIDERS.md](./FIX-SVC-PROVIDERS.md) for complete details.

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
- [i18next](https://www.i18next.com/) - Internationalization framework

---

**Built with ❤️ using React, Vite, TypeScript, Tailwind CSS, Supabase, and i18next**

---

_Built with ❤️ by Youssef | Last Updated: March 21, 2026 | Version 2.5.0_

**📊 Project Status:** ✅ Production Ready (91/100 Score)

**🚀 Next Steps:** See [PROJECT_ANALYSIS_REPORT.md](./PROJECT_ANALYSIS_REPORT.md) for recommended improvements and testing roadmap.

**📨 New:** Check out the [Unified Messaging System](./UNIFIED_MESSAGING_SUMMARY.md) to consolidate all chat systems!
