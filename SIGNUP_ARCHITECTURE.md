# Aurora Platform: Signup Flows & Database Architecture

This document summarizes the authentication methodologies, data collection paths, and the relational database architecture supporting user onboarding across the Aurora ecosystem.

## 1. Core Authentication Flow

The platform utilizes **Supabase Auth** as the primary identity provider, integrated with a **PostgreSQL** backend for profile management.

### The Unified Process:
1.  **Client-Side Validation**: Forms use custom types (`src/types/signup.ts`) and validation logic to ensure data integrity.
2.  **Auth Injection**: The `useAuth` hook (`src/hooks/useAuth.tsx`) sanitizes inputs and calls `supabase.auth.signUp()`.
3.  **Metadata Capture**: Role-specific attributes are passed into the `options.data` (stored in Supabase as `raw_user_meta_data`).
4.  **Database Sync**: A PostgreSQL trigger `handle_new_user()` creates a corresponding record in the `public.users` table upon successful auth registration.

---

## 2. User Roles & Account Types

The system supports several specialized roles, each with unique metadata requirements and table connections:

| Role | `account_type` | Primary Metadata | Key Tables |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer` | Full Name, Phone | `users` |
| **Seller** | `seller` | Store Name, Location, Currency | `users`, `business_profiles` |
| **Factory** | `factory` | Production Capacity, MOQ, Wholesale Discount | `users`, `business_profiles`, `factory_profiles`* |
| **Middleman** | `middleman` | Commission Rate, Specialization, Tax ID | `users`, `business_profiles`, `middleman_profiles` |
| **Delivery** | `delivery` | Vehicle Type, Plate Number, Location | `users`, `delivery_profiles`* |

> \* *Note: Profiles for specialized roles like Factory and Delivery are either built via the master trigger or specialized signup pages that perform multi-table insertions.*

---

## 3. Relational Table Mapping

### A. Central Identity Tables
*   **`auth.users` (Internal)**: Managed by Supabase. Stores credentials, email verification, and raw JSON metadata.
*   **`public.users`**: The application's "Source of Truth" for user profiles.
    *   `user_id` (FK to `auth.users.id`)
    *   `account_type` (Role discriminator)
    *   `full_name`, `email`, `phone`, `avatar_url`

### B. Business & Role Tables
Used to store extended data for commercial users:
*   **`public.business_profiles`**: Common fields for Sellers, Factories, and Middlemen (Location, Currency, Verification Status).
*   **`public.middleman_profiles`**: Deep business data for brokers (Tax ID, License URLs, Experience).
*   **`public.svc_providers`**: Specifically for the **Services Gateway** sub-system (Healthcare, Freelancers).

---

## 4. Specialized Signup Flows

### 1. The Standard Signup (`/signup`)
A switch-based form that handles **Customer**, **Seller**, **Factory**, and **Delivery** signups via the `useAuth.signUp()` method.

### 2. Middleman Onboarding (`/signup/middleman`)
A multi-step dedicated flow (`MiddlemanSignup.tsx`) that handles:
*   Document uploads (Business License) to Supabase Storage.
*   Sequential insertions into `users`, `business_profiles`, and `middleman_profiles`.
*   Verification state management (starts as `pending`).

### 3. Services Gateway Signup
Used for service-based professionals (Hospitals, Companies, Individuals).
*   Uses `signUpWithRole` in `useAuth`.
*   Discriminates between `user` (Client) and `provider` (Professional).
*   Eventually connects to `public.svc_providers`.

---

## 5. Security Architecture
*   **Input Sanitization**: All auth hooks utilize `sanitize.ts` to prevent SQL Injection and XSS.
*   **Rate Limiting**: `security.ts` provides tiered rate limits for login and signup attempts based on email/IP.
*   **Trigger Validation**: The database trigger validates `account_type` against an allowed list before profile creation.
