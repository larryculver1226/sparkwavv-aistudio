import { test, expect } from '@playwright/test';

test('landing page should load and show login options', async ({ page }) => {
  await page.goto('/');
  
  // Check for Skylar branding
  await expect(page.locator('h1')).toContainText('Skylar');
  
  // Check for Dashboard button (which acts as sign in when unauthenticated)
  const dashboardButton = page.getByRole('button', { name: /Dashboard/i });
  await expect(dashboardButton).toBeVisible();
});

test('admin login page should be accessible', async ({ page }) => {
  await page.goto('/sparkwavv-admin');
  
  // Check for Admin Portal title
  await expect(page.getByText('Admin Portal')).toBeVisible();
  await expect(page.getByPlaceholder('admin@sparkwavv.com')).toBeVisible();
});
