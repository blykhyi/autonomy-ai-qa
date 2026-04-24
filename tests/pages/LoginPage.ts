import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(baseURL: string) {
    await this.page.goto(new URL('/login', baseURL).toString());
    await expect(this.page).toHaveURL(/\/login/);
  }

  async loginWithEmailPassword(username: string, password: string) {
    await this.page.getByTestId('login-email-input').fill(username);
    await this.page.getByTestId('login-password-input').fill(password);
    await this.page.getByTestId('login-submit-button').click();
  }
}

