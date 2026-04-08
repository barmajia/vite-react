# 🔐 Aurora Authentication Gate Flows

Complete documentation for role-based authentication gates across 5 user roles: **CUSTOMER, SELLER, FACTORY, MIDDLEMAN, DELIVERY**.

---

## 📋 TABLE OF CONTENTS

1. [Database Architecture](#database-architecture)
2. [Gate Flow Per Role](#gate-flow-per-role)
3. [Auth Middleware / Gatekeeper](#auth-middleware--gatekeeper)
4. [Database Integration Points](#database-integration-points)
5. [Security & RLS Alignment](#security--rls-alignment)
6. [Implementation Checklist](#implementation-checklist)

---

## 🗃️ DATABASE ARCHITECTURE

### Core Tables

| Table                | Purpose                       | Key Columns                                                                          |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| `auth.users`         | Supabase Auth (managed)       | `id`, `email`, `raw_user_meta_data`                                                  |
| `public.users`       | Public user mirror            | `id`, `email`, `full_name`, `account_type` (text[]), `user_roles` (boolean flags)    |
| `customers`          | Customer profiles             | `user_id`, `phone`, `location`, `currency`                                           |
| `sellers`            | Seller/Factory/Middleman base | `user_id`, `account_type`, `is_factory`, `is_middleman`, `provider_name`, `logo_url` |
| `middle_men`         | Middleman operations          | `user_id`, `commission_rate`, `specialization`                                       |
| `middleman_profiles` | Extended middleman data       | `user_id`, `bio`, `ratings`                                                          |
| `delivery_profiles`  | Delivery driver profiles      | `user_id`, `vehicle_type`, `vehicle_number`, `license_url`                           |
| `svc_providers`      | Service provider profiles     | `user_id`, `provider_name`, `status`, `is_verified`                                  |
| `user_roles`         | Fast boolean role flags       | `user_id`, `is_customer`, `is_seller`, `is_factory`, `is_middleman`, `is_driver`     |

### Trigger: `handle_new_user()`

```sql
-- Automatically fires on auth.users INSERT
-- Reads raw_user_meta_data->>'account_type'
-- Creates corresponding role-specific records
-- Updates user_roles boolean flags
```

---

## 🚪 GATE FLOW PER ROLE

---

### 1. 👤 CUSTOMER GATE

#### Signup Payload Structure

```typescript
// Frontend: src/pages/auth/Signup.tsx
const customerPayload = {
  email: "customer@example.com",
  password: "SecurePass123!",
  fullName: "John Customer",
  accountType: "customer" as const,
  metadata: {
    phone: "+201234567890",
    location: "Cairo, Egypt",
    currency: "EGP",
  },
};

// Supabase signup call
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      account_type: ["customer"],
      phone: metadata?.phone,
      location: metadata?.location,
      currency: metadata?.currency,
    },
  },
});
```

#### Post-Signup Gate Validation

```typescript
// Verify customer record was created
async function validateCustomerGate(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    // Trigger may have failed - create manually
    await createCustomerProfile(userId);
    return false;
  }
  return true;
}

// Fallback manual creation
async function createCustomerProfile(userId: string, metadata = {}) {
  const { error } = await supabase.from("customers").upsert(
    {
      user_id: userId,
      phone: metadata.phone || null,
      location: metadata.location || null,
      currency: metadata.currency || "EGP",
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(`Customer gate failed: ${error.message}`);
}
```

#### Login Verification Logic

```typescript
async function verifyCustomerLogin(
  userId: string,
): Promise<{ valid: boolean; roles: string[] }> {
  const { data: user, error } = await supabase
    .from("users")
    .select("account_type, user_roles")
    .eq("id", userId)
    .single();

  if (error || !user) return { valid: false, roles: [] };

  const isCustomer =
    user.account_type?.includes("customer") ||
    user.user_roles?.is_customer === true;

  return { valid: isCustomer, roles: user.account_type || [] };
}
```

#### Post-Auth Routing

```typescript
// After successful customer login
if (gateVerification.valid) {
  navigate("/products"); // Customer product browsing
} else {
  // Gate failed - redirect to profile completion
  navigate("/complete-profile?role=customer");
}
```

---

### 2. 🏪 SELLER GATE

#### Signup Payload Structure

```typescript
const sellerPayload = {
  email: "seller@example.com",
  password: "SecurePass123!",
  fullName: "Jane Seller",
  accountType: "seller",
  metadata: {
    phone: "+201234567890",
    business_name: "Jane's Store",
    business_type: "retail",
  },
};

// Supabase signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      account_type: ["seller"],
      phone: metadata?.phone,
      business_name: metadata?.business_name,
      is_factory: false, // Critical flag
    },
  },
});
```

#### Post-Signup Gate Validation

```typescript
async function validateSellerGate(userId: string): Promise<boolean> {
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("id, account_type, is_factory")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !seller) {
    await createSellerProfile(userId);
    return false;
  }

  // Verify it's actually a seller, not a factory
  if (seller.is_factory || seller.account_type === "factory") {
    throw new Error("Role mismatch: user is factory, not seller");
  }

  return true;
}

async function createSellerProfile(userId: string, metadata = {}) {
  const { error } = await supabase.from("sellers").upsert(
    {
      user_id: userId,
      account_type: "seller",
      is_factory: false,
      is_middleman: false,
      provider_name: metadata.business_name || null,
      status: "active",
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(`Seller gate failed: ${error.message}`);
}
```

#### Login Verification Logic

```typescript
async function verifySellerLogin(
  userId: string,
): Promise<{ valid: boolean; roles: string[] }> {
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("account_type, is_factory, is_middleman")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !seller) return { valid: false, roles: [] };

  const isValid = !seller.is_factory && !seller.is_middleman;

  return {
    valid: isValid,
    roles: seller.account_type ? [seller.account_type] : [],
  };
}
```

#### Post-Auth Routing

```typescript
if (gateVerification.valid) {
  navigate("/seller/dashboard");
} else {
  navigate("/complete-profile?role=seller");
}
```

---

### 3. 🏭 FACTORY GATE

#### Signup Payload Structure

```typescript
const factoryPayload = {
  email: "factory@example.com",
  password: "SecurePass123!",
  fullName: "Factory Manager",
  accountType: "factory",
  metadata: {
    phone: "+201234567890",
    factory_name: "Aurora Manufacturing",
    production_capacity: "10000 units/month",
    min_order_quantity: 100,
  },
};

// Supabase signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      account_type: ["factory"],
      phone: metadata?.phone,
      factory_name: metadata?.factory_name,
      is_factory: true, // Critical flag
      production_capacity: metadata?.production_capacity,
      min_order_quantity: metadata?.min_order_quantity,
    },
  },
});
```

#### Post-Signup Gate Validation

```typescript
async function validateFactoryGate(userId: string): Promise<boolean> {
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("id, is_factory, account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !seller) {
    await createFactoryProfile(userId);
    return false;
  }

  if (!seller.is_factory && seller.account_type !== "factory") {
    throw new Error("Role mismatch: user is not a factory");
  }

  return true;
}

async function createFactoryProfile(userId: string, metadata = {}) {
  const { error } = await supabase.from("sellers").upsert(
    {
      user_id: userId,
      account_type: "factory",
      is_factory: true,
      is_middleman: false,
      provider_name: metadata.factory_name || null,
      status: "pending_review", // Factories need review
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(`Factory gate failed: ${error.message}`);
}
```

#### Login Verification Logic

```typescript
async function verifyFactoryLogin(
  userId: string,
): Promise<{ valid: boolean; roles: string[] }> {
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("is_factory, account_type, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !seller) return { valid: false, roles: [] };

  const isValid = seller.is_factory || seller.account_type === "factory";

  if (seller.status === "pending_review") {
    return { valid: true, roles: ["factory"], status: "pending_review" };
  }

  return {
    valid: isValid,
    roles: seller.account_type ? [seller.account_type] : [],
  };
}
```

#### Post-Auth Routing

```typescript
if (gateVerification.status === "pending_review") {
  navigate("/services/dashboard/pending");
} else if (gateVerification.valid) {
  navigate("/factory/dashboard");
} else {
  navigate("/complete-profile?role=factory");
}
```

---

### 4. 🤝 MIDDLEMAN GATE

#### Signup Payload Structure

```typescript
const middlemanPayload = {
  email: "middleman@example.com",
  password: "SecurePass123!",
  fullName: "Ali Middleman",
  accountType: "middleman",
  metadata: {
    phone: "+201234567890",
    commission_rate: 5.0,
    specialization: "electronics",
  },
};

// Supabase signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      account_type: ["middleman", "seller"], // Middlemen are also sellers
      phone: metadata?.phone,
      is_middleman: true,
      commission_rate: metadata?.commission_rate,
      specialization: metadata?.specialization,
    },
  },
});
```

#### Post-Signup Gate Validation

```typescript
async function validateMiddlemanGate(userId: string): Promise<boolean> {
  // Check both sellers and middle_men tables
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, is_middleman")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: middleman } = await supabase
    .from("middle_men")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seller?.is_middleman || !middleman) {
    await createMiddlemanProfile(userId);
    return false;
  }

  return true;
}

async function createMiddlemanProfile(userId: string, metadata = {}) {
  // Create seller record with middleman flag
  const { error: sellerError } = await supabase.from("sellers").upsert(
    {
      user_id: userId,
      account_type: "middleman",
      is_factory: false,
      is_middleman: true,
      status: "active",
    },
    { onConflict: "user_id" },
  );

  if (sellerError)
    throw new Error(`Middleman seller gate failed: ${sellerError.message}`);

  // Create middleman specific record
  const { error: mmError } = await supabase.from("middle_men").upsert(
    {
      user_id: userId,
      commission_rate: metadata.commission_rate || 5.0,
      specialization: metadata.specialization || null,
      total_deals: 0,
    },
    { onConflict: "user_id" },
  );

  if (mmError) throw new Error(`Middleman gate failed: ${mmError.message}`);
}
```

#### Login Verification Logic

```typescript
async function verifyMiddlemanLogin(
  userId: string,
): Promise<{ valid: boolean; roles: string[] }> {
  const { data: middleman } = await supabase
    .from("middle_men")
    .select("commission_rate, specialization")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: seller } = await supabase
    .from("sellers")
    .select("is_middleman, account_type")
    .eq("user_id", userId)
    .maybeSingle();

  const isValid = middleman !== null && seller?.is_middleman === true;

  return {
    valid: isValid,
    roles: [
      "middleman",
      ...(seller?.account_type ? [seller.account_type] : []),
    ],
  };
}
```

#### Post-Auth Routing

```typescript
if (gateVerification.valid) {
  navigate("/middleman/dashboard");
} else {
  navigate("/complete-profile?role=middleman");
}
```

---

### 5. 🚚 DELIVERY GATE

#### Signup Payload Structure

```typescript
const deliveryPayload = {
  email: "driver@example.com",
  password: "SecurePass123!",
  fullName: "Mohamed Driver",
  accountType: "delivery_driver",
  metadata: {
    phone: "+201234567890",
    vehicle_type: "motorcycle",
    vehicle_number: "ABC-1234",
    license_url: "https://storage/license.jpg",
  },
};

// Supabase signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      account_type: ["delivery_driver"],
      phone: metadata?.phone,
      vehicle_type: metadata?.vehicle_type,
      vehicle_number: metadata?.vehicle_number,
      is_driver: true,
    },
  },
});
```

#### Post-Signup Gate Validation

```typescript
async function validateDeliveryGate(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("delivery_profiles")
    .select("id, vehicle_type, license_verified")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    await createDeliveryProfile(userId);
    return false;
  }

  return true;
}

async function createDeliveryProfile(userId: string, metadata = {}) {
  const { error } = await supabase.from("delivery_profiles").upsert(
    {
      user_id: userId,
      vehicle_type: metadata.vehicle_type || "motorcycle",
      vehicle_number: metadata.vehicle_number || null,
      license_url: metadata.license_url || null,
      license_verified: false,
      status: "pending_verification",
      total_deliveries: 0,
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(`Delivery gate failed: ${error.message}`);
}
```

#### Login Verification Logic

```typescript
async function verifyDeliveryLogin(
  userId: string,
): Promise<{ valid: boolean; roles: string[] }> {
  const { data: profile, error } = await supabase
    .from("delivery_profiles")
    .select("vehicle_type, license_verified, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile) return { valid: false, roles: [] };

  if (profile.status === "pending_verification") {
    return {
      valid: true,
      roles: ["delivery_driver"],
      status: "pending_verification",
    };
  }

  return { valid: true, roles: ["delivery_driver"] };
}
```

#### Post-Auth Routing

```typescript
if (gateVerification.status === "pending_verification") {
  navigate("/delivery/verify-pending");
} else if (gateVerification.valid) {
  navigate("/delivery/dashboard");
} else {
  navigate("/complete-profile?role=delivery");
}
```

---

## 🔐 AUTH MIDDLEWARE / GATEKEEPER

### Supabase Edge Function: `gatekeeper`

```typescript
// supabase/functions/gatekeeper/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Extract auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token", details: authError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch user roles
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("account_type, user_roles")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract required role from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const requiredRole = pathParts[2]; // e.g., /api/seller/products -> "seller"

    // Role mapping
    const roleMap: Record<string, string[]> = {
      customer: ["customer"],
      seller: ["seller"],
      factory: ["factory"],
      middleman: ["middleman", "seller"],
      delivery: ["delivery_driver"],
    };

    const allowedRoles = roleMap[requiredRole] || [];
    const userRoles = userData.account_type || [];
    const userRoleFlags = userData.user_roles || {};

    // Check if user has required role
    const hasAccess = allowedRoles.some((role) => {
      // Check account_type array
      if (userRoles.includes(role)) return true;

      // Check user_roles boolean flags
      const flagMap: Record<string, keyof typeof userRoleFlags> = {
        customer: "is_customer",
        seller: "is_seller",
        factory: "is_factory",
        middleman: "is_middleman",
        delivery_driver: "is_driver",
      };

      const flag = flagMap[role];
      return flag && userRoleFlags[flag] === true;
    });

    if (!hasAccess) {
      return new Response(
        JSON.stringify({
          error: "Access denied",
          message: `Role '${requiredRole}' required. Your roles: ${userRoles.join(", ")}`,
          required: allowedRoles,
          user_roles: userRoles,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Add role info to headers for downstream use
    const headers = {
      ...corsHeaders,
      "X-User-Id": user.id,
      "X-User-Roles": userRoles.join(","),
      "Content-Type": "application/json",
    };

    // Forward request with role context
    return new Response(
      JSON.stringify({
        user: { id: user.id, email: user.email, roles: userRoles },
        message: "Access granted",
      }),
      { status: 200, headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
```

### Frontend Gate Middleware

```typescript
// src/middleware/roleGate.ts
import { supabase } from "@/lib/supabase";
import { ROUTES } from "@/lib/constants";

export interface GateResult {
  hasAccess: boolean;
  roles: string[];
  requiredRole: string;
  redirectTo?: string;
  error?: string;
}

const ROLE_ROUTES: Record<string, string[]> = {
  "/products": ["customer", "seller", "factory", "middleman"],
  "/seller": ["seller"],
  "/factory": ["factory"],
  "/middleman": ["middleman"],
  "/delivery": ["delivery_driver"],
  "/services": ["seller", "factory", "middleman"],
};

export async function checkRoleGate(path: string): Promise<GateResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      hasAccess: false,
      roles: [],
      requiredRole: "authenticated",
      redirectTo: `${ROUTES.LOGIN}?returnTo=${encodeURIComponent(path)}`,
      error: "Not authenticated",
    };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("account_type, user_roles")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return {
      hasAccess: false,
      roles: [],
      requiredRole: "unknown",
      redirectTo: ROUTES.SIGNUP,
      error: "User profile not found",
    };
  }

  // Determine required role from path
  const requiredRoles = ROLE_ROUTES[path.split("/")[1]] || ["authenticated"];
  const userRoles = userData.account_type || [];

  const hasAccess = requiredRoles.some((role) => userRoles.includes(role));

  if (!hasAccess) {
    return {
      hasAccess: false,
      roles: userRoles,
      requiredRole: requiredRoles[0],
      redirectTo: getDefaultRouteForRoles(userRoles),
      error: `Access denied: requires ${requiredRoles.join(" or ")}`,
    };
  }

  return {
    hasAccess: true,
    roles: userRoles,
    requiredRole: requiredRoles[0],
  };
}

function getDefaultRouteForRoles(roles: string[]): string {
  if (roles.includes("customer")) return ROUTES.PRODUCTS;
  if (roles.includes("seller")) return "/seller/dashboard";
  if (roles.includes("factory")) return "/factory/dashboard";
  if (roles.includes("middleman")) return "/middleman/dashboard";
  if (roles.includes("delivery_driver")) return "/delivery/dashboard";
  return ROUTES.HOME;
}
```

---

## 🗃️ DATABASE INTEGRATION POINTS

### 1. Safe UPSERT Patterns

```sql
-- Customer UPSERT (idempotent)
INSERT INTO customers (user_id, phone, location, currency)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id) DO UPDATE SET
  phone = EXCLUDED.phone,
  location = EXCLUDED.location,
  currency = EXCLUDED.currency,
  updated_at = NOW();

-- Seller UPSERT with role flags
INSERT INTO sellers (user_id, account_type, is_factory, is_middleman, provider_name, status)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id) DO UPDATE SET
  account_type = EXCLUDED.account_type,
  is_factory = EXCLUDED.is_factory,
  is_middleman = EXCLUDED.is_middleman,
  provider_name = EXCLUDED.provider_name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- User roles sync
INSERT INTO user_roles (user_id, is_customer, is_seller, is_factory, is_middleman, is_driver)
VALUES (
  $1,
  $2::boolean,  -- is_customer
  $3::boolean,  -- is_seller
  $4::boolean,  -- is_factory
  $5::boolean,  -- is_middleman
  $6::boolean   -- is_driver
)
ON CONFLICT (user_id) DO UPDATE SET
  is_customer = EXCLUDED.is_customer,
  is_seller = EXCLUDED.is_seller,
  is_factory = EXCLUDED.is_factory,
  is_middleman = EXCLUDED.is_middleman,
  is_driver = EXCLUDED.is_driver,
  updated_at = NOW();
```

### 2. Automatic `user_roles` Sync Trigger

```sql
CREATE OR REPLACE FUNCTION sync_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine roles from account_type array
  NEW.is_customer := NEW.account_type && ARRAY['customer'];
  NEW.is_seller := NEW.account_type && ARRAY['seller'];
  NEW.is_factory := NEW.account_type && ARRAY['factory'] OR (NEW.is_factory = true);
  NEW.is_middleman := NEW.account_type && ARRAY['middleman'] OR (NEW.is_middleman = true);
  NEW.is_driver := NEW.account_type && ARRAY['delivery_driver'];

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_roles
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_roles();
```

### 3. Safe Gate Eligibility Query

```sql
-- Check gate eligibility without bypassing RLS
-- Uses SECURITY DEFINER to run with elevated privileges
CREATE OR REPLACE FUNCTION check_gate_eligibility(
  p_user_id uuid,
  p_required_role text
)
RETURNS TABLE (
  has_access boolean,
  user_roles text[],
  gate_status text
)
SECURITY DEFINER  -- Bypass RLS for this check only
LANGUAGE plpgsql
AS $$
DECLARE
  v_account_type text[];
  v_has_role boolean;
BEGIN
  -- Get user's account type
  SELECT account_type INTO v_account_type
  FROM users
  WHERE id = p_user_id;

  -- Check if user has required role
  v_has_role := v_account_type && ARRAY[p_required_role];

  RETURN QUERY
  SELECT
    v_has_role,
    v_account_type,
    CASE
      WHEN v_has_role THEN 'granted'
      ELSE 'denied'
    END;
END;
$$;

-- Usage:
-- SELECT * FROM check_gate_eligibility('user-uuid', 'customer');
```

---

## 🛡️ SECURITY & RLS ALIGNMENT

### 1. RLS Policy Enforcement

```sql
-- Customers can only see their own data
CREATE POLICY "Customers view own profile"
  ON customers FOR SELECT
  USING (user_id = auth.uid());

-- Sellers can only manage their own listings
CREATE POLICY "Sellers manage own listings"
  ON products FOR ALL
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- Middlemen can only see their own deals
CREATE POLICY "Middlemen view own deals"
  ON middleman_deals FOR SELECT
  USING (
    middleman_id IN (
      SELECT id FROM middle_men WHERE user_id = auth.uid()
    )
  );

-- Delivery drivers only see assigned deliveries
CREATE POLICY "Drivers view assigned deliveries"
  ON delivery_assignments FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM delivery_profiles WHERE user_id = auth.uid()
    )
  );
```

### 2. JWT Claims for Fast Gate Checking

```typescript
// Embed roles in session metadata during signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: "John Customer",
      account_type: ["customer"],
      // These get embedded in JWT
      roles: ["customer"],
      user_id: "will-be-generated",
    },
  },
});

// Extract roles from JWT without DB call
function getUserRolesFromSession(): string[] {
  const session = supabase.auth.getSession();
  return session?.data?.session?.user?.user_metadata?.roles || [];
}
```

### 3. Rate Limiting & Abuse Prevention

```typescript
// src/lib/security.ts
export const signupRateLimiter = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockedUntil: 60 * 60 * 1000, // 1 hour

  check(email: string): { allowed: boolean; retryAfter?: number } {
    const key = `signup:${email}`;
    const attempts = localStorage.getItem(key);
    const count = attempts
      ? JSON.parse(attempts)
      : { count: 0, until: Date.now() };

    if (Date.now() < count.until && count.count >= this.maxAttempts) {
      return { allowed: false, retryAfter: count.until - Date.now() };
    }

    return { allowed: true };
  },

  record(email: string) {
    const key = `signup:${email}`;
    const now = Date.now();
    localStorage.setItem(
      key,
      JSON.stringify({
        count: 1,
        until: now + this.windowMs,
      }),
    );
  },
};

// Usage in signup
const rateLimit = signupRateLimiter.check(email);
if (!rateLimit.allowed) {
  toast.error(
    `Too many attempts. Try again in ${Math.ceil(rateLimit.retryAfter! / 60000)} minutes`,
  );
  return;
}
```

---

## 📝 IMPLEMENTATION CHECKLIST

### ✅ Step 1: Database Setup

- [ ] Verify `handle_new_user()` trigger exists and handles all 5 roles
- [ ] Ensure `user_roles` boolean flags are being set by trigger
- [ ] Test `handle_new_user()` with each role payload
- [ ] Verify RLS policies are active on all role-specific tables

### ✅ Step 2: Test Customer Gate

```typescript
// Test Payload
const testCustomer = {
  email: "test-customer@example.com",
  password: "TestPass123!",
  fullName: "Test Customer",
  accountType: "customer",
};

// Expected DB State After Trigger:
// ✓ auth.users: new record created
// ✓ public.users: account_type = ['customer'], is_customer = true
// ✓ customers: new record with user_id
// ✓ user_roles: is_customer = true

// Edge Cases:
// - Login with non-customer → should redirect to /complete-profile
// - RLS: customer cannot query sellers table
```

### ✅ Step 3: Test Seller Gate

```typescript
// Test Payload
const testSeller = {
  email: "test-seller@example.com",
  password: "TestPass123!",
  fullName: "Test Seller",
  accountType: "seller",
};

// Expected DB State After Trigger:
// ✓ auth.users: new record created
// ✓ public.users: account_type = ['seller'], is_seller = true
// ✓ sellers: account_type = 'seller', is_factory = false
// ✓ user_roles: is_seller = true

// Edge Cases:
// - Factory trying seller gate → blocked
// - RLS: seller cannot access factory-only endpoints
```

### ✅ Step 4: Test Factory Gate

```typescript
// Test Payload
const testFactory = {
  email: "test-factory@example.com",
  password: "TestPass123!",
  fullName: "Test Factory",
  accountType: "factory",
};

// Expected DB State After Trigger:
// ✓ auth.users: new record created
// ✓ public.users: account_type = ['factory'], is_factory = true
// ✓ sellers: account_type = 'factory', is_factory = true, status = 'pending_review'
// ✓ user_roles: is_factory = true

// Edge Cases:
// - Pending review → redirect to /services/dashboard/pending
// - RLS: pending factory cannot access production features
```

### ✅ Step 5: Test Middleman Gate

```typescript
// Test Payload
const testMiddleman = {
  email: "test-middleman@example.com",
  password: "TestPass123!",
  fullName: "Test Middleman",
  accountType: "middleman",
};

// Expected DB State After Trigger:
// ✓ auth.users: new record created
// ✓ public.users: account_type = ['middleman', 'seller'], is_middleman = true
// ✓ sellers: is_middleman = true, account_type = 'middleman'
// ✓ middle_men: new record with commission_rate
// ✓ user_roles: is_middleman = true

// Edge Cases:
// - Non-middleman accessing middleman endpoints → 403
// - RLS: middleman can only see their own deals
```

### ✅ Step 6: Test Delivery Gate

```typescript
// Test Payload
const testDelivery = {
  email: "test-delivery@example.com",
  password: "TestPass123!",
  fullName: "Test Delivery",
  accountType: "delivery_driver",
};

// Expected DB State After Trigger:
// ✓ auth.users: new record created
// ✓ public.users: account_type = ['delivery_driver'], is_driver = true
// ✓ delivery_profiles: new record with vehicle info, status = 'pending_verification'
// ✓ user_roles: is_driver = true

// Edge Cases:
// - Pending verification → redirect to /delivery/verify-pending
// - RLS: driver can only see assigned deliveries
```

### ✅ Step 7: RLS Validation Commands

```sql
-- Test RLS as customer
SET LOCAL ROLE authenticated;
SET jwt.claims.user_id = 'customer-uuid';
SELECT * FROM customers WHERE user_id = auth.uid();  -- Should work
SELECT * FROM sellers;  -- Should fail (RLS)

-- Test RLS as seller
SET LOCAL ROLE authenticated;
SET jwt.claims.user_id = 'seller-uuid';
SELECT * FROM sellers WHERE user_id = auth.uid();  -- Should work
SELECT * FROM customers;  -- Should fail (RLS)

-- Test cross-role access
SET LOCAL ROLE authenticated;
SET jwt.claims.user_id = 'customer-uuid';
SELECT * FROM check_gate_eligibility('customer-uuid', 'seller');  -- Should return denied
```

### ✅ Step 8: Login Success/Failure Edge Cases

| Scenario                              | Expected Behavior                                       |
| ------------------------------------- | ------------------------------------------------------- |
| Valid customer login                  | Redirect to `/products`                                 |
| Valid seller login                    | Redirect to `/seller/dashboard`                         |
| Valid factory (pending)               | Redirect to `/services/dashboard/pending`               |
| Valid factory (approved)              | Redirect to `/factory/dashboard`                        |
| Valid middleman                       | Redirect to `/middleman/dashboard`                      |
| Valid delivery (pending verification) | Redirect to `/delivery/verify-pending`                  |
| Valid delivery (verified)             | Redirect to `/delivery/dashboard`                       |
| User with multiple roles              | Redirect to most specific role dashboard                |
| Corrupted role data                   | Redirect to `/complete-profile`                         |
| Missing role-specific table           | Trigger manual creation, redirect to profile completion |

---

## 🎯 QUICK REFERENCE: Role Gate Matrix

| Role          | Signup Table                 | Login Verifies      | Dashboard Route        | Requires Approval |
| ------------- | ---------------------------- | ------------------- | ---------------------- | ----------------- |
| **Customer**  | `customers`                  | `customers`         | `/products`            | ❌ No             |
| **Seller**    | `sellers` (is_factory=false) | `sellers`           | `/seller/dashboard`    | ❌ No             |
| **Factory**   | `sellers` (is_factory=true)  | `sellers`           | `/factory/dashboard`   | ✅ Yes            |
| **Middleman** | `sellers` + `middle_men`     | `middle_men`        | `/middleman/dashboard` | ❌ No             |
| **Delivery**  | `delivery_profiles`          | `delivery_profiles` | `/delivery/dashboard`  | ✅ Yes (license)  |

---

## 📚 FILES TO UPDATE

1. **Frontend Signup** (`src/pages/auth/Signup.tsx`): Add role selection step
2. **Role-Specific Login Pages**:
   - **Customer**: `/login` (src/pages/auth/Login.tsx)
   - **Seller**: `/seller/login` (src/pages/auth/SellerLogin.tsx) ✅ CREATED
   - **Factory**: `/factory/login` (src/pages/auth/FactoryLogin.tsx) ✅ CREATED
   - **Middleman**: `/middleman/login` (src/pages/auth/MiddlemanLogin.tsx) ✅ CREATED
   - **Delivery**: `/delivery/login` (to be created)
3. **Role-Specific Signup Pages**:
   - **Seller**: `/seller/signup` (src/features/seller/pages/SellerSignup.tsx) ✅ CREATED
4. **Role-Specific Layouts**:
   - **Seller Layout**: (src/features/seller/components/SellerLayout.tsx) ✅ CREATED
5. **Role-Specific Dashboards**:
   - **Seller Dashboard**: (src/features/seller/pages/SellerDashboard.tsx) ✅ CREATED
6. **useAuth Hook** (`src/hooks/useAuth.tsx`): Ensure metadata is passed to Supabase
7. **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`): Add role gate checking
8. **Header** (`src/components/layout/Header.tsx`): Add role-specific signup links ✅ UPDATED
9. **Routes** (`src/routes/auth.routes.tsx`): Added role-specific login/signup routes ✅ UPDATED
10. **Routes** (`src/routes/seller.routes.tsx`): Created seller route structure ✅ CREATED
11. **Routes** (`src/routes/index.tsx`): Registered seller routes ✅ UPDATED
12. **Edge Function** (`supabase/functions/gatekeeper/index.ts`): Deploy gatekeeper
13. **Database Migration** (`supabase/migrations/`): Add sync triggers if missing

---

_Last updated: 2026-04-08_
