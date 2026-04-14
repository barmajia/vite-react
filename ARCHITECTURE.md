# Architecture Overview

This document provides a concise map of the frontend architecture for the Aurora E‑commerce frontend (vite-react).

- Core tech stack: React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, Supabase JS, Stripe.
- Code organization:
  - src/
    - components/ reusable UI components
    - hooks/ custom React hooks
    - lib/ services/utilities (Supabase client, crypto helpers, API adapters)
    - pages/ route pages
    - store/ state management (Zustand stores)
    - types/ TypeScript type definitions
    - i18n/ internationalization setup
  - routes/ for app routing with role-based sections (admin, middleman, seller, factory, health, etc.)
  - e2e/ Playwright tests for end-to-end coverage
  - webss/ docs and schema exploration artifacts (Schema Explorer and ER canvas)
  - supabase/ migrations and SQL docs for data model reference

- Design goals:
  - Clear module boundaries: UI components, business logic, and data access are separated.
  - Testability: auth flows, API clients, and data-layer operations are isolated for unit testing.
  - Security-conscious defaults: environment-based secrets, PKCE flow, cookie storage with secure handling.
  - Performance: code-splitting via Vite Rollup options; vendor/ui/query/state chunking to optimize initial load.

- Suggested refactor roadmap (short-term):
  1) Extract complex auth callback logic into a dedicated flow service (done partially via authFlow.ts).
  2) Introduce a small AuthFlow interface to decouple UI from business logic (in-progress).
  3) Improve repo hygiene by moving heavy schema/docs artifacts into a docs/ directory and adding a short repo map.
  4) Add targeted unit tests for the new auth flow service and the hash parser helper.

- Risks and checks:
  - Ensure new services align with existing TS config strictness.
  - Verify that tests cover the new modules and that path aliases resolve in tsconfig/vite config.
