# Aurora Evolution Plan: Modernization & Security Hardening

This document outlines the strategic improvements to the Aurora e-commerce platform, focusing on visual excellence, consistent architecture, and robust security.

## 1. Visual Evolution: Glassmorphism Core
We are transitioning the entire platform to a **Glassmorphic Design System**. This involves moving away from flat, opaque backgrounds to a layered, translucent aesthetic.

### Key Components Modernized:
- [x] **Global Header**: Implemented high-fidelity translucency, dynamic scroll transitions, and floating neon search states.
- [x] **Product Discovery (List & Sidebar)**: Refactored discovery engine into glass-paneled controls with neon accent gradients and premium card aesthetics.
- [x] **User Profile & Settings**: Converted complex forms into glass-card layouts with improved visual hierarchy and readability.
- [x] **Authentication Flow**: Modernized Login and Signup with immersive translucent surfaces.
- [x] **Mobile Experience**: Optimized drawer-based navigation and filtering for a high-performance mobile feel.
- [x] **Product Detail & Cart**: Modernized with glassmorphic cards and optimized layouts.

---

## 2. Technical Stability: Casing & Import Cleanup
The project has accumulated technical debt due to Case-Sensitive file naming conflicts (e.g., `Input.tsx` vs `input.tsx`). 

### Action Plan:
- [x] **Standardize UI Filenames**: Rename all core UI components to lowercase (standard React convention for utilities).
- [x] **Centralize Imports**: Redirect all components to use the `@/components/ui` barrel file to prevent fragmented import paths.
- [x] **CI/CD Stabilization**: Fix casing issues that may cause build failures on case-sensitive environments (Vercel/Linux).

---

## 3. Security Hardening: Beyond the Frontend
Security must be enforced at the data layer, not just the UI layer.

### Action Plan:
- [ ] **Supabase RLS Policies**: 
    - Implement Row Level Security for the `orders` table (only owners can read/update).
    - Harden the `admin_users` table to ensure non-admins cannot elevate privileges.
- [ ] **Server-Side Price Integrity**: (COMPLETED) Re-verify all cart totals against DB prices during order submission.
- [ ] **Audit Logging**: Ensure critical actions (Sign In, Checkout, Admin changes) are captured in the `audit_logs` table.

---

## 4. Feature Enhancements: User Experience
- [ ] **Smart Search**: Implement auto-suggestions and visual search results in the glass header.
- [ ] **Dynamic Language Switching**: Improve the Globe switcher with more intuitive flag/language pairings.
- [ ] **Dark Mode Optimization**: Fine-tune contrast ratios for glass panels in dark mode.

---

> [!NOTE]
> This roadmap is living documentation. Progress will be tracked via task lists and audit reports.
