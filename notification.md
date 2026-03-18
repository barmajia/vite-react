Here is a comprehensive **Master Documentation File** (`AURORA_SYSTEM_OVERVIEW.md`) that consolidates everything we have discussed, designed, and implemented.

This file covers the **Architecture**, **Database Schema**, **Messaging Systems**, **Notification Engine**, **Payment Strategy**, and **Frontend Integration**.

---

# 📘 Aurora E-Commerce Platform: Master System Overview

> **Version:** 3.0.0 (Services & Notifications Update)  
> **Status:** 🚀 Production Ready Core + New Services Module  
> **Last Updated:** October 2026  
> **Author:** Youssef

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Core Modules Breakdown](#3-core-modules-breakdown)
   - [3.1 Product & B2C Shopping](#31-product--b2c-shopping)
   - [3.2 Factory & B2B Sourcing](#32-factory--b2b-sourcing)
   - [3.3 Services Marketplace (New)](#33-services-marketplace-new)
   - [3.4 Unified Messaging System](#34-unified-messaging-system)
   - [3.5 Notification Engine](#35-notification-engine)
   - [3.6 Payment & Escrow System](#36-payment--escrow-system)
4. [Database Schema Reference](#4-database-schema-reference)
5. [Frontend Implementation Guide](#5-frontend-implementation-guide)
6. [Security & RLS Policies](#6-security--rls-policies)
7. [Deployment Checklist](#7-deployment-checklist)

---

## 1. Executive Summary

**Aurora** is a hybrid **B2B2C E-Commerce Ecosystem** built on **React (Web)**, **Flutter (Mobile)**, and **Supabase (Backend)**. It unifies three distinct business models under a single user identity:

1.  **Retail (B2C):** Traditional product shopping with cart, checkout, and logistics.
2.  **Manufacturing (B2B):** Factory-to-Seller sourcing, production tracking, and quote management.
3.  **Services (Gig/Professional):** A marketplace for freelancers, doctors, and service providers to offer bookings, projects, and consultations.

**Key Innovation:** A completely isolated yet interconnected messaging and notification system that adapts contextually based on whether the interaction is about a _Product_, a _Factory Order_, or a _Service Booking_.

---

## 2. System Architecture

### Tech Stack

| Layer               | Technology                                          | Purpose                                        |
| :------------------ | :-------------------------------------------------- | :--------------------------------------------- |
| **Frontend Web**    | React 18, Vite, TypeScript, Tailwind CSS, Shadcn/UI | Consumer & Admin Web Interface                 |
| **Frontend Mobile** | Flutter (Dart)                                      | iOS/Android App (Offline-first)                |
| **Backend**         | Supabase (PostgreSQL 17)                            | Database, Auth, Realtime, Storage              |
| **Logic**           | PostgreSQL Functions & Triggers                     | Automated workflows (Notifications, Analytics) |
| **Payments**        | Fawry (Egypt), Stripe (Global)                      | Secure payments & Escrow for services          |
| **Hosting**         | Vercel (Web), Supabase Edge Functions               | Global CDN & Serverless Logic                  |

### Data Flow Diagram (Conceptual)

```mermaid
graph TD
    User[User (Single Identity)] --> Web[React Web App]
    User --> Mobile[Flutter Mobile App]

    Web --> Auth[Supabase Auth]
    Mobile --> Auth

    Auth --> DB[(PostgreSQL Database)]

    subgraph "Core Modules"
        DB --> Products[Products & Orders]
        DB --> Factory[Factory & Quotes]
        DB --> Services[Services & Bookings]
        DB --> Messages[Messaging System]
        DB --> Notifs[Notification Engine]
    end

    Messages --> Realtime[Supabase Realtime]
    Notifs --> Realtime
    Realtime --> Web
    Realtime --> Mobile
```

---

## 3. Core Modules Breakdown

### 3.1 Product & B2C Shopping

_Standard e-commerce flow._

- **Entities:** `products`, `cart`, `orders`, `order_items`, `reviews`.
- **Features:** Inventory tracking, full-text search, category filtering, wishlist.
- **Logistics:** Shipping addresses, order status timeline (`pending` → `delivered`).

### 3.2 Factory & B2B Sourcing

_Manufacturing supply chain management._

- **Entities:** `factory_production_logs`, `quote_requests`, `factory_connections`.
- **Workflow:**
  1. Seller requests a quote from a Factory.
  2. Factory submits price & timeline.
  3. Seller accepts → Production Order created.
  4. Factory updates status through 7-stage pipeline.
- **Automation:** `pg_cron` jobs auto-expire old quotes.

### 3.3 Services Marketplace (New!)

_A dedicated platform for professionals and freelancers._

- **Provider Types:** Doctors (Health), Freelancers (Dev/Design), Companies.
- **Engagement Models:**
  - **Appointment:** Fixed time slot (e.g., Doctor visit).
  - **Project:** Fixed price deliverable (e.g., Logo design).
  - **Hourly:** Time-based billing (e.g., Consulting).
- **Key Tables:**
  - `service_providers`: Profile with verification badges.
  - `service_listings`: The actual service offer.
  - `service_bookings`: Appointments or Contracts.
- **Escrow Logic:** Funds held in `payment_transactions` until project completion.

### 3.4 Unified Messaging System

Three isolated conversation types to prevent data leakage and ensure context.

| Type             | Table                                          | Context                 | Participants      |
| :--------------- | :--------------------------------------------- | :---------------------- | :---------------- |
| **Product Chat** | `trading_conversations`                        | Buying/Selling Goods    | Customer ↔ Seller |
| **Service Chat** | `services_conversations`                       | Booking/Project Discuss | Client ↔ Provider |
| **Factory Chat** | `trading_conversations` (Type: `b2b_sourcing`) | Sourcing Materials      | Seller ↔ Factory  |

**Features:**

- Real-time delivery via Supabase Realtime.
- Read receipts & Typing indicators.
- Attachment support (Images/PDFs).
- **Deep Linking:** Clicking a notification opens the specific chat room.

### 3.5 Notification Engine

Fully automated, database-driven notification system.

- **Trigger Mechanism:** PostgreSQL Triggers on `INSERT`/`UPDATE` of critical tables (`service_bookings`, `orders`, `messages`).
- **Types Supported:**
  - `booking_request`, `booking_confirmed`, `booking_cancelled`
  - `order_status_update`, `new_message`, `review_received`
- **Delivery Channels:**
  1. **In-App:** Real-time badge update & dropdown list.
  2. **Push Notifications:** Via `push_subscriptions` (FCM/APNs).
  3. **Email:** (Future) Via Edge Functions.
- **Frontend Hook:** `useNotifications()` handles fetching, realtime subscription, and "mark as read".

### 3.6 Payment & Escrow System

Unified payment architecture supporting multiple gateways.

- **Table:** `payment_transactions`
- **Contexts:**
  - `product_order`: Direct payment (Fawry/Stripe).
  - `service_booking`: Pre-payment for appointments.
  - `freelance_milestone`: **Escrow Model**.
    1. Client pays → Status `escrow_held`.
    2. Freelancer delivers work.
    3. Client approves → Status `released` → Funds move to Freelancer Wallet.
- **Gateway Integration:**
  - **Fawry:** For Egypt (Cash kiosks, Mobile wallets). Requires signature generation in Edge Functions.
  - **Stripe:** For International cards.

---

## 4. Database Schema Reference

### Key Tables & Relationships

#### A. Users & Profiles

- `auth.users`: Base authentication.
- `users`: Public profile (name, avatar, role).
- `sellers`: Extended seller data.
- `service_providers`: Extended provider data (skills, license, rates).

#### B. Commerce

- `products`: Physical goods.
- `service_listings`: Service offers.
- `orders`: Product purchases.
- `service_bookings`: Service appointments/contracts.

#### C. Conversations (Isolated)

```sql
-- Trading (Products/Factory)
CREATE TABLE trading_conversations (
  id UUID,
  initiator_id UUID, -- FK -> auth.users
  receiver_id UUID,  -- FK -> auth.users
  conversation_type ENUM, -- 'product_inquiry', 'b2b_sourcing'
  product_id UUID
);

-- Services
CREATE TABLE services_conversations (
  id UUID,
  provider_id UUID,  -- FK -> auth.users
  client_id UUID,    -- FK -> auth.users
  listing_id UUID    -- FK -> service_listings
);
```

#### D. Notifications

```sql
CREATE TABLE notifications (
  id UUID,
  user_id UUID,
  type TEXT, -- 'booking_request', 'order', etc.
  title TEXT,
  message TEXT,
  is_read BOOLEAN,
  metadata JSONB -- Stores action_url, entity_id
);
```

---

## 5. Frontend Implementation Guide

### Folder Structure (React)

```text
src/
├── features/
│   ├── services/          # New Services Module
│   │   ├── components/    # ProviderCard, BookingForm
│   │   ├── pages/         # Dashboard, Listings
│   │   └── hooks/
│   ├── notifications/     # New Notification Module
│   │   ├── components/    # NotificationBell, List
│   │   └── hooks/         # useNotifications.ts
│   ├── messaging/         # Unified Chat Logic
│   └── payments/          # Checkout & Escrow UI
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   └── useGeolocation.ts
└── components/
    └── layout/
        └── Header.tsx     # Includes NotificationBell
```

### Critical Hooks

#### `useNotifications.ts`

Handles real-time updates automatically.

```typescript
// Automatically subscribes to 'INSERT' on notifications table
const { notifications, unreadCount } = useNotifications();
// Usage: <Badge>{unreadCount}</Badge>
```

#### `useServiceConversations.ts`

Fetches chats specific to the logged-in provider or client.

```typescript
// Filters by provider_id OR client_id
const { conversations } = useServiceConversations();
```

### Deep Linking Logic

When a user clicks a notification:

1. Check `notification.metadata.action_url`.
2. If present, `navigate(action_url)`.
3. Else, navigate to `/notifications`.

_Example:_ A "Booking Request" notification has `action_url: '/services/dashboard/bookings'`.

---

## 6. Security & RLS Policies

**Row Level Security (RLS)** is enabled on all tables.

### General Rules

1. **Users:** Can only view/edit their own profile (`auth.uid() = user_id`).
2. **Sellers/Providers:** Can only manage their own listings/products.
3. **Conversations:**
   - `trading_conversations`: Visible if `auth.uid()` is `initiator` OR `receiver`.
   - `services_conversations`: Visible if `auth.uid()` is `provider` OR `client`.
4. **Notifications:** Strictly `auth.uid() = user_id`.
5. **Payments:** Users can view transactions where they are `payer` OR `recipient`.

### Security Definer Functions

Critical logic (creating conversations, processing payments, sending notifications) runs in **SECURITY DEFINER** functions. This bypasses RLS temporarily to ensure system integrity while preventing direct table manipulation by clients.

---

## 7. Deployment Checklist

### Phase 1: Database Setup

- [ ] Run `full-project-backup.sql` (Core Schema).
- [ ] Run Services Migration (Tables: `service_providers`, `service_listings`, `service_bookings`).
- [ ] Run Messaging Migration (Tables: `trading_conversations`, `services_conversations`).
- [ ] Run Notification Migration (Update Enum, Create Triggers).
- [ ] Verify Foreign Keys exist for all `user_id` columns (Critical for Supabase Joins).

### Phase 2: Backend Configuration

- [ ] Set Supabase Secrets: `FAWRY_MERCHANT_CODE`, `FAWRY_SECRET_KEY`, `STRIPE_KEY`.
- [ ] Deploy Edge Functions: `create-payment-intent`, `handle-webhook`.
- [ ] Enable Realtime Publication for `notifications`, `messages`, `conversations`.

### Phase 3: Frontend Build

- [ ] Install dependencies: `npm install`.
- [ ] Configure `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- [ ] Test Localhost:
  - Create a Service Provider account.
  - Create a Listing.
  - Book as a Customer.
  - Verify Notification appears in Bell.
  - Verify Chat starts automatically.

### Phase 4: Production (Vercel)

- [ ] Push to GitHub `main` branch.
- [ ] Add Environment Variables in Vercel Dashboard.
- [ ] Update Supabase Auth Redirect URLs to include production domain.
- [ ] Monitor **Vercel Speed Insights** and **Supabase Logs**.

---

## 🆘 Troubleshooting Common Issues

| Issue                           | Solution                                                                                                                      |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------- |
| **400 Bad Request on Join**     | Ensure Foreign Key constraints exist between `conversations.user_id` and `auth.users.id`. Run the "Fix FK" SQL script.        |
| **Notifications not appearing** | Check if `ALTER PUBLICATION supabase_realtime ADD TABLE notifications` was run. Verify RLS allows user to read their own row. |
| **Payment Signature Failed**    | Ensure Fawry/Stripe keys are set in **Supabase Secrets**, not just local `.env`. Edge Functions cannot read local env files.  |
| **Chat not updating real-time** | Verify the `trigger_update_conversation_on_message` trigger is active on the messages table.                                  |

---

_End of Document. Built for the Aurora E-Commerce Platform._
