# 🧪 Quick Start Testing Guide

**Dev Server:** `http://localhost:5173`  
**Status:** Ready for Testing  

---

## 🚀 Quick Test (5 Minutes)

### **Test 1: Healthcare Flow** ✅
```
1. Go to: http://localhost:5173/services/health
   Expected: Healthcare landing page with hero section

2. Click: "Browse Doctors" or go to: /services/health/doctors
   Expected: Doctor list with filters

3. Click on any doctor or go to: /services/health/doctor/:id
   Expected: Doctor profile with booking widget

4. Click "Book Appointment" or go to: /services/health/book/:id
   Expected: Booking form (login required)

5. After booking, go to: /services/health/patient/dashboard
   Expected: Patient dashboard with appointments
```

### **Test 2: Tech Services Flow** ✅
```
1. Go to: http://localhost:5173/services/tech
   Expected: Tech landing with categories (Developers, Designers, etc.)

2. Click: "Developers" or go to: /services/tech/developers
   Expected: Freelancer list

3. Click on freelancer: /services/tech/freelancer/:id
   Expected: Freelancer profile with hourly rate, skills
```

### **Test 3: Wallet Flow** ✅
```
1. Login first
2. Go to: http://localhost:5173/wallet
   Expected: Wallet dashboard with balance

3. Go to: /wallet/transactions
   Expected: Transaction history

4. Go to: /wallet/payouts
   Expected: Payout request form
```

### **Test 4: Services Hub** ✅
```
1. Go to: http://localhost:5173/services
   Expected: Services gateway/marketplace home

2. Click any category: /services/:categorySlug
   Expected: Service listings

3. Click service: /services/listing/:id
   Expected: Service detail page
```

---

## 🔐 Authentication Tests

### Test Role-Based Access
```
1. Logout (if logged in)
2. Try accessing: /wallet
   Expected: Redirect to /login

3. Try accessing: /services/health/patient/dashboard
   Expected: Redirect to /login

4. Login as regular user
5. Try accessing: /admin
   Expected: Access denied or redirect

6. Try accessing: /delivery (as non-delivery)
   Expected: Access denied
```

---

## 📱 Mobile Responsive Tests

Open DevTools (F12) → Toggle Device Toolbar → Test on:
- iPhone 12/13/14 (390x844)
- iPad (768x1024)
- Desktop (1920x1080)

**Check:**
- [ ] Navigation collapses to hamburger menu
- [ ] Cards stack vertically on mobile
- [ ] Buttons are touch-friendly (min 44px)
- [ ] Text is readable without zooming
- [ ] Forms are usable on mobile

---

## 🌙 Dark Mode Tests

1. Click theme toggle (if available in header)
2. Visit each page and verify:
   - [ ] Background is dark (not white)
   - [ ] Text is light (not black)
   - [ ] Cards have dark backgrounds
   - [ ] Borders are subtle (dark gray)
   - [ ] Images/icons still visible

---

## ⚡ Performance Tests

### Page Load Time
Open DevTools → Network tab → Disable cache → Reload

**Target:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle Size: < 500KB (gzipped)

### Test These Pages:
- [ ] `/services/health` (Healthcare landing)
- [ ] `/services/tech` (Tech landing)
- [ ] `/products` (Product list)
- [ ] `/wallet` (Wallet dashboard)

---

## 🐛 Common Issues to Watch For

### 1. Route Not Found (404)
```
Symptom: Page shows "404 Not Found"
Check: 
- Route exists in App.tsx
- Component is imported correctly
- Component is exported correctly
```

### 2. Blank Page
```
Symptom: Page loads but is blank
Check:
- Browser console for errors
- Component returns JSX
- Data fetching doesn't have errors
```

### 3. Authentication Redirect Loop
```
Symptom: Redirects to login repeatedly
Check:
- ProtectedRoute logic
- Auth context state
- User role matches allowedAccountTypes
```

### 4. Component Not Rendering
```
Symptom: Route works but component doesn't show
Check:
- Component has return statement
- No early returns due to conditions
- Data loading state completes
```

---

## 📊 Test Results Template

Copy this for each test session:

```markdown
## Test Session - [DATE]

**Tester:** [Your Name]
**Duration:** [X] minutes
**Browser:** Chrome/Firefox/Safari/Edge

### Passed Tests: [X]/[Total]
### Failed Tests: [X]/[Total]

#### Critical Issues:
1. [Route] - [Issue description]

#### Medium Issues:
1. [Route] - [Issue description]

#### Low Priority:
1. [Route] - [Issue description]

#### Notes:
- [Any observations]
```

---

## 🎯 Priority Testing Order

If you only have 30 minutes, test these **critical flows**:

1. **Healthcare** (10 min)
   - `/services/health/doctors`
   - `/services/health/doctor/:id`
   - `/services/health/book/:id`
   - `/services/health/patient/dashboard`

2. **Services Core** (5 min)
   - `/services`
   - `/services/listing/:id`

3. **Wallet** (5 min)
   - `/wallet`
   - `/wallet/transactions`

4. **Authentication** (5 min)
   - Protected routes redirect when logged out
   - Role-based access works

5. **Mobile Responsive** (5 min)
   - Test healthcare flow on mobile viewport

---

## ✅ Success Criteria

A test is considered **PASSED** if:

1. ✅ Route loads without 404
2. ✅ Component renders correctly
3. ✅ No console errors
4. ✅ Data loads (if applicable)
5. ✅ Interactions work (buttons, forms)
6. ✅ Responsive on mobile
7. ✅ Works in dark mode
8. ✅ Authentication works correctly

---

**Ready to test? Open your browser and start with the Quick Test section!** 🚀

**Dev Server:** http://localhost:5173  
**Full Checklist:** [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
