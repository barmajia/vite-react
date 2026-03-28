# 🗺️ Aurora React Application Routing Architecture

This document serves as a comprehensive map of all routes within the React application (`src/App.tsx`), detailing the functionality and intended audience for each section of the platform.

---

## 🔒 1. Authentication & Onboarding
Routes for users who are logging in or creating new accounts.
- **`/login`** — Standard user, seller, provider, and admin login page.
- **`/signup`** — Universal multi-role signup page (Shoppers, Sellers, Factories, Delivery).
- **`/signup/middleman`** — Dedicated onboarding flow for the Middleman program.
- **`/forgot-password`** — Password recovery request page.
- **`/reset-password`** — Token-based password reset completion page.

---

## 🛒 2. E-Commerce & Products
The core B2C and B2B marketplace routes. Access is generally public for viewing, but restricted for purchasing.
- **`/` (Root)** — The Services Gateway / Homepage.
- **`/products`** — Main product catalog, search, and filtering grid.
- **`/products/:asin`** — Individual product detail page (Alternative formats supported: `/product/:id`).
- **`/products/categories`** — Directory of all product categories.
- **`/products/categories/:slug`** — Specific category filtering page.
- **`/products/brands` & `/products/brands/:id`** — Brand-specific product directories.

**Protected Shopping Flow:**
- **`/cart`** — User's active shopping cart.
- **`/checkout`** — Secure checkout and Stripe/Fawry payment processing.
- **`/order-success/:id`** — Confirmation page after successful payment.
- **`/orders`** — Paginated list of user's past and active orders.
- **`/orders/:id`** — Specific receipt and order status page.
- **`/wishlist`** — Saved products for future purchase.
- **`/addresses`** — Multi-address book management.

---

## 🛠️ 3. Services Marketplace Ecosystem
Flows dedicated to booking freelancers, agencies, and professional services.
- **`/services`** — Services homepage and category directory.
- **`/services/:categorySlug`** — Deep-link into specific service types (e.g. Handyman, Development).
- **`/services/listing/:listingId`** — Individual service listing details.
- **`/services/listing/:listingId/book`** — Booking wizard to schedule and pay for a service.
- **`/services/provider/:providerId`** — Public profile of the service provider.

**Provider Dashboard (Protected):**
- **`/services/dashboard`** — Service provider home base.
- **`/services/dashboard/bookings`** — Track incoming and active bookings.
- **`/services/dashboard/create-profile`** — Setup provider data.
- **`/services/dashboard/create-listing`** — Post a new service offering.
- **`/services/onboarding`** — Interactive onboarding wizard.

---

## 🩺 4. Healthcare Portal
Specialized HIPAA/Compliant routing for medical consultations.
- **`/services/health`** — Main Health module gateway.
- **`/services/health/doctors`** — Directory of verified medical professionals.
- **`/services/health/book/:id`** — Medical appointment scheduler.
- **`/services/health/pharmacies`** — Directory of partnered pharmacies.

**Protected Health Roles:**
- **`/services/health/patient/dashboard`** — Medical history, prescriptions, and upcoming consults.
- **`/services/health/doctor/dashboard`** — Practice management for doctors.
- **`/services/health/doctor/signup`** & **`/pending-approval`** — Doctor multi-step verification flow.
- **`/services/health/consult/:id`** — Secure real-time video/chat consultation room.
- **`/services/health/patient/consent/:appointmentId`** — Legal medical agreements.

---

## 🏭 5. Factory & Manufacturing
B2B tools for mass production and supplier linking.
- **`/factory`** — Factory control panel overview.
- **`/factory/production`** — Track active manufacturing timelines.
- **`/factory/quotes`** — Analyze incoming RFQs (Requests for Quote).
- **`/factory/connections`** — Manage long-term B2B buyer relationships.
- **`/factory/start-chat`** — Initiate direct B2B communication.

---

## 🤝 6. Middleman Program
Tools for facilitators who broker deals between buyers and factories/sellers.
- **`/middleman`** — Commission and Deal tracking dashboard.
- **`/middleman/deals`** & **`/deals/new`** — Create and monitor brokered contracts.
- **`/middleman/orders`** — Orders linked to the middleman's influence.
- **`/middleman/analytics`** & **`/commission`** — Financial payouts and performance metrics.
- **`/middleman/connections`** — CRM for buyers and suppliers.

---

## 👛 7. Digital Wallet & Finances
System-wide financial tracking for sellers, middlemen, and delivery drivers.
- **`/wallet`** — Overall balance and quick actions.
- **`/wallet/transactions`** — Ledger of all incoming/outgoing funds.
- **`/wallet/payouts`** & **`/payout-history`** — Request withdrawals to bank accounts.
- **`/seller/commission`** — Seller-specific revenue breakdowns.

---

## 🚚 8. Delivery Logistics
- **`/delivery`** — Driver dashboard (Active routes, pending assignments, earnings).

---

## 💬 9. Social & Unified Communications
- **`/chat`** & **`/chat/:conversationId`** — Unified real-time chat supporting user-to-user, user-to-seller, and admin support.
- **`/messages`** & **`/messages/:conversationId`** — Legacy/Inbox view for messages.
- **`/profile` & `/profiles`** — Private user profile editor and public user directory.
- **`/feed`** — Community or seller social timeline.

---

## 🛡️ 10. Admin Portal (`/admin/*`)
Highly restricted environment for platform administration.
- **`/admin`** — High-level metric dashboard.
- **`/admin/users`** — User management, banning, and verification.
- **`/admin/products`** — Global catalog management, SKU editing (`/products/new`, `/products/:id/edit`).
- **`/admin/orders`** — Dispute resolution and global tracking.
- **`/admin/factories`** & **`/admin/middlemen`** & **`/admin/delivery`** — Oversee specialized ecosystem roles.
- **`/admin/conversations`** — Moderation tool for platform chat abuse flags.
- **`/admin/settings`** — Global site configuration.

---

## ⚙️ 11. Core System & Error States
- **`/settings`** — Global user preferences (Language, Theme, Security).
- **`/notifications`** — Centralized alert hub.
- **`/about`, `/contact`, `/help`** — Static policy and FAQ pages.
- **`/error`** — Fallback 500 internal server error page.
- **`*` (Catch-all)** — Custom 404 Not Found page.
