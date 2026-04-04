# 🌌 Aurora E-Commerce Platform

A full-stack marketplace application built with **React + TypeScript + Vite**, styled with **Tailwind CSS**, and backed by **Supabase** (PostgreSQL + Auth + RLS).

## 🏗️ Tech Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| **Frontend**   | React 18, TypeScript, Vite 5          |
| **Styling**    | Tailwind CSS, Radix UI, Lucide Icons  |
| **State**      | Zustand, TanStack Query               |
| **Backend**    | Supabase (PostgreSQL, Auth, Realtime) |
| **Payments**   | Stripe                                |
| **Testing**    | Vitest, Playwright                    |
| **Deployment** | Vercel                                |

## 📂 Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Supabase client, utilities
│   ├── pages/          # Route pages (admin, shops, auth, etc.)
│   ├── store/          # Zustand stores
│   ├── types/          # TypeScript type definitions
│   └── i18n/           # Internationalization
├── webss/
│   ├── index.html      # 📋 Schema Explorer (detailed table/function/docs)
│   └── canvas.html     # 🗺️ Interactive ER Diagram Canvas
├── atall.sql           # Full database schema dump
└── e2e/                # Playwright end-to-end tests
```

## 🗄️ Database Schema

The platform includes **55+ tables** covering:

| Domain        | Key Tables                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Core**      | `users`, `sellers`, `customers`, `business_profiles`                                                                           |
| **Commerce**  | `products`, `orders`, `order_items`, `sales`, `deals`, `commissions`                                                           |
| **Payments**  | `user_wallets`, `wallet_transactions`, `payment_intentions`                                                                    |
| **Delivery**  | `delivery_profiles`, `delivery_assignments`, `cod_collections`                                                                 |
| **Chat**      | `conversations`, `messages`, `conversation_participants`, `calls`                                                              |
| **Health**    | `health_doctor_profiles`, `health_patient_profiles`, `health_medicines`, `health_prescriptions_digital`, `health_appointments` |
| **Services**  | `svc_providers`, `service_bookings`, `booking_milestones`, `freelancer_profiles`                                               |
| **Catalog**   | `categories`, `subcategories`, `brands`                                                                                        |
| **Analytics** | `analytics_snapshots`, `sales`                                                                                                 |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run end-to-end tests
npm run test:e2e
```

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase and Stripe keys:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## 📊 Schema Documentation

Open the schema explorers for interactive documentation:

- **Schema Explorer** (`webss/index.html`) — Browse every table, function, enum, and policy with SQL definitions + TypeScript Supabase examples.
- **ER Diagram Canvas** (`webss/canvas.html`) — Interactive node-based visualization of all table relationships.

## 🧪 Testing

```bash
# Unit & component tests
npm run test:run

# E2E browser tests
npm run test:e2e

# All tests
npm run test:all
```

## 📝 License

Private — All rights reserved.
