# Architecture Overview

This document provides a comprehensive overview of the AuroraChat platform architecture.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  State Mgmt  │  │   Routing    │      │
│  │  (Components)│  │ (Zustand/    │  │ (React       │      │
│  │              │  │  Query)      │  │  Router)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API        │  │  Auth        │  │  Payment     │      │
│  │   Services   │  │  Service     │  │  Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend Layer (Supabase)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  Edge        │  │  Real-time   │      │
│  │  Database    │  │  Functions   │  │  Subscriptions│     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Auth        │  │  Storage     │                         │
│  │  Service     │  │  (Images)    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Module Structure

### Core Modules

1. **Authentication & Authorization**
   - User registration/login
   - Role-based access control (RBAC)
   - Session management
   - JWT token handling

2. **E-Commerce**
   - Product catalog
   - Shopping cart
   - Order management
   - Wishlist
   - Reviews & ratings

3. **Chat System**
   - Trading conversations
   - Real-time messaging
   - Conversation permissions
   - Message history

4. **Payments**
   - Stripe integration
   - Fawry (Egypt)
   - Cash on Delivery (COD)
   - Wallet system
   - Commission tracking

5. **Services Marketplace**
   - Service provider profiles
   - Booking system
   - Service categories
   - Provider analytics

6. **Factory Module**
   - Quote requests
   - Production orders
   - Manufacturing tracking

7. **Healthcare Module**
   - Patient records
   - Doctor appointments
   - Pharmacy integration
   - Health data consent

8. **Admin Dashboard**
   - User management
   - Product moderation
   - Order oversight
   - Analytics & reports
   - System settings

## 🔐 Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────┐
│         Layer 1: Client Side            │
│  • Input validation                     │
│  • XSS prevention                       │
│  • CSRF tokens                          │
│  • Rate limiting (UX)                   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Layer 2: Network                │
│  • HTTPS/TLS                            │
│  • CORS policies                        │
│  • Security headers                     │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Layer 3: Application            │
│  • Authentication                       │
│  • Authorization checks                 │
│  • Input sanitization                   │
│  • Server-side rate limiting            │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Layer 4: Database               │
│  • Row Level Security (RLS)             │
│  • Parameterized queries                │
│  • Access control policies              │
│  • Audit logging                        │
└─────────────────────────────────────────┘
```

### Security Features

- **CSRF Protection**: Token-based validation for state-changing operations
- **XSS Prevention**: Input sanitization and output encoding
- **SQL Injection**: Parameterized queries via Supabase
- **RLS Policies**: Database-level access control
- **Rate Limiting**: Both client and server-side
- **Audit Logging**: Security event tracking
- **Secure Headers**: CSP, HSTS, X-Frame-Options, etc.

## 📊 Data Flow

### User Authentication Flow

```
User → Login Form → Validate Input → Supabase Auth → 
JWT Token → Store Securely → Update UI → Redirect
```

### Product Purchase Flow

```
Browse Products → Add to Cart → Checkout → 
Select Payment → Process Payment → Create Order → 
Update Inventory → Send Confirmation
```

### Chat Message Flow

```
User Types → Validate Message → Check Permissions → 
Send to Supabase → Real-time Broadcast → 
Recipient Receives → Update UI
```

## 🗄️ Database Schema

### Core Tables

- **users**: User profiles and authentication
- **products**: Product listings
- **orders**: Order records
- **order_items**: Order line items
- **cart_items**: Shopping cart
- **wishlist_items**: Wishlist
- **categories**: Product categories
- **reviews**: Product reviews

### Chat Tables

- **conversations**: Chat conversations
- **messages**: Chat messages
- **conversation_participants**: Conversation members
- **conversation_permissions**: Access control

### Service Tables

- **service_providers**: Service provider profiles
- **services**: Service listings
- **bookings**: Service bookings
- **service_categories**: Service categories

### Financial Tables

- **wallets**: User wallets
- **transactions**: Financial transactions
- **commissions**: Platform commissions
- **payments**: Payment records

## 🔄 State Management

### Client State (Zustand)

- Shopping cart
- UI preferences
- Modal states
- Form data

### Server State (TanStack Query)

- User data
- Products
- Orders
- Messages
- Notifications

### Benefits

- **Optimistic updates**: Immediate UI feedback
- **Caching**: Reduced API calls
- **Background refetch**: Auto-sync with server
- **Error handling**: Built-in retry logic

## 🌐 API Architecture

### RESTful Endpoints

```
GET    /api/products          # List products
GET    /api/products/:id      # Get product details
POST   /api/orders            # Create order
GET    /api/orders/:id        # Get order details
PUT    /api/users/:id         # Update user
DELETE /api/cart/:itemId      # Remove from cart
```

### Real-time Subscriptions

```typescript
// Subscribe to new messages
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, handleNewMessage)
  .subscribe()
```

## 🧪 Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (Playwright)
      /----\     Critical user flows
     /      \    
    /--------\   Integration Tests
   /          \  Component interactions
  /------------\ 
 /              \ Unit Tests (Vitest)
/________________\ Business logic, utilities
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Key workflows
- **E2E Tests**: Critical paths (auth, checkout, payments)

## 🚀 Performance Optimization

### Frontend

- Code splitting by route
- Lazy loading components
- Image optimization
- Bundle size monitoring
- Memoization for expensive calculations

### Backend

- Database indexing
- Query optimization
- Connection pooling
- Caching strategies
- CDN for static assets

### Monitoring

- Page load times
- API response times
- Error rates
- User experience metrics (Core Web Vitals)

## 📈 Scalability Considerations

### Horizontal Scaling

- Stateless application design
- Session storage in Redis/similar
- Load balancing via Vercel
- Database read replicas

### Vertical Scaling

- Optimize database queries
- Increase Supabase compute resources
- Upgrade hosting plan as needed

### Caching Strategy

```
Browser Cache → CDN → React Query Cache → Database
```

## 🔧 Technology Decisions

### Why Vite?

- Fast development server (HMR)
- Optimized production builds
- Modern ES modules
- Plugin ecosystem

### Why Supabase?

- PostgreSQL with real-time
- Built-in authentication
- Row Level Security
- Edge Functions
- Storage solution

### Why Zustand?

- Minimal boilerplate
- TypeScript support
- DevTools integration
- Small bundle size

### Why TanStack Query?

- Automatic caching
- Background refetching
- Optimistic updates
- Error handling

## 📝 Design Patterns

### Component Patterns

- **Container/Presentational**: Separate logic from UI
- **Compound Components**: Flexible component APIs
- **Render Props**: Share behavior between components
- **Custom Hooks**: Reusable logic extraction

### State Patterns

- **Observer Pattern**: Zustand stores
- **Command Pattern**: Action handlers
- **Strategy Pattern**: Payment processors
- **Factory Pattern**: Component creation

## 🔮 Future Considerations

- Microservices architecture for scale
- GraphQL API option
- Mobile app (React Native)
- Progressive Web App (PWA)
- Server-side rendering (SSR)
- Multi-region deployment

---

**Last Updated**: April 2025
**Version**: 1.0.0
