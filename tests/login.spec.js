import { test, expect } from '@playwright/test';

test('HR Login', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  // Fill email
  await page.locator('#email').fill('hr@aspino.com');

  // Fill password
  await page.locator('#password').fill('Hr@123');

  // Click Login
  await page.getByRole('button', { name: /Secure HR Login/i }).click();

  // Wait for navigation
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Verify dashboard
  await expect(page).toHaveURL(/dashboard/);
});