/**
 * End-to-end flow and latency test for Aurora project.
 *
 * Set E2E_USER_EMAIL and E2E_USER_PASSWORD in environment to run auth-dependant part.
 */
import { test, expect } from "@playwright/test";

test.describe("Site flow + lag detection", () => {
  const fuzz = (ms: number) => Math.max(ms, 1);

  test("public navigation flow should be responsive", async ({ page }) => {
    const measureLoad = async (url: string) => {
      const start = performance.now();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const duration = performance.now() - start;
      return Math.round(duration);
    };

    const homeLatency = await measureLoad("/");
    expect(homeLatency).toBeLessThan(5000);
    await expect(page).toHaveURL(/\/$/);

    const productsLatency = await measureLoad("/products");
    expect(productsLatency).toBeLessThan(5000);
    await expect(page).toHaveURL(/\/products/);

    const categoriesLatency = await measureLoad("/products/categories");
    expect(categoriesLatency).toBeLessThan(5000);
    await expect(page).toHaveURL(/\/products\/categories/);

    const aboutLatency = await measureLoad("/about");
    expect(aboutLatency).toBeLessThan(5000);
    await expect(page).toHaveURL(/\/about/);

    test.info().annotations.push({
      type: "latency",
      description: `home=${homeLatency}ms, products=${productsLatency}ms, categories=${categoriesLatency}ms, about=${aboutLatency}ms`,
    });
  });

  test("auth protected route and chat route smoke test", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL || "";
    const password = process.env.E2E_USER_PASSWORD || "";

    test.skip(
      !email || !password,
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run this test",
    );

    await page.goto("/login");

    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|login/i }).click();

    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/(home|services|dashboard)?/i);

    // Check protected page access
    await page.goto("/checkout");
    await expect(page).toHaveURL(/checkout/);

    // Chat route
    const chatStart = performance.now();
    await page.goto("/Chat");
    await page
      .waitForSelector("text=Start New Chat", { timeout: 8000 })
      .catch(() => undefined);
    const chatLatency = Math.round(performance.now() - chatStart);

    expect(chatLatency).toBeLessThan(7000);
    await expect(page).toHaveURL(/\/Chat/);

    // attempt to open chat modal if available
    await page
      .getByRole("button", { name: /start new chat|new conversation/i })
      .click()
      .catch(() => undefined);

    // validate that form shows up
    await expect(page.locator("text=Search by name or email")).toBeVisible({
      timeout: 5000,
    });
  });
});
