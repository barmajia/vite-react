# ESLint Fix Plan

## Step 1: Test Files (Non-breaking)

- [x] e2e/security.spec.ts - Fixed parsing error at line 24 by completing page.on("dialog") callback
- [ ] src/**tests**/chat/chat-system.test.tsx (8x no-explicit-any)
- [ ] src/**tests**/chat/chat-utils.test.ts (7x issues)
- [ ] Other test files (unused vars)

## Step 2: Components (UI Fixes)

- [ ] src/chats/chat.tsx (unused vars, useEffect deps)
- [ ] src/components/SecurityBoundary.tsx (unused vars)
- [ ] Remove unused icons/imports across components (200+)
- [ ] Fix useEffect deps (50+)

## Step 3: Hooks/Lib

- [ ] Replace `any` types (300+)
- [ ] Fix exhaustive-deps (30+)

## Step 4: Console.logs

- [ ] Replace console.log with proper logger (100+)

## Step 5: Verify

- [ ] npm run lint (target: 0 issues)

**Progress**: Fixed critical parsing error. 784 warnings remaining. Next: Fix test files any-types.

Run `npm run lint` anytime to verify.
