# Aurora E-commerce

A modern, production-ready full-stack e-commerce web application built with React, Vite, TypeScript, Tailwind CSS, and Supabase. Features a minimalist, high-contrast luxury tech aesthetic with dark/light mode support and real-time messaging.

**Version:** 1.0.0  
**Status:** Production Ready (Phase 1-4 Complete)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start development server
npm run dev
```

The app will run at `http://localhost:5173`

---

## ✨ Features

### Completed Features

#### 🔐 Authentication System
- Email/password login & signup
- Password reset flow
- Protected routes with auth guards
- Session management with auto-refresh

#### 🛍️ Product Management
- Product listing with pagination
- Product details with image gallery
- Full-text search (PostgreSQL tsvector)
- Category-based browsing
- Product filtering (category, brand, price, rating)
- Product sorting (price, name, date)
- Reviews and ratings with star display

#### 🛒 Shopping Cart
- Persistent cart (localStorage)
- Real-time cart count in header
- Add/remove items
- Quantity updates
- Stock validation

#### 📦 Checkout & Orders
- Complete checkout flow
- Order creation with status tracking
- Order history page
- Order tracking: `pending → confirmed → processing → shipped → delivered`
- Payment status tracking (`pending`, `paid`, `failed`, `refunded`)

#### 💬 Real-Time Messaging (NEW)
- Buyer-seller conversations
- Live message delivery via Supabase Realtime
- Typing indicators
- Read receipts (✓✓)
- Unread message count badges
- Last message preview with timestamps

#### 🌍 Geolocation (NEW)
- Browser-based location detection
- Find nearby sellers
- Distance calculations
- Auto-save location to profile
- Manual coordinate input support

#### 👤 User Features
- Profile management with avatar upload
- Address management (multiple shipping addresses)
- Wishlist functionality
- Notifications system
- Settings pages (profile, account, business, privacy, security, location)

#### 🎨 UI/UX
- Dark/Light theme toggle (persisted)
- Responsive design (mobile-first)
- Loading states with skeleton loaders
- Toast notifications (Sonner)
- Error boundaries
- Accessible components (ARIA labels, keyboard navigation)

### Upcoming Features

- 🔮 Reviews management page (Phase 5)
- 🔮 Brands feature
- 🔮 Analytics dashboard (seller)
- 🔮 Admin panel

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.5.3 | Type safety |
| **Vite** | 5.4.1 | Build tool & dev server |
| **Tailwind CSS** | 3.4.1 | Styling with CSS variables |
| **Shadcn/UI** | - | 11+ Radix UI primitives |
| **Zustand** | 5.0.11 | Client state management |
| **TanStack Query** | ^5.90.21 | Server state & caching |
| **React Router DOM** | 7.13.1 | Client-side routing |
| **Sonner** | 2.0.7 | Toast notifications |
| **Lucide React** | 0.577.0 | Icon library |
| **Vercel Analytics** | 1.6.1 | Performance monitoring |

### Backend (Supabase)

| Technology | Purpose |
|------------|---------|
| **PostgreSQL 17** | Primary database |
| **Supabase Auth** | JWT authentication (email/password, OAuth ready) |
| **Supabase Realtime** | Live updates for messaging & notifications |
| **Supabase Storage** | Product images & user avatars |
| **Row Level Security (RLS)** | Data protection at database level |

### PostgreSQL Extensions

- `pg_cron` - Scheduled jobs
- `pg_graphql` - GraphQL API
- `pg_stat_statements` - Query monitoring
- `pgmq` - Message queue
- `hypopg` - Hypothetical indexes

---

## 📁 Project Structure

```
vite-react/
├── src/
│   ├── components/
│   │   ├── layout/           # Header, Footer, MobileNav, Layout
│   │   ├── products/         # ProductCard, ProductGrid, ProductGallery, StarRating
│   │   ├── shared/           # LoadingSpinner, EmptyState, Pagination
│   │   ├── ui/               # 14+ Shadcn/UI components
│   │   ├── ErrorBoundary.tsx
│   │   ├── ToastProvider.tsx
│   │   └── VercelAnalytics.tsx
│   ├── features/             # Feature-based modules
│   │   ├── addresses/        # Address management
│   │   ├── auth/             # Authentication (login, signup, reset)
│   │   ├── cart/             # Shopping cart
│   │   ├── categories/       # Product categories
│   │   ├── checkout/         # Checkout flow
│   │   ├── messaging/        # Real-time messaging (NEW)
│   │   ├── notifications/    # Notifications
│   │   ├── orders/           # Order management
│   │   ├── products/         # Products listing & details
│   │   ├── profile/          # User profile
│   │   ├── settings/         # User settings (includes location)
│   │   └── wishlist/         # Wishlist
│   ├── hooks/
│   │   ├── useAuth.tsx       # Authentication hook
│   │   ├── useCart.ts        # Cart state (Zustand)
│   │   ├── useProducts.ts    # Products (TanStack Query)
│   │   ├── useTheme.tsx      # Theme toggle
│   │   ├── useGeolocation.ts # Browser geolocation (NEW)
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client configuration
│   │   ├── supabase-realtime.ts # Realtime subscriptions
│   │   └── utils.ts          # Utilities (cn function)
│   ├── pages/
│   │   ├── auth/             # Login, Signup, ForgotPassword, ResetPassword
│   │   ├── errors/           # NotFound, ServerError
│   │   ├── messaging/        # Inbox, Chat (NEW)
│   │   └── public/           # Home, ProductList, ProductDetail, About, Contact, Help
│   ├── types/
│   │   ├── database.ts       # TypeScript types from Supabase schema
│   │   ├── env.d.ts          # Environment variable types
│   │   └── profile.ts        # Profile types (includes location)
│   ├── utils/
│   │   └── avatarUtils.ts    # Avatar helper functions
│   ├── App.tsx               # Main app with routing
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind + theme CSS variables
├── supabase/
│   ├── config.toml           # Supabase local development config
│   └── snippets/             # SQL snippets
├── public/
│   ├── grid.svg              # Background grid pattern
│   └── vite.svg              # Favicon
├── *.sql                     # Database schema & migration files
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.js
├── vercel.json
├── .env.example
└── Documentation files
```

---

## 🎨 Design System

### Theme Colors

**Light Mode:**
- Background: `#FFFFFF` (White)
- Surface: `#F8F8F8`
- Text: `#000000` (Black)
- Accent: `#1A1A1A` (Dark Gray)

**Dark Mode:**
- Background: `#000000` (Pure Black)
- Surface: `#121212`
- Text: `#FFFFFF` (White)
- Accent: `#333333` (Gray)

### Typography
- Font: Inter (Google Fonts)
- Style: Minimalist, high-contrast, luxury tech aesthetic

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Build for production (tsc + vite build) |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🚀 Deployment

### Vercel Deployment

1. **Connect GitHub repository to Vercel**

2. **Add environment variables in Vercel dashboard:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`

3. **Deploy:**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push
   ```
   Vercel auto-deploys on push.

### Build Optimizations

- **Code splitting** into 7 chunks (vendor, ui, query, supabase, utils, state, icons)
- **Production console cleanup** (removes console.log/debugger)
- **ESBuild minification** (fastest)
- **SPA routing** configured via `vercel.json`
- **.vercelignore** excludes unnecessary files

### Expected Build Metrics

- Build Time: ~4 seconds
- Total Bundle: 242 KB (56 KB gzipped)
- Chunks: 10 (code-split)

---

## 🗄️ Database Schema

### Core Tables (12)

| Table | Description |
|-------|-------------|
| `users` | User profiles (email, full_name, avatar, phone, **latitude**, **longitude**) |
| `products` | Product catalog with tsvector search, pricing, inventory |
| `cart` | Shopping cart items linked to users and products |
| `orders` | Order records with status tracking and payment status |
| `order_items` | Order line items with price snapshots |
| `shipping_addresses` | Saved user addresses with default flag |
| `reviews` | Product reviews with ratings and comments |
| `wishlist` | Wishlist items |
| `conversations` | Buyer-seller message threads |
| `messages` | Real-time chat messages |
| `notifications` | In-app notifications (order updates, messages, promotions) |
| `categories` | Product categories with hierarchy (parent_id) |

### Key Database Features

- **Full-text search** using PostgreSQL `tsvector`
- **Order status tracking**: `pending → confirmed → processing → shipped → delivered`
- **Payment states**: `pending`, `paid`, `failed`, `refunded`
- **Real-time updates** via Supabase Realtime
- **Row Level Security (RLS)** on all tables
- **Automatic `updated_at`** triggers
- **Geospatial queries** for nearby sellers (latitude/longitude)

---

## 🔐 Security

### Authentication & Authorization

- **JWT-based authentication** with auto-refresh
- **Row Level Security (RLS)** on all tables
- **Protected routes** require authentication
- **Role-based permissions** (buyer, seller, admin)

### Data Protection

- **Input validation** on all forms
- **Strict TypeScript typing**
- **No exposed secrets** (environment variables only)
- **Secure headers** on API requests

### Geolocation Privacy

- Browser permission required for location access
- User can deny/revoke permission anytime
- Location data only visible to user (RLS protected)
- Location used only for nearby seller features

---

## 📊 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbG...` |
| `VITE_APP_URL` | Application base URL | `http://localhost:5173` |

> ⚠️ **Important**: Never commit `.env` files. Use `.env.example` as a template.

---

## 📈 Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | Project Setup (Vite, TS, Tailwind, Supabase, base components) |
| **Phase 2** | ✅ Complete | Authentication System (login, signup, reset, protected routes) |
| **Phase 3** | ✅ Complete | Product Listing & Cart (products, categories, cart, checkout, orders) |
| **Phase 4** | ✅ Complete | Messaging (real-time chat, conversations, typing indicators) |
| **Geolocation** | ✅ Complete | Browser geolocation for nearby sellers |
| **Phase 5** | 🔄 Pending | Reviews Management (review CRUD, seller responses) |
| **Future** | 🔮 Planned | Brands, Analytics Dashboard, Admin Panel |

---

## 📞 Project Info

- **Developer:** Youssef
- **Project:** Aurora E-commerce
- **License:** © 2026 Aurora E-commerce. All rights reserved.

---

## 📚 Additional Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide with optimizations
- [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md) - Phase 1 completion report
- [PHASE_4_COMPLETE.md](./PHASE_4_COMPLETE.md) - Phase 4 (Messaging) completion report
- [GEOLOCATION_COMPLETE.md](./GEOLOCATION_COMPLETE.md) - Geolocation feature guide
- [LOCATION_FEATURE_COMPLETE.md](./LOCATION_FEATURE_COMPLETE.md) - Location settings documentation
- [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) - Comprehensive project analysis

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` to ensure code quality
4. Submit a pull request

---

**Built with ❤️ using React, Vite, TypeScript, Tailwind CSS, and Supabase**
