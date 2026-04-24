import { test, expect, type Page, type Locator } from '@playwright/test';

const PROMPT =
  'Create pagination for cards when amount exceeds 6 cards on page';

function requireEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value : undefined;
}

async function getFirstVisible(page: Page, candidates: Locator[]): Promise<Locator> {
  for (const locator of candidates) {
    try {
      if (await locator.first().isVisible({ timeout: 1500 })) return locator.first();
    } catch {
      // ignore and try next candidate
    }
  }
  throw new Error('Could not find a visible element for any provided candidates.');
}

test('login, select vite-react-sample, run codegen prompt until Done', async ({
  page,
  baseURL,
}) => {
  const username = requireEnv('TEST_USER_NAME');
  const password = requireEnv('TEST_USER_PASSWORD');
  const manualLogin = (process.env.MANUAL_LOGIN ?? '').trim() === '1';
  test.skip(
    !manualLogin && (!username || !password),
    'Set TEST_USER_NAME and TEST_USER_PASSWORD, or set MANUAL_LOGIN=1 to login manually.'
  );

  test.setTimeout(manualLogin ? 20 * 60 * 1000 : 10 * 60 * 1000);

  const startUrl = new URL('/login', baseURL ?? 'https://studio.autonomyai.io').toString();
  await page.goto(startUrl);

  if (!manualLogin) {
    await page.getByTestId('login-email-input').fill(username!);
    await page.getByTestId('login-password-input').fill(password!);
    await page.getByTestId('login-submit-button').click();
  }

  // Post-login landing varies; wait for the top chrome to appear.
  const authedUrl = /(studio\.autonomyai\.io|app\.autonomyai\.io)\/(?!login).*/;
  const authedTimeoutMs = manualLogin ? 15 * 60 * 1000 : 5 * 60 * 1000;

  let activePage: Page = page;
  if (manualLogin) {
    // OAuth providers may open a new tab/window. Prefer whichever page becomes authenticated.
    const maybeNewPage = page
      .context()
      .waitForEvent('page', { timeout: authedTimeoutMs })
      .then(async (p) => {
        await p.waitForLoadState('domcontentloaded');
        return p;
      })
      .catch(() => null);

    const samePageAuthed = page
      .waitForURL(authedUrl, { timeout: authedTimeoutMs })
      .then(() => page)
      .catch(() => null);

    const winner = (await Promise.race([maybeNewPage, samePageAuthed])) ?? (await samePageAuthed);
    if (!winner) throw new Error('Login did not complete within timeout.');
    activePage = winner;

    await activePage.waitForURL(authedUrl, { timeout: 60_000 });
  } else {
    await expect(page).toHaveURL(authedUrl);
  }

  // Wait for the authenticated app shell to render (sidebar/nav).
  await expect(
    activePage.locator('nav, aside').first(),
    'Expected app navigation to be visible after login'
  ).toBeVisible({ timeout: 60_000 });

  // Select the project.
  // In some layouts the project list is already visible; otherwise open the project picker from the sidebar/logo area.
  const projectName = 'vite-react-sample';
  try {
    await activePage.getByText(projectName, { exact: false }).first().click({ timeout: 5_000 });
  } catch {
    const projectPickerTrigger = await getFirstVisible(activePage, [
      // A top-left nav button (often the logo/home) is typically the first interactive item.
      activePage.locator('nav button').first(),
      activePage.locator('aside button').first(),
      // Fallback to any visible nav link/button.
      activePage.locator('nav [role="button"]').first(),
      activePage.locator('aside [role="button"]').first(),
    ]);
    await projectPickerTrigger.click();
    await activePage.getByText(projectName, { exact: false }).first().click({ timeout: 30_000 });
  }

  await expect(activePage.getByText(/What would you like me to build\?/i)).toBeVisible({
    timeout: 60_000,
  });

  // Locate the prompt box / message composer.
  const promptBox = await getFirstVisible(activePage, [
    activePage.getByPlaceholder(/describe what you/i),
    activePage.getByRole('textbox', { name: /prompt|message|chat|ask/i }),
    activePage.locator('textarea'),
    activePage.locator('[contenteditable="true"]'),
    activePage.locator('input[type="text"]'),
  ]);
  await promptBox.fill(PROMPT);

  // Send prompt.
  const sendButton = await getFirstVisible(activePage, [
    activePage.getByRole('button', { name: /^Generate$/i }),
    activePage.getByRole('button', { name: /send|run|generate|submit/i }),
    activePage.getByText(/send/i).locator('..'),
  ]);
  await sendButton.click();

  // Wait for generation to complete.
  // AutonomyAI Studio may not render a literal "Done" label; the "Send to Devs" action is a stable
  // indicator that generation has finished and results are ready.
  await expect(activePage.getByRole('button', { name: /send to devs/i })).toBeVisible({
    timeout: 9 * 60 * 1000,
  });

  // Sanity check that the result relates to the requested task.
  await expect(activePage.getByText(/\bpagination\b/i).first()).toBeVisible();
});

