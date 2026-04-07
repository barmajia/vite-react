# 🛎️ Services Pages - Complete Source Code

> Generated: April 6, 2026
> Total Files: 40
> Directory: `src/features/services/`

---

## Table of Contents

1. [Layouts](#layouts)
2. [Pages](#pages)
3. [Dashboard Pages](#dashboard-pages)
4. [Booking Pages](#booking-pages)
5. [Components](#components)
6. [Dashboard Components](#dashboard-components)
7. [Booking Components](#booking-components)

---

## Layouts

### ServicesLayout.tsx
**Path:** `src/features/services/layouts/ServicesLayout.tsx`

```tsx
// src/features/services/layouts/ServicesLayout.tsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ServicesVerticalHeader } from "../components/ServicesVerticalHeader";
import { Shield, Activity, Code, Globe, Palette, Wrench } from "lucide-react";
import { ServicesChatFAB } from "../components/ServicesChatFAB";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ServicesLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getThemeColor = () => {
    if (location.pathname.includes("/services/programmer")) return "cyan";
    if (location.pathname.includes("/services/translator")) return "amber";
    if (location.pathname.includes("/services/designer")) return "violet";
    if (location.pathname.includes("/services/home")) return "emerald";
    return "primary";
  };

  const themeColor = getThemeColor();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
         <div className={cn(
           "w-20 h-20 glass border animate-pulse rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-700",
           `bg-${themeColor}-500/10 border-${themeColor}-500/20 shadow-${themeColor}-500/30`
         )}>
            <Activity className={cn("h-10 w-10", `text-${themeColor}-500`)} />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20 italic animate-pulse">Syncing Services Matrix...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-8">
          <div className="w-24 h-24 rounded-[2.5rem] glass bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto shadow-2xl">
            <Shield className="w-10 w-10 text-red-500" />
          </div>
          <div className="space-y-4">
             <h2 className="text-4xl font-black italic tracking-tighter uppercase text-foreground">Operational Failure</h2>
             <p className="text-sm font-medium italic text-foreground/40 leading-relaxed">{error}</p>
          </div>
          <Button
            onClick={() => navigate("/services")}
            className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
          >
            Reconnect Matrix
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-1000">
      <ServicesVerticalHeader />
      <main className="pt-24 min-h-screen">
        <Outlet />
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] hidden lg:block">
         <div className="p-2 glass bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center gap-2 backdrop-blur-3xl shadow-2xl">
             {[
               { icon: Code, color: "cyan", path: "/services/programmer" },
               { icon: Globe, color: "amber", path: "/services/translator" },
               { icon: Palette, color: "violet", path: "/services/designer" },
               { icon: Wrench, color: "emerald", path: "/services/home" },
             ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-12 h-12 rounded-[1.5rem] flex items-center justify-center transition-all duration-500",
                    location.pathname.includes(item.path)
                      ? `bg-${item.color}-500 text-white shadow-lg shadow-${item.color}-500/40`
                      : "text-foreground/40 hover:text-foreground hover:bg-white/5"
                  )}
                >
                   <item.icon className="h-5 w-5" />
                </button>
             ))}
         </div>
      </div>

      <ServicesChatFAB />
    </div>
  );
};

export default ServicesLayout;
```

---

### DashboardLayout.tsx
**Path:** `src/features/services/dashboard/components/layout/DashboardLayout.tsx`

```tsx
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sign in required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to access the dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      <DashboardSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Provider Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg order-last">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

---

## Pages

*(Note: Due to file size, the full source for all 40 files is included in the repository. See individual files for complete source code.)*

### Key Pages Summary

| File | Path | Description |
|------|------|-------------|
| ServicesHome | `pages/ServicesHome.tsx` | Main services marketplace with categories, featured listings, search |
| ServiceCategoryPage | `pages/ServiceCategoryPage.tsx` | Category listing with filters, grid/list view, pagination |
| ServiceDetailPage | `pages/ServiceDetailPage.tsx` | Single service detail with gallery, booking sidebar |
| ProviderProfilePage | `pages/ProviderProfilePage.tsx` | Provider public profile with vertical themes |
| ServiceProviderSignup | `pages/ServiceProviderSignup.tsx` | Multi-step signup with vertical-specific fields |
| ServiceProviderLogin | `pages/ServiceProviderLogin.tsx` | Provider login page |
| CreateServiceListing | `pages/CreateServiceListing.tsx` | Create new service listing form |
| ProgrammerLanding | `pages/ProgrammerLanding.tsx` | Programmer vertical landing |
| TranslatorLanding | `pages/TranslatorLanding.tsx` | Translator vertical landing |
| DesignerLanding | `pages/DesignerLanding.tsx` | Designer vertical landing |
| HomeServicesLanding | `pages/HomeServicesLanding.tsx` | Home services vertical landing |
| ServicesMessagesPage | `pages/ServicesMessagesPage.tsx` | Services chat/messaging |
| ProjectWorkspace | `pages/ProjectWorkspace.tsx` | Project workspace with chat + milestones |

---

## Dashboard Pages

### DashboardHome.tsx
```tsx
import { useProviderAnalytics } from "../hooks/useProviderAnalytics";
import { useRecentBookings } from "../hooks/useRecentBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Star, Users, Briefcase, Calendar, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const DashboardHome = () => {
  const navigate = useNavigate();
  const { data: analytics, isLoading } = useProviderAnalytics();
  const { data: recentBookings } = useRecentBookings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <Briefcase className="h-16 w-16 text-violet-600 dark:text-violet-400 mb-4" />
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Profile Required</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Please complete your provider profile first</p>
        <Button onClick={() => navigate("/services/dashboard/onboard")} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50">
          Create Profile
        </Button>
      </div>
    );
  }

  const { profile, stats } = analytics;
  const isFreelance = profile.provider_type === "freelance";

  const kpiCards = [
    { title: "Total Revenue", value: `$${stats.totalRevenue}`, trend: "+20.1% from last month", icon: DollarSign, gradient: "from-emerald-500 to-teal-500" },
    { title: isFreelance ? "Active Projects" : "Pending Bookings", value: stats.pendingBookings, trend: "Requires attention", icon: isFreelance ? Briefcase : Calendar, gradient: "from-violet-500 to-purple-500" },
    { title: "Total Jobs", value: stats.completedJobs, trend: "Lifetime completions", icon: Users, gradient: "from-blue-500 to-cyan-500" },
    { title: "Rating", value: `${stats.rating}/5.0`, trend: "Based on recent reviews", icon: Star, gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-violet-500/30">
        <h2 className="text-3xl font-bold">Welcome back, {profile.provider_type || "Provider"}</h2>
        <p className="text-violet-100 mt-2">Here's what's happening with your services today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{card.title}</CardTitle>
              <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", card.gradient)}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">Recent {isFreelance ? "Projects" : "Bookings"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/services/dashboard/bookings")} className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings && recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-900 dark:text-white">{booking.listing?.title || "Service Request"}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{booking.customer_name || "Unknown Customer"} • {format(new Date(booking.ordered_at || booking.created_at), "MMM dd, yyyy")}</p>
                    </div>
                    <Badge className={cn("px-3 py-1 text-xs font-medium rounded-full", booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300")}>{booking.status}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No recent activity.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate("/services/dashboard/bookings")} className="border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20">View All Bookings</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md">
          <CardHeader><CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="w-full justify-between h-12 border-gray-200 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700 group" onClick={() => navigate("/services/dashboard/create-listing")}>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-400">Create New Listing</span>
              <PlusCircle className="h-4 w-4 text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

### BookingsPage.tsx
**Path:** `src/features/services/dashboard/pages/BookingsPage.tsx`
**Description:** Provider bookings/orders management with status filtering, milestone display, and action menus.

### Projects.tsx
**Path:** `src/features/services/dashboard/pages/Projects.tsx`
**Description:** Project management with status pipeline, search, filtering, and progress tracking.

### Listings.tsx
**Path:** `src/features/services/dashboard/pages/Listings.tsx`
**Description:** Provider listings management with CRUD operations, status toggle, and analytics.

### Finance.tsx
**Path:** `src/features/services/dashboard/pages/Finance.tsx`
**Description:** Financial dashboard with revenue charts, transaction history, and payout management.

### Clients.tsx
**Path:** `src/features/services/dashboard/pages/Clients.tsx`
**Description:** Client relationship management with booking history and engagement metrics.

### Settings.tsx
**Path:** `src/features/services/dashboard/pages/Settings.tsx`
**Description:** Provider settings with tabs for profile, availability, notifications, payments, and security.

---

## Booking Pages

### ServiceBookingPage.tsx
**Path:** `src/features/services/bookings/pages/ServiceBookingPage.tsx`
**Description:** Multi-step booking flow with conditional project/calendar views, milestone builder, and secure checkout.

---

## Components

### ServicesVerticalHeader.tsx
**Path:** `src/features/services/components/ServicesVerticalHeader.tsx`
**Description:** Vertical-specific header with navigation, search, auth dropdown, and theme toggle.

### ServicesChatFAB.tsx
**Path:** `src/features/services/components/ServicesChatFAB.tsx`
**Description:** Floating action button with quick-connect panel for messaging.

### ServiceListingCard.tsx
**Path:** `src/features/services/components/ServiceListingCard.tsx`
**Description:** Simple listing card component.

### ServiceProviderCard.tsx
**Path:** `src/features/services/components/ServiceProviderCard.tsx`
**Description:** Deprecated placeholder component.

### ServicesInbox.tsx
**Path:** `src/features/services/components/ServicesInbox.tsx`
**Description:** Services inbox with conversation list.

### ServicesMessagingLayout.tsx
**Path:** `src/features/services/components/ServicesMessagingLayout.tsx`
**Description:** Simple messaging layout wrapper.

### ServiceOnboardingWizard.tsx
**Path:** `src/features/services/components/ServiceOnboardingWizard.tsx`
**Description:** Two-step onboarding wizard for service providers with vertical-specific fields.

---

## Dashboard Components

### DashboardSidebar.tsx
**Path:** `src/features/services/dashboard/components/layout/DashboardSidebar.tsx`
**Description:** Responsive sidebar with role-based navigation items and mobile drawer.

---

## Booking Components

### BookingCalendar.tsx
**Path:** `src/features/services/bookings/components/BookingCalendar.tsx`
**Description:** 14-day date picker with time slot selection.

### BookingForm.tsx
**Path:** `src/features/services/bookings/components/BookingForm.tsx`
**Description:** Contact information form (unused in current booking flow).

### BookingSummary.tsx
**Path:** `src/features/services/bookings/components/BookingSummary.tsx`
**Description:** Booking summary card component (unused in current booking flow).

### ProjectMilestoneBuilder.tsx
**Path:** `src/features/services/bookings/components/ProjectMilestoneBuilder.tsx`
**Description:** Phased milestone builder for project-based bookings.

---

## Database Tables Used

| Table | Purpose |
|-------|---------|
| `svc_categories` | Service categories with subcategories |
| `svc_subcategories` | Subcategories for granular classification |
| `svc_listings` | Service listings (main service products) |
| `svc_providers` | Service provider profiles |
| `svc_orders` | Service bookings/orders |
| `svc_messages` | Chat messages between users |
| `users` | User data for client/provider info |
| `conversations` | Chat conversations |
| `conversation_participants` | Chat participants with roles |
| `notifications` | User notifications |

---

## Known Issues

1. **Settings.tsx** - Missing `useQuery` import from `@tanstack/react-query`
2. **Projects.tsx** - `allProjects` variable referenced but undefined (should be `projects || []`)
3. **BookingForm.tsx** - Imported but never used in ServiceBookingPage
4. **BookingSummary.tsx** - Imported but never used in ServiceBookingPage
5. **BookingCalendar.tsx** - Uses hardcoded time slots instead of real availability data

---

*Total Source Lines: ~15,000+ lines of TypeScript/React*
*Generated: April 6, 2026*
