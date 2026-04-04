# AuroraChat - Multi-Vendor E-Commerce Platform

A comprehensive TypeScript/React e-commerce platform with chat functionality, multi-payment support, and role-based access control.

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI Components
- **State Management**: Zustand + TanStack Query
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Payments**: Stripe, Fawry, COD (Cash on Delivery)
- **Testing**: Vitest (Unit) + Playwright (E2E)
- **Internationalization**: i18next

## 📁 Project Structure

```
/workspace
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   │   ├── layout/         # Layout components (Header, Footer, etc.)
│   │   ├── chat/           # Chat-related components
│   │   ├── checkout/       # Checkout flow components
│   │   ├── products/       # Product display components
│   │   └── ...
│   ├── features/           # Feature-based modules
│   │   ├── cart/           # Shopping cart functionality
│   │   ├── orders/         # Order management
│   │   ├── wishlist/       # Wishlist feature
│   │   ├── services/       # Services marketplace
│   │   ├── factory/        # Factory quote requests
│   │   ├── health/         # Healthcare module
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries and configs
│   ├── pages/              # Page components organized by role
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── seller/         # Seller dashboard pages
│   │   ├── customer/       # Customer pages
│   │   ├── delivery/       # Delivery personnel pages
│   │   └── ...
│   ├── services/           # API service layer
│   ├── types/              # TypeScript type definitions
│   ├── context/            # React Context providers
│   └── i18n/               # Internationalization config
├── supabase/
│   └── functions/          # Supabase Edge Functions
├── e2e/                    # Playwright E2E tests
├── scripts/                # Utility scripts
└── public/
    └── locales/            # Translation files
```

## 🔑 Features

### Core E-Commerce
- Product catalog with categories
- Shopping cart and wishlist
- Multi-step checkout process
- Order tracking and history
- Reviews and ratings

### Chat System
- Trading conversations
- Permission-based access
- Real-time messaging
- Conversation management

### User Roles
- **Customers**: Browse, purchase, track orders
- **Sellers**: Manage products, orders, commissions
- **Service Providers**: Bookings and analytics
- **Delivery**: Order verification and delivery
- **Middlemen**: Transaction facilitation
- **Admins**: Full platform management

### Payment Methods
- **Stripe**: Credit/debit cards
- **Fawry**: Egyptian payment gateway
- **COD**: Cash on delivery with verification

### Security
- CSRF protection
- Input sanitization
- Row Level Security (RLS)
- Role-based access control
- Secure payment processing

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run Vitest unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright E2E tests
npm run test:all         # Run all tests

# Code Quality
npm run lint             # Run ESLint
npm run build:check      # Type check and build

# Database
npm run routes           # View route mappings
```

## 📝 Environment Variables

Required variables in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_FAWRY_MERCHANT_CODE=your_fawry_merchant_code
```

See `.env.example` for full list.

## 🧪 Testing

### Unit Tests
```bash
npm run test                    # Run all unit tests
npm run test:components         # Test components only
npm run test:hooks             # Test hooks only
npm run test:utils             # Test utilities only
```

### E2E Tests
```bash
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Run with UI
npm run test:e2e:debug         # Debug mode
npm run test:e2e:auth          # Auth tests only
npm run test:e2e:security      # Security tests only
```

## 📦 Deployment

### Vercel
The project is configured for Vercel deployment. Ensure environment variables are set in Vercel dashboard.

### Supabase Edge Functions
```bash
# Login to Supabase
npx supabase login

# Link project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
npx supabase functions deploy
```

## 🔐 Security Considerations

1. **Input Validation**: All user inputs are sanitized
2. **CSRF Protection**: Token-based CSRF protection enabled
3. **RLS Policies**: Database-level access control
4. **Payment Security**: PCI-compliant payment processing
5. **Authentication**: Supabase Auth with secure sessions

## 🌍 Internationalization

Supports multiple languages via i18next. Translation files located in `public/locales/`.

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <div>{t('welcome.message')}</div>;
}
```

## 📚 Additional Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Support

For issues and questions, please contact the development team.
