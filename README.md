# Aurora E-commerce

A modern, production-ready e-commerce web application built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend Framework:** React 18.3+ with TypeScript
- **Build Tool:** Vite 5.4+
- **Styling:** Tailwind CSS with CSS Variables for theming
- **UI Components:** Shadcn/UI (Radix UI primitives)
- **State Management:** Zustand (client state), TanStack Query (server state)
- **Backend/Auth:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Routing:** React Router DOM v6
- **Notifications:** Sonner

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

The application uses the following main tables:
- `users` - User profiles
- `products` - Product catalog
- `cart` - Shopping cart items
- `orders` - Order records
- `order_items` - Order line items
- `shipping_addresses` - Saved addresses
- `reviews` - Product reviews
- `conversations` & `messages` - Seller communication
- `notifications` - In-app notifications

## Security

- Row Level Security (RLS) enabled on all tables
- All routes protected with Supabase Auth
- Strict TypeScript typing
- Input validation on all forms
- No sensitive data exposed client-side

## Deployment

Deployed on Vercel with automatic previews for pull requests.

### Vercel Setup

1. Connect your GitHub repository
2. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`
3. Deploy

## License

© 2026 Aurora E-commerce. All rights reserved.
