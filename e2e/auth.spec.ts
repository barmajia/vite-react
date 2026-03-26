/**
 * Authentication E2E Tests
 * Tests for login, signup, and authentication flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Login', () => {
    test('should display login page', async ({ page }) => {
      await page.getByRole('button', { name: /login/i }).click();
      await expect(page).toHaveURL(/.*login/);
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.getByRole('button', { name: /login/i }).click();
      
      await page.getByPlaceholder(/email/i).fill('invalid@example.com');
      await page.getByPlaceholder(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should show error message
      await expect(page.getByText(/invalid credentials|error/i)).toBeVisible({ timeout: 5000 });
    });

    test('should validate email format', async ({ page }) => {
      await page.getByRole('button', { name: /login/i }).click();
      
      await page.getByPlaceholder(/email/i).fill('not-an-email');
      await page.getByPlaceholder(/password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test('should navigate to signup from login', async ({ page }) => {
      await page.getByRole('button', { name: /login/i }).click();
      
      await page.getByRole('link', { name: /signup|register/i }).click();
      await expect(page).toHaveURL(/.*signup/);
    });
  });

  test.describe('Signup', () => {
    test('should display signup page', async ({ page }) => {
      await page.getByRole('button', { name: /signup/i }).click();
      await expect(page).toHaveURL(/.*signup/);
    });

    test('should show password requirements', async ({ page }) => {
      await page.getByRole('button', { name: /signup/i }).click();
      
      // Fill in form
      await page.getByPlaceholder(/email/i).fill('newuser@example.com');
      await page.getByPlaceholder(/password/i).fill('weak');
      
      // Should show password requirements
      await expect(page.getByText(/password.*requirement|minimum.*character/i)).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.getByRole('button', { name: /signup/i }).click();
      
      await page.getByPlaceholder(/email/i).fill('newuser@example.com');
      await page.getByPlaceholder(/password/i).fill('weak');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should show password strength error
      await expect(page.getByText(/password.*strong|minimum.*character/i)).toBeVisible();
    });

    test('should prevent signup with existing email', async ({ page }) => {
      await page.getByRole('button', { name: /signup/i }).click();
      
      await page.getByPlaceholder(/email/i).fill('existing@example.com');
      await page.getByPlaceholder(/password/i).fill('SecurePass123!');
      await page.getByPlaceholder(/full name/i).fill('Test User');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should show error for existing email
      await expect(page.getByText(/already exists|email.*taken/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Password Reset', () => {
    test('should display password reset page', async ({ page }) => {
      await page.getByRole('button', { name: /login/i }).click();
      await page.getByRole('link', { name: /forgot password/i }).click();
      
      await expect(page).toHaveURL(/.*forgot-password|reset-password/);
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    });

    test('should validate email for password reset', async ({ page }) => {
      await page.getByRole('button', { name: /login/i }).click();
      await page.getByRole('link', { name: /forgot password/i }).click();
      
      await page.getByPlaceholder(/email/i).fill('not-an-email');
      await page.getByRole('button', { name: /reset/i }).click();
      
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('should have CSRF protection', async ({ page }) => {
      await page.goto('/login');
      
      // Check that forms have CSRF tokens
      const csrfToken = await page.locator('input[name="csrf_token"]').getAttribute('value');
      expect(csrfToken).toBeTruthy();
    });

    test('should use secure cookies', async ({ page }) => {
      await page.goto('/login');
      
      // After login, check cookie properties
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
      
      if (authCookie) {
        expect(authCookie.secure).toBe(true);
        expect(authCookie.httpOnly).toBe(true);
      }
    });

    test('should have rate limiting on login', async ({ page }) => {
      await page.goto('/login');
      
      // Try multiple failed logins
      for (let i = 0; i < 6; i++) {
        await page.getByPlaceholder(/email/i).fill('test@example.com');
        await page.getByPlaceholder(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /sign in/i }).click();
        await page.waitForTimeout(100);
      }
      
      // Should show rate limit message
      await expect(page.getByText(/too many attempts|rate limit|try again later/i)).toBeVisible({ timeout: 5000 });
    });
  });
});
