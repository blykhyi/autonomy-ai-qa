import { expect, type Locator, type Page } from '@playwright/test';

async function firstVisible(candidates: Locator[]): Promise<Locator> {
  for (const locator of candidates) {
    try {
      const first = locator.first();
      if (await first.isVisible({ timeout: 1500 })) return first;
    } catch {
      // try next
    }
  }
  throw new Error('Could not find a visible element for any provided candidates.');
}

export class StudioPage {
  constructor(private readonly page: Page) {}

  async waitForAppShell() {
    await expect(this.page.locator('nav, aside').first()).toBeVisible({ timeout: 60_000 });
  }

  async selectProject(projectName: string) {
    try {
      await this.page.getByText(projectName, { exact: false }).first().click({ timeout: 5_000 });
      return;
    } catch {
      // fall through
    }

    const trigger = await firstVisible([
      this.page.locator('nav button').first(),
      this.page.locator('aside button').first(),
      this.page.locator('nav [role="button"]').first(),
      this.page.locator('aside [role="button"]').first(),
    ]);
    await trigger.click();
    await this.page.getByText(projectName, { exact: false }).first().click({ timeout: 30_000 });
  }

  async waitForTaskComposer() {
    await expect(this.page.getByText(/What would you like me to build\?/i)).toBeVisible({
      timeout: 60_000,
    });
  }

  async submitPrompt(prompt: string) {
    const promptBox = await firstVisible([
      this.page.getByPlaceholder(/describe what you/i),
      this.page.getByRole('textbox', { name: /prompt|message|chat|ask/i }),
      this.page.locator('textarea'),
      this.page.locator('[contenteditable="true"]'),
      this.page.locator('input[type="text"]'),
    ]);
    await promptBox.fill(prompt);

    const generateButton = await firstVisible([
      this.page.getByRole('button', { name: /^Generate$/i }),
      this.page.getByRole('button', { name: /send|run|generate|submit/i }),
    ]);
    await generateButton.click();
  }

  async waitForGenerationComplete() {
    await expect(this.page.getByRole('button', { name: /send to devs/i })).toBeVisible({
      timeout: 9 * 60 * 1000,
    });
  }

  async getCodegenMessagesText(): Promise<string> {
    // Prefer the explicit "Messages" tab if present.
    const messagesTab =
      this.page.getByRole('tab', { name: /^Messages$/i }).first() ??
      this.page.getByText(/^Messages$/i).first();

    if (await messagesTab.isVisible({ timeout: 1500 }).catch(() => false)) {
      await messagesTab.click();
    }

    await expect(this.page.getByText(/^Messages$/i).first()).toBeVisible({ timeout: 10_000 });

    // Best effort: use role=tabpanel and pick the one that contains meaningful message content.
    const messagePanel = this.page
      .getByRole('tabpanel')
      .filter({ hasText: /cards per page|pagination|previous|next|page/i })
      .first();

    if (await messagePanel.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = (await messagePanel.innerText().catch(() => '')).trim();
      if (text) return text;
    }

    // Fallback: anchor on a known bullet and climb to its container.
    const anchor = this.page.getByText(/cards per page|page navigation|visual feedback/i).first();
    if (await anchor.isVisible({ timeout: 2000 }).catch(() => false)) {
      const container = anchor.locator('..').locator('..');
      const text = (await container.innerText().catch(() => '')).trim();
      if (text) return text;
    }

    throw new Error('Could not extract code generation messages from the UI.');
  }
}

