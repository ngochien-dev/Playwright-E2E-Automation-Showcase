import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginSubmitBtn: Locator;
  readonly errorAlert: Locator;
  readonly errorAlertText: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginSubmitBtn = page.locator('#login-submit-btn');
    this.errorAlert = page.locator('#login-error');
    this.errorAlertText = page.locator('#login-error-text');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginSubmitBtn.click();
  }

  async getErrorMessage(): Promise<string> {
    await this.errorAlert.waitFor({ state: 'visible' });
    const text = await this.errorAlertText.textContent();
    return text ? text.trim() : '';
  }

  async isErrorVisible(): Promise<boolean> {
    return this.errorAlert.isVisible();
  }
}
