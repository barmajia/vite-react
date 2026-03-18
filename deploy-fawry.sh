# Fawry Payment Integration - Deployment Commands
# Run these commands in order

# =============================================
# STEP 1: Login to Supabase
# =============================================
npx supabase login

# =============================================
# STEP 2: Link to your project
# =============================================
npx supabase link --project-ref ofovfxsfazlwvcakpuer

# =============================================
# STEP 3: Set Fawry Secrets (SANDBOX)
# =============================================
# Replace with your actual Fawry sandbox credentials
npx supabase secrets set FAWRY_MERCHANT_CODE=YOUR_SANDBOX_MERCHANT_CODE
npx supabase secrets set FAWRY_SECRET_KEY=YOUR_SANDBOX_SECRET_KEY
npx supabase secrets set FAWRY_BASE_URL=https://atfawry.fawry.com/api

# =============================================
# STEP 4: Set Fawry Secrets (PRODUCTION)
# =============================================
# Replace with your actual Fawry production credentials
# npx supabase secrets set FAWRY_MERCHANT_CODE=YOUR_PRODUCTION_MERCHANT_CODE
# npx supabase secrets set FAWRY_SECRET_KEY=YOUR_PRODUCTION_SECRET_KEY
# npx supabase secrets set FAWRY_BASE_URL=https://atfawry.fawry.com/api

# =============================================
# STEP 5: Deploy Edge Functions
# =============================================
# Deploy Create Payment function
npx supabase functions deploy create-fawry-payment

# Deploy Webhook function
npx supabase functions deploy fawry-webhook

# =============================================
# STEP 6: Verify Deployment
# =============================================
npx supabase functions list

# =============================================
# STEP 7: Get Function URLs
# =============================================
# Create Payment: https://ofovfxsfazlwvcakpuer.supabase.co/functions/v1/create-fawry-payment
# Webhook: https://ofovfxsfazlwvcakpuer.supabase.co/functions/v1/fawry-webhook

# =============================================
# STEP 8: Configure Fawry Webhook
# =============================================
# In Fawry Dashboard, set webhook URL to:
# https://ofovfxsfazlwvcakpuer.supabase.co/functions/v1/fawry-webhook

# =============================================
# STEP 9: Test Integration
# =============================================
# 1. Run database migration in Supabase SQL Editor
# 2. Add item to cart and create order
# 3. Go to checkout
# 4. Click "Pay with Fawry"
# 5. Complete payment in Fawry sandbox
# 6. Verify webhook updates order status

# =============================================
# LOCAL TESTING (Optional)
# =============================================
# Test functions locally before deploying:
npx supabase functions serve create-fawry-payment --env-file .env
npx supabase functions serve fawry-webhook --env-file .env

# =============================================
# USEFUL COMMANDS
# =============================================
# View function logs:
npx supabase functions logs create-fawry-payment
npx supabase functions logs fawry-webhook

# Delete functions (if needed):
# npx supabase functions delete create-fawry-payment
# npx supabase functions delete fawry-webhook

# =============================================
# SECURITY REMINDERS
# =============================================
# - Never commit .env file with secrets
# - Never expose FAWRY_SECRET_KEY in frontend code
# - Always verify webhook signatures
# - Use HTTPS in production
# - Rotate secrets periodically
