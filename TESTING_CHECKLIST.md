# 🧪 Services Marketplace - Testing Checklist

**Date:** March 27, 2026  
**Version:** 2.6.0  
**Status:** In Progress  

---

## 🚀 How to Use This Checklist

1. Open browser to `http://localhost:5173`
2. Go through each test flow systematically
3. Mark each test as ✅ Pass or ❌ Fail
4. Document any issues in the notes section

---

## 1️⃣ Healthcare Vertical Testing

### Flow: Browse Doctors → View Profile → Book Appointment → Patient Dashboard

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **1.1** | `/services/health` | Health landing page loads with hero, categories | ⬜ | |
| **1.2** | `/services/health/doctors` | Doctor list loads with filters | ⬜ | |
| **1.3** | `/services/health/doctor/:id` | Doctor profile with details, availability | ⬜ | |
| **1.4** | `/services/health/book/:id` | Booking form with date/time selection | ⬜ | |
| **1.5** | `/services/health/patient/dashboard` | Patient dashboard with stats, appointments | ⬜ | |
| **1.6** | `/services/health/doctor/signup` | Doctor signup form (if not doctor) | ⬜ | |
| **1.7** | `/services/health/pharmacies` | Pharmacy list loads | ⬜ | |

### Authentication Tests
| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| **1.8** | Access `/health/book/:id` without login | Redirect to login | ⬜ |
| **1.9** | Access `/health/patient/dashboard` without login | Redirect to login | ⬜ |
| **1.10** | Access `/health/doctor/dashboard` as non-doctor | Access denied/redirect | ⬜ |

---

## 2️⃣ Tech/Freelance Vertical Testing

### Flow: Browse Tech → View Freelancer → Profile

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **2.1** | `/services/tech` | Tech landing page with categories, featured freelancers | ⬜ | |
| **2.2** | `/services/tech/developers` | Freelancer list filtered by developers | ⬜ | |
| **2.3** | `/services/tech/designers` | Freelancer list filtered by designers | ⬜ | |
| **2.4** | `/services/tech/freelancer/:id` | Freelancer profile with skills, rates | ⬜ | |
| **2.5** | `/services/tech/hire/:id` | Hire form (if component exists) | ⬜ | |
| **2.6** | `/services/tech/dashboard` | Freelancer dashboard (if freelancer) | ⬜ | |

---

## 3️⃣ Home Services Vertical Testing

### Flow: Browse Home Services → View Provider → Book

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **3.1** | `/services/home` | Home services landing with categories | ⬜ | |
| **3.2** | `/services/home/plumbers` | Service provider list | ⬜ | |
| **3.3** | `/services/home/electricians` | Electricians list | ⬜ | |
| **3.4** | `/services/home/provider/:id` | Provider profile | ⬜ | |
| **3.5** | `/services/home/book/:id` | Booking form | ⬜ | |
| **3.6** | `/services/home/dashboard` | Provider dashboard (if provider) | ⬜ | |

---

## 4️⃣ Custom Services Vertical Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **4.1** | `/services/custom` | Custom services landing | ⬜ | |
| **4.2** | `/services/custom/photographers` | Photographers list | ⬜ | |
| **4.3** | `/services/custom/events` | Event services list | ⬜ | |
| **4.4** | `/services/custom/provider/:id` | Provider profile | ⬜ | |
| **4.5** | `/services/custom/book/:id` | Booking form | ⬜ | |
| **4.6** | `/services/custom/dashboard` | Provider dashboard | ⬜ | |
| **4.7** | `/services/custom/portfolio` | Portfolio page | ⬜ | |

---

## 5️⃣ Services Marketplace Core Testing

### Flow: Services Hub → Category → Detail → Book

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **5.1** | `/services` | Services gateway/home page | ⬜ | |
| **5.2** | `/services/:categorySlug` | Category page with listings | ⬜ | |
| **5.3** | `/services/listing/:id` | Service detail page | ⬜ | |
| **5.4** | `/services/listing/:id/book` | Booking page | ⬜ | |
| **5.5** | `/services/provider/:id` | Provider profile | ⬜ | |
| **5.6** | `/services/messages` | Services inbox (if exists) | ⬜ | |
| **5.7** | `/services/dashboard` | Provider dashboard | ⬜ | |
| **5.8** | `/services/onboarding` | Service provider onboarding | ⬜ | |
| **5.9** | `/services/create-profile` | Create provider profile form | ⬜ | |
| **5.10** | `/services/create-listing` | Create service listing | ⬜ | |

---

## 6️⃣ Wallet Routes Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **6.1** | `/wallet` | Wallet dashboard with balance | ⬜ | |
| **6.2** | `/wallet/transactions` | Transaction history | ⬜ | |
| **6.3** | `/wallet/payouts` | Payout request form | ⬜ | |
| **6.4** | `/wallet/payout-history` | Payout history | ⬜ | |
| **6.5** | Access `/wallet` without login | Redirect to login | ⬜ | |

---

## 7️⃣ Delivery Routes Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **7.1** | `/delivery` (as delivery_driver) | Delivery dashboard | ⬜ | |
| **7.2** | `/delivery/verify-cod` (as delivery_driver) | COD verification | ⬜ | |
| **7.3** | `/delivery` (as regular user) | Access denied/redirect | ⬜ | |

---

## 8️⃣ Customer Routes Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **8.1** | `/customer/orders/tracking` | Order tracking page | ⬜ | |
| **8.2** | Access without login | Redirect to login | ⬜ | |

---

## 9️⃣ Seller Routes Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **9.1** | `/seller/commission` (as seller) | Commission report | ⬜ | |
| **9.2** | `/seller/commission` (as non-seller) | Access denied | ⬜ | |

---

## 🔟 Factory Routes Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **10.1** | `/factory` (as factory) | Factory dashboard | ⬜ | |
| **10.2** | `/factory/production` | Production tracking | ⬜ | |
| **10.3** | `/factory/quotes` | Quote requests | ⬜ | |
| **10.4** | `/factory/connections` | Factory connections | ⬜ | |
| **10.5** | `/factory/start-chat` | Start chat with seller | ⬜ | |

---

## 1️⃣1️⃣ Middleman Routes Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **11.1** | `/middleman` (as middleman) | Middleman dashboard | ⬜ | |
| **11.2** | `/middleman/deals` | Deals list | ⬜ | |
| **11.3** | `/middleman/deals/new` | Create deal form | ⬜ | |
| **11.4** | `/middleman/analytics` | Analytics dashboard | ⬜ | |

---

## 1️⃣2️⃣ Admin Routes Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **12.1** | `/admin` (as admin) | Admin dashboard | ⬜ | |
| **12.2** | `/admin/users` | Users management | ⬜ | |
| **12.3** | `/admin/products` | Products management | ⬜ | |
| **12.4** | `/admin/orders` | Orders management | ⬜ | |
| **12.5** | `/admin/delivery` | Delivery management | ⬜ | |
| **12.6** | `/admin` (as non-admin) | Access denied | ⬜ | |

---

## 1️⃣3️⃣ Unified Messaging Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **13.1** | `/messages` (logged in) | Unified inbox | ⬜ | |
| **13.2** | `/messages/:conversationId` | Chat conversation | ⬜ | |
| **13.3** | `/chat` (logged in) | Chat layout | ⬜ | |

---

## 1️⃣4️⃣ Products & E-commerce Testing

| Test | Route | Expected Result | Status | Notes |
|------|-------|-----------------|--------|-------|
| **14.1** | `/` | Services gateway (home) | ⬜ | |
| **14.2** | `/products` | Product list | ⬜ | |
| **14.3** | `/products/:asin` | Product detail | ⬜ | |
| **14.4** | `/cart` | Shopping cart | ⬜ | |
| **14.5** | `/checkout` | Checkout page | ⬜ | |
| **14.6** | `/orders` | Order history | ⬜ | |
| **14.7** | `/wishlist` | Wishlist | ⬜ | |

---

## 🐛 Issues Log

### Critical Issues (Blocking)
| ID | Route | Issue | Severity | Status |
|----|-------|-------|----------|--------|
| | | | | |

### Medium Issues (Non-Blocking)
| ID | Route | Issue | Severity | Status |
|----|-------|-------|----------|--------|
| | | | | |

### Low Priority (Cosmetic)
| ID | Route | Issue | Severity | Status |
|----|-------|-------|----------|--------|
| | | | | |

---

## ✅ Test Summary

### Overall Status
- **Total Tests:** 80+
- **Passed:** ⬜
- **Failed:** ⬜
- **Blocked:** ⬜
- **Not Tested:** ⬜

### By Vertical
| Vertical | Tests | Pass | Fail | Blocked | % Pass |
|----------|-------|------|------|---------|--------|
| Healthcare | 10 | ⬜ | ⬜ | ⬜ | - |
| Tech/Freelance | 6 | ⬜ | ⬜ | ⬜ | - |
| Home Services | 6 | ⬜ | ⬜ | ⬜ | - |
| Custom Services | 7 | ⬜ | ⬜ | ⬜ | - |
| Services Core | 10 | ⬜ | ⬜ | ⬜ | - |
| Wallet | 5 | ⬜ | ⬜ | ⬜ | - |
| Delivery | 3 | ⬜ | ⬜ | ⬜ | - |
| Customer | 2 | ⬜ | ⬜ | ⬜ | - |
| Seller | 2 | ⬜ | ⬜ | ⬜ | - |
| Factory | 5 | ⬜ | ⬜ | ⬜ | - |
| Middleman | 4 | ⬜ | ⬜ | ⬜ | - |
| Admin | 6 | ⬜ | ⬜ | ⬜ | - |
| Messaging | 3 | ⬜ | ⬜ | ⬜ | - |
| Products | 7 | ⬜ | ⬜ | ⬜ | - |

---

## 📝 Testing Notes

### General Observations
- 

### Performance Notes
- 

### UX Feedback
- 

### Security Concerns
- 

---

**Testing Started:** _______________  
**Testing Completed:** _______________  
**Tester:** _______________  
**Overall Result:** ⬜ PASS / ⬜ FAIL / ⬜ NEEDS FIXES
