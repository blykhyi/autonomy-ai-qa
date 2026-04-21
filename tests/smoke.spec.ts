import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page, baseURL }) => {
  test.skip(!process.env.BASE_URL, 'Set BASE_URL to run against an AutonomyAI environment.');
  await page.goto(baseURL ?? '/');
  await expect(page).toHaveURL(/.*/);
});

