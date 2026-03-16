import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow (End-to-End)', () => {
  test('should complete the full onboarding process from registration to results', async ({ page }) => {
    test.setTimeout(120000); // Increase timeout to 120s
    
    // Log browser console
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
      else console.log(`BROWSER LOG: ${msg.text()}`);
    });

    // 1. Start at Landing Page
    console.log('Starting at Landing Page...');
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Skylar');

    // 2. Navigate to Registration
    console.log('Navigating to Registration...');
    await page.getByRole('button', { name: /Dive-In/i }).click();
    await expect(page.getByText("Let's Dive-In, and get started")).toBeVisible();

    // 3. Skip Registration (Dev Mode)
    console.log('Skipping Registration...');
    await page.getByRole('button', { name: /Skip Registration/i }).click();
    
    // Wait for state transition or reload
    await page.waitForTimeout(2000);
    console.log('Current URL:', page.url());

    // If we are back on landing page (due to reload), click Resume Journey
    if (await page.getByRole('button', { name: /Resume Journey/i }).isVisible()) {
      console.log('Reload detected, clicking Resume Journey...');
      await page.getByRole('button', { name: /Resume Journey/i }).click();
    }

    // 4. Module 1: Accomplishments
    console.log('Filling Module 1...');
    await expect(page.getByText('Accomplishment Stories')).toBeVisible({ timeout: 15000 });
    
    await page.getByPlaceholder('What did you achieve?').first().fill('Built a testing suite');
    await page.getByPlaceholder('How did you do it? What was the impact?').first().fill('Used Playwright and Vitest to ensure 100% coverage.');
    
    await page.getByPlaceholder('What did you achieve?').nth(1).fill('Optimized database queries');
    await page.getByPlaceholder('How did you do it? What was the impact?').nth(1).fill('Reduced latency by 50% using indexing.');

    await page.getByPlaceholder('What did you achieve?').nth(2).fill('Led a team of 5');
    await page.getByPlaceholder('How did you do it? What was the impact?').nth(2).fill('Delivered the project 2 weeks ahead of schedule.');

    await page.getByRole('button', { name: /Next: Environment/i }).click();

    // 9. Module 2: Environment
    await expect(page.getByText('Module 2')).toBeVisible();
    await page.getByPlaceholder('Describe your ideal workday flow...').fill('A quiet space with high-quality coffee and deep focus time.');
    await page.getByRole('button', { name: 'Purpose' }).click(); // Lack of Purpose
    await page.getByRole('button', { name: 'Growth' }).click(); // No Growth
    
    await page.getByRole('button', { name: /Next: Passions/i }).click();

    // 10. Module 3: Passions
    await expect(page.getByText('Module 3')).toBeVisible();
    await page.getByRole('button', { name: 'Solving Puzzles' }).click();
    await page.getByRole('button', { name: 'Building Systems' }).click();
    await page.getByPlaceholder(/e.g., I have a clear goal/i).fill('I have a challenging problem to solve and the right tools.');

    await page.getByRole('button', { name: /Next: Brand DNA/i }).click();

    // 11. Module 4: Attributes
    await expect(page.getByText('Module 4')).toBeVisible();
    await page.getByRole('button', { name: 'Creator' }).click();
    await page.getByRole('button', { name: 'Analyst' }).click();
    await page.getByRole('button', { name: 'Strategist' }).click();

    await page.getByRole('button', { name: /Next: Movie Poster/i }).click();

    // 12. Module 5: Tagline
    await expect(page.getByText('Module 5')).toBeVisible();
    await page.getByPlaceholder(/e.g., Building the future/i).fill('Engineering Excellence through Automated Testing.');

    await page.getByRole('button', { name: /Generate Discovery Summary/i }).click();

    // 13. Processing & Results
    console.log('Waiting for Results...');
    await expect(page.getByText('Your Professional Identity')).toBeVisible({ timeout: 45000 });
    await expect(page.getByRole('heading', { name: 'Brand Portrait' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Core Strengths' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Career Clusters' })).toBeVisible();
    
    console.log('Onboarding Complete!');
  });
});
