import { test as base, expect, type Browser, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireEnv } from '../../utils/env';
import { testConfig } from '../../utils/testConfig';
import { LoginPage } from '../pages/LoginPage';
import { StudioPage } from '../pages/StudioPage';

type Fixtures = {
  authedPage: Page;
  studio: StudioPage;
};

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureAuthStorageState(browser: Browser, baseURL: string, storagePath: string) {
  if (await fileExists(storagePath)) return;

  await fs.mkdir(path.dirname(storagePath), { recursive: true });

  const username = requireEnv('TEST_USER_NAME');
  const password = requireEnv('TEST_USER_PASSWORD');

  const context = await browser.newContext();
  const page = await context.newPage();

  const login = new LoginPage(page);
  await login.goto(baseURL);
  await login.loginWithEmailPassword(username, password);

  await expect(page).toHaveURL(/(studio\.autonomyai\.io|app\.autonomyai\.io)\/(?!login).*/);
  await context.storageState({ path: storagePath });

  await context.close();
}

export const test = base.extend<Fixtures>({
  authedPage: async ({ browser, baseURL }, use) => {
    const resolvedBaseURL = baseURL ?? 'https://studio.autonomyai.io';
    const storagePath = testConfig.authStorageStatePath;

    await ensureAuthStorageState(browser, resolvedBaseURL, storagePath);

    const context = await browser.newContext({ storageState: storagePath });
    const page = await context.newPage();

    // Navigate to app root to ensure shell renders.
    await page.goto(resolvedBaseURL);

    await use(page);

    await context.close();
  },

  studio: async ({ authedPage }, use) => {
    const studio = new StudioPage(authedPage);
    await studio.waitForAppShell();
    await use(studio);
  },
});

export { expect } from '@playwright/test';

