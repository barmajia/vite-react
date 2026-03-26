# ═══════════════════════════════════════════════════════════
# AURORA E-COMMERCE - BACKEND FIXES DEPLOYMENT CHECKLIST
# ═══════════════════════════════════════════════════════════
# Quick Reference Card - Print this out!
# Date: March 25, 2026
# ═══════════════════════════════════════════════════════════

## 📋 PRE-DEPLOYMENT CHECKLIST

[ ] 1. Backup current database (Supabase Dashboard > Settings > Database)
[ ] 2. Create a staging environment for testing
[ ] 3. Notify team of planned deployment
[ ] 4. Schedule during low-traffic period (2-4 AM UTC recommended)
[ ] 5. Have rollback SQL ready (see bottom of this file)

---

## 🚀 DEPLOYMENT STEPS (In Order)

### STEP 1: RLS Policies (15 min) ⚠️ CRITICAL
□ Open Supabase SQL Editor
□ Copy-paste contents of: critical-rls-policies.sql
□ Click "Run"
□ Verify: 
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'payment_intentions';
  -- Should show 't' for rowsecurity
  ```

### STEP 2: Database Indexes (20 min)
□ Open Supabase SQL Editor
□ Copy-paste contents of: critical-database-indexes.sql
□ Click "Run" (safe - uses CONCURRENTLY)
□ Verify:
  ```sql
  SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
  -- Should show 100+ indexes
  ```

### STEP 3: Database Triggers (15 min)
□ Open Supabase SQL Editor
□ Copy-paste contents of: database-triggers-data-integrity.sql
□ Click "Run"
□ Verify:
  ```sql
  SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';
  -- Should show 15+ triggers
  ```

### STEP 4: Materialized Views (10 min)
□ Open Supabase SQL Editor
□ Copy-paste contents of: materialized-views-analytics.sql
□ Click "Run"
□ Verify:
  ```sql
  SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public';
  -- Should show 10 materialized views
  ```

### STEP 5: Edge Functions (20 min)
□ Open terminal
□ Run:
  ```bash
  supabase login
  supabase link --project-ref ofovfxsfazlwvcakpuer
  supabase functions deploy audit-log
  supabase functions deploy create-payment-intent
  supabase functions deploy process-async-jobs
  ```
□ Verify:
  ```bash
  supabase functions list
  ```

### STEP 6: Set Secrets (5 min)
□ Run:
  ```bash
  supabase secrets set STRIPE_SECRET_KEY=sk_YOUR_STRIPE_SECRET_KEY
  supabase secrets set AUDIT_LOG_ENABLED=true
  ```

### STEP 7: Update Frontend (30 min)
□ Update payment flow to use Edge Function
□ Add audit logging to security events
□ Test thoroughly

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Security Tests
[ ] Try to access another user's payment intentions (should fail)
[ ] Try to insert payment intention directly (should fail)
[ ] Check audit_logs table for entries

### Performance Tests
[ ] Load order history (should be < 100ms)
[ ] Search products (should be < 200ms)
[ ] Load analytics dashboard (should be < 500ms)

### Integration Tests
[ ] Create a test order
[ ] Process payment via Edge Function
[ ] Verify inventory decremented
[ ] Complete order (status = delivered)
[ ] Verify seller stats updated

---

## 🚨 ROLLBACK COMMANDS (If Issues Occur)

### Rollback RLS Policies
```sql
ALTER TABLE payment_intentions DISABLE ROW LEVEL SECURITY;
ALTER TABLE async_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots DISABLE ROW LEVEL SECURITY;
```

### Drop Specific Index
```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_user_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_products_seller_status_price;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_convo_created;
```

### Disable Specific Trigger
```sql
ALTER TABLE orders DISABLE TRIGGER trg_update_seller_stats_on_order_delivered;
ALTER TABLE products DISABLE TRIGGER trg_update_seller_product_count;
ALTER TABLE payment_intentions DISABLE TRIGGER trg_log_payment_status_change;
```

### Drop Materialized View
```sql
DROP MATERIALIZED VIEW IF EXISTS mv_daily_sales_summary;
DROP MATERIALIZED VIEW IF EXISTS mv_seller_performance;
```

### Undeploy Edge Function
```bash
supabase functions delete audit-log
supabase functions delete create-payment-intent
supabase functions delete process-async-jobs
```

---

## 📊 EXPECTED RESULTS

### Before → After

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Order history | 800ms | ? | < 100ms |
| Product search | 1200ms | ? | < 200ms |
| Chat loading | 600ms | ? | < 100ms |
| Analytics | 3000ms | ? | < 500ms |
| Payment security | ❌ | ? | ✅ |
| Audit logging | ❌ | ? | ✅ |

Fill in the "After" column during testing!

---

## 🆘 EMERGENCY CONTACTS

- **Database Issues:** Supabase Support (https://supabase.com/dashboard/support)
- **Edge Function Issues:** Check logs: `supabase functions logs <function-name>`
- **Security Incident:** Review audit_logs table immediately

---

## 📝 DEPLOYMENT NOTES

Deployment Date: _______________
Deployed By: _______________
Start Time: _______________
End Time: _______________
Issues Encountered: _______________________________________
__________________________________________________________
__________________________________________________________

Rollback Required? [ ] Yes [ ] No
If yes, reason: ___________________________________________

---

## 🎉 SUCCESS CRITERIA

Deployment is successful when:
[ ] All SQL migrations run without errors
[ ] All Edge Functions deployed and responding
[ ] No 500 errors in application logs
[ ] Performance metrics meet targets
[ ] Security tests pass
[ ] No data loss or corruption

---

# ═══════════════════════════════════════════════════════════
# DETAILED DOCUMENTATION
# ═══════════════════════════════════════════════════════════
# For complete instructions, see:
# - BACKEND_GAPS_IMPLEMENTATION_GUIDE.md (Full guide)
# - BACKEND_FIXES_SUMMARY.md (Executive summary)
# - All SQL files in root directory
# ═══════════════════════════════════════════════════════════
