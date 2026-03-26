# 🧪 Testing Guide - Aurora E-commerce

## 📋 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Running Tests](#running-tests)
4. [Unit Tests](#unit-tests)
5. [Integration Tests](#integration-tests)
6. [E2E Tests](#e2e-tests)
7. [Writing Tests](#writing-tests)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### Testing Stack

| Tool | Purpose | Coverage |
|------|---------|----------|
| **Vitest** | Unit & Integration Testing | Fast, parallel tests |
| **React Testing Library** | Component Testing | User-centric testing |
| **Playwright** | E2E Testing | Cross-browser automation |
| **Testing Library User Event** | User Interactions | Realistic simulations |

### Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                 # Test configuration
│   ├── utils/
│   │   ├── test-utils.tsx       # Test utilities
│   │   └── security-utils.test.ts
│   ├── hooks/
│   │   └── useSecurityInput.test.ts
│   └── components/
│       └── SecurityBoundary.test.tsx
│
e2e/
├── auth.spec.ts                 # Authentication tests
├── security.spec.ts             # Security tests
└── checkout.spec.ts             # Checkout tests (TODO)
```

---

## 📦 Installation

### Install Dependencies

```bash
# Install all testing dependencies
npm install

# Or individually
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @playwright/test
npx playwright install
```

### Verify Installation

```bash
# Check Vitest
npx vitest --version

# Check Playwright
npx playwright --version
```

---

## 🏃 Running Tests

### All Tests

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm run test:run

# Run E2E tests only
npm run test:e2e
```

### Unit Tests

```bash
# Watch mode (recommended for development)
npm run test

# Run once
npm run test:run

# With coverage
npm run test:coverage

# With UI
npm run test:ui

# Specific test file
npm run test -- src/__tests__/utils/security-utils.test.ts

# Test by pattern
npm run test -- -t "security"
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# With UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Specific browser
npx playwright test --project=chromium

# Specific test file
npm run test:e2e -- e2e/auth.spec.ts

# Specific test
npx playwright test -g "should login"

# Show report
npm run test:e2e:report
```

### Targeted Tests

```bash
# Component tests
npm run test:components

# Hook tests
npm run test:hooks

# Utility tests
npm run test:utils

# Auth E2E
npm run test:e2e:auth

# Security E2E
npm run test:e2e:security
```

---

## 🧪 Unit Tests

### Example: Testing Utilities

```typescript
// src/__tests__/utils/security-utils.test.ts
import { describe, it, expect } from 'vitest';
import { generateSecureToken, detectXSS } from '@/lib/security-utils';

describe('Security Utilities', () => {
  it('should generate a token of specified length', () => {
    const token = generateSecureToken(32);
    expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
  });

  it('should detect XSS attacks', () => {
    expect(detectXSS('<script>alert("xss")</script>')).toBe(true);
    expect(detectXSS('Hello World')).toBe(false);
  });
});
```

### Example: Testing Hooks

```typescript
// src/__tests__/hooks/useSecurityInput.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSecurityInput } from '@/hooks/useSecurityInput';

describe('useSecurityInput', () => {
  it('should detect XSS attacks', () => {
    const { result } = renderHook(() => useSecurityInput({ validateXSS: true }));
    
    act(() => {
      result.current.inputProps.onChange({ 
        target: { value: '<script>alert(1)</script>' } 
      });
    });
    
    expect(result.current.validation.hasThreat).toBe(true);
  });
});
```

### Example: Testing Components

```typescript
// src/__tests__/components/SecurityBoundary.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SecurityBoundary } from '@/components/SecurityBoundary';

describe('SecurityBoundary', () => {
  it('should render children when no error', () => {
    render(
      <SecurityBoundary>
        <div>Test Content</div>
      </SecurityBoundary>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should show error UI when child throws', () => {
    const ThrowError = () => { throw new Error('Test'); };
    
    render(
      <SecurityBoundary>
        <ThrowError />
      </SecurityBoundary>
    );
    
    expect(screen.getByText('Security Alert')).toBeInTheDocument();
  });
});
```

---

## 🔗 Integration Tests

### Testing with Providers

```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from '@/components/MyComponent';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

it('should fetch and display data', async () => {
  renderWithProviders(<MyComponent />);
  
  // Wait for data to load
  const item = await screen.findByText(/loaded data/i);
  expect(item).toBeInTheDocument();
});
```

---

## 🌐 E2E Tests

### Example: Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder(/email/i).fill('user@example.com');
    await page.getByPlaceholder(/password/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});
```

### Example: Security Tests

```typescript
// e2e/security.spec.ts
import { test, expect } from '@playwright/test';

test.describe('XSS Protection', () => {
  test('should sanitize XSS in input', async ({ page }) => {
    await page.goto('/products');
    
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('<script>alert("xss")</script>');
    await page.keyboard.press('Enter');
    
    // Should not execute script
    page.on('dialog', () => {
      throw new Error('XSS executed!');
    });
    
    await page.waitForTimeout(1000);
  });
});
```

### Example: Checkout Flow

```typescript
// e2e/checkout.spec.ts (TODO)
import { test, expect } from '@playwright/test';

test.describe('Checkout', () => {
  test('should complete purchase', async ({ page }) => {
    await page.goto('/products');
    
    // Add to cart
    await page.getByRole('button', { name: /add to cart/i }).first().click();
    
    // Go to checkout
    await page.getByRole('link', { name: /cart/i }).click();
    await page.getByRole('button', { name: /checkout/i }).click();
    
    // Fill shipping
    await page.getByPlaceholder(/address/i).fill('123 Test St');
    
    // Complete payment
    await page.getByRole('button', { name: /pay/i }).click();
    
    await expect(page).toHaveURL(/order-success/);
  });
});
```

---

## ✍️ Writing Tests

### Test File Naming

```
✅ Good
- security-utils.test.ts
- useAuth.test.tsx
- SecurityBoundary.test.tsx
- auth.spec.ts (E2E)

❌ Bad
- test-security.ts
- securityTests.tsx
- auth_test.ts
```

### Test Structure (AAA Pattern)

```typescript
describe('ComponentName', () => {
  describe('functionality', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = transform(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Assertions

```typescript
// Common assertions
expect(value).toBe(expected);
expect(value).toEqual(object);
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toContain(item);
expect(value).toHaveLength(5);
expect(value).toMatch(/regex/);
expect(value).toThrow();

// React Testing Library
expect(screen.getByText('Hello')).toBeInTheDocument();
expect(screen.getByRole('button')).toBeEnabled();
expect(screen.getByTestId('custom')).toHaveClass('active');
```

---

## 📚 Best Practices

### 1. Write Testable Code

```typescript
// ❌ Hard to test
const MyComponent = () => {
  const data = fetchFromAPI(); // Direct API call
  return <div>{data}</div>;
};

// ✅ Easy to test
const MyComponent = ({ data }: { data: string }) => {
  return <div>{data}</div>;
};
```

### 2. Use Test IDs

```typescript
// ❌ Fragile selectors
screen.getByText('Click me');

// ✅ Stable selectors
screen.getByTestId('submit-button');
```

### 3. Mock External Dependencies

```typescript
// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  },
}));

// Mock API calls
global.fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({ data: 'test' }),
});
```

### 4. Test User Behavior, Not Implementation

```typescript
// ❌ Testing implementation
expect(component.state.isOpen).toBe(true);

// ✅ Testing behavior
await userEvent.click(screen.getByRole('button'));
expect(screen.getByText('Open')).toBeInTheDocument();
```

### 5. Keep Tests Independent

```typescript
// ❌ Tests depend on each other
it('test 1', () => { /* sets up state */ });
it('test 2', () => { /* uses state from test 1 */ });

// ✅ Independent tests
beforeEach(() => { /* fresh setup */ });
afterEach(() => { /* clean cleanup */ });

it('test 1', () => { /* self-contained */ });
it('test 2', () => { /* self-contained */ });
```

### 6. Use Descriptive Test Names

```typescript
// ❌ Vague
it('should work', () => {});

// ✅ Descriptive
it('should reject passwords shorter than 12 characters', () => {});
```

---

## 🔧 Troubleshooting

### Common Issues

#### "Cannot find module"

```bash
# Clear cache
npm run test -- --clearCache

# Check imports
import { something } from '@/lib/something'; // Use @ alias
```

#### "React is not defined"

```typescript
// Add to test file
import React from 'react';

// Or update tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

#### "Test timeout"

```typescript
// Increase timeout
it('long test', async () => {
  await something();
}, 30000); // 30 seconds

// Or globally in vitest.config.ts
test: {
  testTimeout: 30000,
}
```

#### Playwright browsers not installed

```bash
npx playwright install
```

#### E2E tests fail to connect

```bash
# Start dev server
npm run dev

# Run E2E in another terminal
npm run test:e2e
```

---

## 📊 Coverage

### View Coverage

```bash
# Generate coverage
npm run test:coverage

# Open in browser
npm run coverage:open
```

### Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| Statements | 80% | 0% |
| Branches | 80% | 0% |
| Functions | 80% | 0% |
| Lines | 80% | 0% |

### Increase Coverage

```bash
# Find uncovered files
npm run test:coverage -- --reporter=html

# Open coverage report
open coverage/index.html
```

---

## 🎓 Learning Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Testing JavaScript](https://testingjavascript.com/)

---

## 📞 Need Help?

- Check existing tests for examples
- Read error messages carefully
- Use debug mode: `npm run test:debug`
- Ask in team chat

---

**Last Updated:** March 24, 2026  
**Version:** 1.0.0
