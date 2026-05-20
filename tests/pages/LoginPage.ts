import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// Class quản lý POM (Page Object Model) cho trang Đăng Nhập & Đăng Ký
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginSubmitBtn: Locator;
  readonly errorAlert: Locator;
  readonly errorAlertText: Locator;

  // Thành phần của Form Đăng ký
  readonly tabLogin: Locator;
  readonly tabRegister: Locator;
  readonly regUsernameInput: Locator;
  readonly regPasswordInput: Locator;
  readonly regRoleSelect: Locator;
  readonly registerSubmitBtn: Locator;
  readonly registerErrorAlert: Locator;
  readonly registerErrorAlertText: Locator;
  readonly registerSuccessAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginSubmitBtn = page.locator('#login-submit-btn');
    this.errorAlert = page.locator('#login-error');
    this.errorAlertText = page.locator('#login-error-text');

    // Khởi tạo thành phần Đăng ký
    this.tabLogin = page.locator('#tab-login');
    this.tabRegister = page.locator('#tab-register');
    this.regUsernameInput = page.locator('#reg-username');
    this.regPasswordInput = page.locator('#reg-password');
    this.regRoleSelect = page.locator('#reg-role');
    this.registerSubmitBtn = page.locator('#register-submit-btn');
    this.registerErrorAlert = page.locator('#register-error');
    this.registerErrorAlertText = page.locator('#register-error-text');
    this.registerSuccessAlert = page.locator('#register-success');
  }

  // Chuyển sang tab Đăng ký
  async switchToRegisterTab() {
    await this.tabRegister.click();
    await expect(this.regUsernameInput).toBeVisible();
  }

  // Chuyển sang tab Đăng nhập
  async switchToLoginTab() {
    await this.tabLogin.click();
    await expect(this.usernameInput).toBeVisible();
  }

  // Thực hiện hành động điền form và click Đăng Nhập
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginSubmitBtn.click();
  }

  // Thực hiện hành động điền form và click Đăng Ký
  async register(username: string, password: string, role: 'admin' | 'viewer' = 'admin') {
    await this.regUsernameInput.fill(username);
    await this.regPasswordInput.fill(password);
    await this.regRoleSelect.selectOption(role);
    await this.registerSubmitBtn.click();
  }

  // Lấy nội dung thông báo lỗi đăng nhập hiển thị trên giao diện
  async getErrorMessage(): Promise<string> {
    await this.errorAlert.waitFor({ state: 'visible' });
    const text = await this.errorAlertText.textContent();
    return text ? text.trim() : '';
  }

  // Lấy nội dung thông báo lỗi đăng ký hiển thị trên giao diện
  async getRegisterErrorMessage(): Promise<string> {
    await this.registerErrorAlert.waitFor({ state: 'visible' });
    const text = await this.registerErrorAlertText.textContent();
    return text ? text.trim() : '';
  }

  // Kiểm tra xem alert lỗi đăng nhập có đang hiển thị hay không
  async isErrorVisible(): Promise<boolean> {
    return this.errorAlert.isVisible();
  }
}

import { expect } from '@playwright/test';
