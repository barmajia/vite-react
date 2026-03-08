# Aurora E-commerce

A modern, production-ready e-commerce web application built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

### Frontend
- **Framework:** React 18.3+ with TypeScript
- **Build Tool:** Vite 5.4+
- **Styling:** Tailwind CSS with CSS Variables for theming
- **UI Components:** Shadcn/UI (Radix UI primitives)
- **State Management:** Zustand (client state), TanStack Query (server state)
- **Routing:** React Router DOM v6
- **Notifications:** Sonner

### Backend (Supabase)
- **Database:** PostgreSQL 15+ with advanced extensions
- **Authentication:** Supabase Auth (Email/Password, OAuth ready)
- **Real-time:** Supabase Realtime for messaging & live updates
- **Storage:** Supabase Storage for product images & avatars
- **API:** Auto-generated RESTful API + GraphQL (pg_graphql)
- **Security:** Row Level Security (RLS) on all tables

## Design System

### Theme Colors

**Dark Mode:**
- Background: `#000000` (Pure Black)
- Surface: `#121212`
- Text: `#FFFFFF`
- Accent: `#FFFFFF` (White borders/buttons)

**Light Mode:**
- Background: `#FFFFFF`
- Surface: `#F8F8F8`
- Text: `#000000`
- Accent: `#7C3AED` (Violet/Purple)

### Typography
- Font: Inter (Google Fonts)
- Style: Minimalist, high-contrast, luxury tech aesthetic

## Project Structure

```
src/
├── components/
│   ├── ui/              # Shadcn/UI base components
│   ├── ErrorBoundary.tsx
│   └── ToastProvider.tsx
├── features/
│   ├── auth/            # Authentication feature
│   ├── cart/            # Shopping cart feature
│   ├── products/        # Product listing & details
│   ├── orders/          # Order management
│   └── profile/         # User profile
├── hooks/
│   ├── useAuth.tsx      # Authentication hook & context
│   ├── useTheme.tsx     # Theme toggle hook
│   ├── useCart.ts       # Cart state (Zustand)
│   └── useProducts.ts   # Products (TanStack Query)
├── lib/
│   ├── supabase.ts      # Supabase client setup
│   └── utils.ts         # Utility functions
├── types/
│   ├── database.ts      # TypeScript types from schema
│   └── env.d.ts         # Environment variable types
├── App.tsx
├── main.tsx
└── index.css            # Tailwind + theme CSS variables
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_URL=http://localhost:5173
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Development Phases

### ✅ Phase 1: Project Setup (COMPLETE)
- [x] Vite + React + TypeScript configuration
- [x] Tailwind CSS with Dark/Light theme
- [x] Supabase client setup
- [x] TypeScript types from database schema
- [x] ESLint strict configuration
- [x] Project folder structure
- [x] Base UI components (Button, Input, Card, Label)
- [x] Custom hooks (useAuth, useTheme, useCart, useProducts)
- [x] Error Boundary and Toast notifications

### 🔄 Phase 2: Authentication (NEXT)
- Login/Signup pages
- Forgot password flow
- Protected routes
- Auth layout component

### Phase 3: Product Listing & Search
- Home page with featured products
- Category pages
- Search functionality (tsvector)
- Product filters

### Phase 4: Product Details & Cart
- Product detail page
- Image gallery
- Reviews section
- Contact seller button
- Cart management

### Phase 5: Checkout & Orders
- Checkout flow
- Address selection
- Order creation
- Order history

### Phase 6: User Profile
- Profile management
- Address management
- Wishlist

### Phase 7: Messaging & Notifications
- Real-time messaging
- Notifications system
- Seller communication

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following tables:

### Core Tables
| Table | Description |
|-------|-------------|
| `users` | User profiles with email, full_name, avatar, phone |
| `products` | Product catalog with full-text search (tsvector), pricing, inventory |
| `cart` | Shopping cart items linked to users and products |
| `orders` | Order records with status tracking and payment status |
| `order_items` | Order line items with price snapshots |
| `shipping_addresses` | Saved user addresses with default flag |
| `reviews` | Product reviews with ratings and comments |

### Communication Tables
| Table | Description |
|-------|-------------|
| `conversations` | Buyer-seller conversation threads |
| `messages` | Real-time chat messages |
| `notifications` | In-app notifications (order updates, messages, promotions) |

### Analytics Tables (Seller Dashboard)
| Table | Description |
|-------|-------------|
| `sales` | Sales tracking for analytics |
| `customers` | Customer database for sellers |

### Key Features
- **Full-Text Search**: Products use PostgreSQL `tsvector` for efficient search
- **Status Tracking**: Orders progress through `pending → confirmed → processing → shipped → delivered`
- **Payment States**: Track payment status (`pending`, `paid`, `failed`, `refunded`)
- **Real-time Updates**: Conversations and notifications use Supabase Realtime
- **Row Level Security (RLS)**: All tables have RLS policies for data protection

### Database Functions
- `calculate_seller_analytics()` - Computes seller KPIs, top products, customer data
- Automatic triggers for `updated_at` timestamps
- Aggregation functions for product ratings and review counts

## Security

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication with automatic token refresh
- **Row Level Security (RLS)**: All tables have RLS policies ensuring users can only access their own data
- **Protected Routes**: All application routes require authentication
- **Role-based Access**: Different permissions for buyers, sellers, and admins

### Data Protection
- **Input Validation**: All forms validate and sanitize user input
- **Type Safety**: Strict TypeScript typing prevents runtime errors
- **No Exposed Secrets**: Environment variables stored securely, no sensitive data client-side
- **Secure Headers**: Custom application headers for API requests

### PostgreSQL Extensions
The backend leverages powerful PostgreSQL extensions:
- `pg_cron` - Scheduled jobs and background tasks
- `pg_graphql` - GraphQL API endpoint
- `pg_stat_statements` - Query performance monitoring
- `pgmq` - Message queue for async operations
- `hypopg` - Hypothetical indexes for query optimization

## Deployment

Deployed on Vercel with automatic previews for pull requests.

### Vercel Setup

1. Connect your GitHub repository
2. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`
3. Deploy

## Backend Architecture

### Supabase Configuration

The application connects to Supabase via the official JavaScript client with the following setup:

```typescript
// src/lib/supabase.ts
createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'aurora-ecommerce',
    },
  },
});
```

### Data Fetching Patterns

**Products with Filtering & Pagination:**
```typescript
// Using useProducts hook
const { data, isLoading } = useProducts({
  page: 1,
  limit: 20,
  category: 'electronics',
  minPrice: 100,
  maxPrice: 500,
  sortBy: 'price',
  sortOrder: 'asc',
});
```

**Single Product with Reviews:**
```typescript
// Using useProduct hook
const { data: product } = useProduct(asin);
// Includes nested reviews array
```

**Real-time Messaging:**
```typescript
// Conversations and messages use Supabase Realtime
// for instant updates when new messages arrive
```

### Query Optimization

- **TanStack Query**: Caches and deduplicates API requests
- **Pagination**: Products loaded in chunks (default: 20 per page)
- **Selective Columns**: Only fetch required columns to reduce payload
- **Full-Text Search**: PostgreSQL `tsvector` for efficient product search
- **Database Indexes**: Optimized indexes on frequently queried columns

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbG...` |
| `VITE_APP_URL` | Application base URL | `http://localhost:5173` |

> ⚠️ **Important**: Never commit `.env` files. Use `.env.example` as a template.

## License

© 2026 Aurora E-commerce. All rights reserved.
