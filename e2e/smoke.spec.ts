import { test, expect } from '@playwright/test';

test.describe('Smoke Tests @smoke', () => {
  test('landing page should load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Skylar');
  });

  test('admin login page should be accessible', async ({ page }) => {
    await page.goto('/sparkwavv-admin');
    await expect(page.getByText('Admin Portal')).toBeVisible();
  });
});
