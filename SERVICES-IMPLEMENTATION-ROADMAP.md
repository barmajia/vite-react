# Services Marketplace - Implementation Roadmap

## 📊 Current Status

### ✅ **Completed** (70%)

| Feature | Status | Files |
|---------|--------|-------|
| **Database Schema** | ✅ | `services-marketplace-schema.sql` |
| **Services Messaging** | ✅ | `ServicesInbox.tsx`, `ServicesChat.tsx` |
| **Provider Dashboard Layout** | ✅ | `DashboardLayout.tsx`, `DashboardSidebar.tsx` |
| **Dashboard Home** | ✅ | `DashboardHome.tsx` |
| **Onboarding Wizard** | ✅ | `OnboardingWizard.tsx` |
| **Notification System** | ✅ | `useNotifications.ts`, `NotificationBell.tsx` |
| **Fawry Payment Integration** | ✅ | `create-fawry-payment` Edge Function |

### ⚠️ **In Progress** (20%)

| Feature | Status | Next Steps |
|---------|--------|------------|
| **Availability System** | 🔄 | Run migration, build UI |
| **Booking Conflict Prevention** | 🔄 | Run migration |
| **Escrow Payment Logic** | 🔄 | Run migration, test RPC |
| **Reviews & Ratings** | 🔄 | Run migration, build UI |

### ❌ **Not Started** (10%)

| Feature | Priority | Estimated Time |
|---------|----------|----------------|
| **Service Detail Page with Booking Widget** | HIGH | 4 hours |
| **Bookings Manager (Calendar + List)** | HIGH | 4 hours |
| **Client Booking Flow** | HIGH | 3 hours |
| **Geolocation for Services** | LOW | 2 hours |

---

## 🚀 **Immediate Next Steps**

### **Step 1: Run Database Migration** (15 minutes)

**File:** `services-marketplace-complete-migration.sql`

This migration adds:
- ✅ `service_availability` table (weekly schedules + blocked dates)
- ✅ `service_reviews` table (5-star ratings + provider responses)
- ✅ `provider_wallets` table (balance tracking)
- ✅ `wallet_transactions` table (escrow tracking)
- ✅ Booking conflict prevention trigger
- ✅ Auto-update provider rating trigger
- ✅ `hold_escrow_funds()` RPC function
- ✅ `release_escrow_funds()` RPC function

**How to Run:**
1. Open Supabase SQL Editor
2. Copy entire content of `services-marketplace-complete-migration.sql`
3. Paste and Run
4. Verify tables created (check Table Editor)

---

### **Step 2: Build Service Detail Page** (4 hours)

**File:** `src/features/services/pages/ServiceDetailPage.tsx` (replace existing)

**Features:**
- Service description & images
- Provider profile card
- **Booking Widget:**
  - Date picker (from available slots)
  - Time slot selector
  - Customer notes field
  - Price calculation
  - "Book Now" button → Creates `service_booking` + Fawry payment

**Components Needed:**
```tsx
<ServiceGallery images={listing.images} />
<ProviderCard provider={provider} />
<BookingWidget listingId={listing.id} providerId={provider.id} />
<ReviewsList listingId={listing.id} />
```

---

### **Step 3: Build Bookings Manager** (4 hours)

**File:** `src/features/services/dashboard/pages/BookingsPage.tsx`

**Features:**
- **Calendar View:** Monthly/Weekly/Daily
- **List View:** All bookings with filters
- **Actions:**
  - Accept/Reject booking requests
  - Reschedule (provider initiated)
  - Cancel (with reason)
  - Mark as completed
- **Availability Settings:**
  - Weekly schedule editor
  - Blocked dates calendar

**UI Libraries:**
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
```

---

### **Step 4: Client Booking Flow** (3 hours)

**File:** `src/features/services/pages/MyBookingsPage.tsx`

**Features:**
- Upcoming bookings
- Past bookings
- Booking details modal
- "Start Chat" button
- "Leave Review" button (after completion)

---

### **Step 5: Reviews UI** (2 hours)

**File:** `src/features/services/components/ReviewsList.tsx`

**Features:**
- Star rating display
- Filter by rating
- Provider responses
- "Was this helpful?" (future)

**File:** `src/features/services/components/ReviewForm.tsx`

**Features:**
- 5-star rating (overall, communication, quality, value)
- Title + Comment
- Photo upload (optional)

---

## 📁 **File Structure**

```
src/features/services/
├── pages/
│   ├── ServicesGateway.tsx ✅
│   ├── ServiceCategoryPage.tsx ✅
│   ├── ServiceDetailPage.tsx ⚠️ NEEDS BOOKING WIDGET
│   ├── ProviderProfilePage.tsx ✅
│   ├── MyBookingsPage.tsx ❌ TO BUILD
│   └── ReviewsPage.tsx ❌ TO BUILD
├── components/
│   ├── ServiceListingCard.tsx ✅
│   ├── ServiceProviderCard.tsx ✅
│   ├── BookingWidget.tsx ❌ TO BUILD
│   ├── ReviewsList.tsx ❌ TO BUILD
│   ├── ReviewForm.tsx ❌ TO BUILD
│   └── AvailabilityCalendar.tsx ❌ TO BUILD
├── dashboard/
│   ├── components/layout/
│   │   ├── DashboardSidebar.tsx ✅
│   │   └── DashboardLayout.tsx ✅
│   ├── pages/
│   │   ├── DashboardHome.tsx ✅
│   │   ├── BookingsPage.tsx ❌ TO BUILD
│   │   ├── ListingsPage.tsx ❌ TO BUILD
│   │   ├── FinancePage.tsx ❌ TO BUILD
│   │   └── SettingsPage.tsx ❌ TO BUILD
│   └── hooks/
│       ├── useProviderAnalytics.ts ✅
│       └── useRecentBookings.ts ✅
└── hooks/
    ├── useServices.ts ✅
    └── useServiceBookings.ts ❌ TO BUILD
```

---

## 💰 **Escrow Payment Flow**

### **For Freelance Projects:**

```
1. Client books project → $500
   ↓
2. Payment charged via Fawry
   ↓
3. hold_escrow_funds(booking_id) called
   ↓
4. $500 moved to provider.pending_balance
   ↓
5. Freelancer works on project
   ↓
6. Client approves milestone
   ↓
7. release_escrow_funds(booking_id) called
   ↓
8. $500 moved to provider.available_balance
   ↓
9. Provider requests payout → Bank transfer
```

### **For Appointments (Doctors):**

```
1. Client books appointment → $50
   ↓
2. Deposit charged (e.g., 20% = $10)
   ↓
3. hold_escrow_funds(booking_id) with deposit only
   ↓
4. Appointment happens
   ↓
5. Provider marks as completed
   ↓
6. Full amount released ($50)
   ↓
7. Platform takes commission (e.g., 10% = $5)
   ↓
8. Provider receives $45
```

---

## 🎯 **Priority Matrix**

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| **Service Detail + Booking** | HIGH | MEDIUM | **P0** |
| **Bookings Manager** | HIGH | MEDIUM | **P0** |
| **Escrow Logic** | HIGH | LOW | **P0** |
| **Reviews System** | MEDIUM | LOW | **P1** |
| **Availability UI** | MEDIUM | MEDIUM | **P1** |
| **Geolocation** | LOW | LOW | **P2** |

---

## ✅ **Testing Checklist**

### **Before Production:**

- [ ] Test booking conflict prevention (try double booking same slot)
- [ ] Test escrow hold/release flow
- [ ] Test review submission (only after completed booking)
- [ ] Test provider rating auto-update
- [ ] Test availability blocking
- [ ] Test Fawry payment integration
- [ ] Test notification triggers
- [ ] Test RLS policies (unauthorized access attempts)

---

## 📅 **Timeline Estimate**

| Phase | Tasks | Time |
|-------|-------|------|
| **Database Setup** | Run migration, verify | 30 min |
| **Booking Flow** | Service Detail + Widget + Payment | 6 hours |
| **Dashboard** | Bookings Manager + Availability | 6 hours |
| **Reviews** | Review form + display | 3 hours |
| **Testing** | Full QA + bug fixes | 4 hours |
| **TOTAL** | | **~20 hours** |

**With focused work: 2-3 days to production-ready**

---

## 🚨 **Critical Dependencies**

1. **Database Migration MUST run first** (blocks everything else)
2. **Fawry credentials** must be set in Supabase Secrets
3. **Provider profiles** must exist before testing bookings
4. **Service listings** must exist before testing detail page

---

**Ready to execute? Start with Step 1 (Database Migration) now!** 🚀
