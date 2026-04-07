# Aurora Services Architecture — Specialized Verticals

This document outlines the specialized expansion of the Aurora Services module, decoupling it from a generic structure into professional verticals.

## 1. Domain Coverage

| Vertical | Route | Icon | Theme | Purpose |
|----------|-------|------|-------|---------|
| **Programmer** | `/services/programmer` | `Code` | Cyan | Software Engineering & DevOps |
| **Translator** | `/services/translator` | `Globe` | Amber | Linguistic & Global Localization |
| **Designer** | `/services/designer` | `Palette` | Violet | Creative Identity & UI/UX |
| **Home Services** | `/services/home` | `Wrench` | Emerald | Facility Maintenance & Repair |

## 2. Technical Architecture

### 2.1 Database Schema (`services_expansion.sql`)
Each vertical has a dedicated profile table linked to `auth.users`:
- `svc_programmer_profiles`: Tech stack, GitHub, hourly rates.
- `svc_translator_profiles`: Language pairs, certifications.
- `svc_designer_profiles`: Tools, portfolio links (Behance, Dribbble).
- `svc_home_service_profiles`: Service types, coverage area, licensing.

### 2.2 Layout System
The `ServicesLayout` acts as a specialized shell for these verticals, providing:
- Vertical-adaptive header (`ServicesVerticalHeader`).
- Dynamic theme injection (CSS variables mapping).
- Quick-access floating navigation.

### 2.3 Authentication Flow
- **Unified Signup**: `ServiceProviderSignup` adaptively renders fields based on the `vertical` query parameter.
- **Provider Role**: Users are tagged with `role: 'service_provider'` and their respective `vertical` in their `user_metadata`.

## 3. Integration Plan

### Routing Registry
Routes are registered in `src/routes/services.routes.tsx` using specialized grouping:
- Generic Marketplace (`/services`)
- Vertical Hubs (`/services/[programmer|translator|designer|home]`)
- Provider Auth (`/services/provider/[signup|login]`)
- Shared Dashboard (`/services/dashboard`)

### Header Logic
The `ServicesVerticalHeader` detects the current path and re-skins itself (colors, icons, taglines) to match the vertical being viewed, creating a premium, bespoke experience for each category.

## 4. Scaling
To add a new vertical (e.g., "Legal"):
1. Create `svc_legal_profiles` table.
2. Add "legal" to the `Vertical` type in `ServicesVerticalHeader` and `ServiceProviderSignup`.
3. Create a `LegalLanding` page.
4. Register the route in `services.routes.tsx`.
