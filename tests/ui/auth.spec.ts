import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Authentication Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
  });

  test('should display login page layout correctly', async ({ page }) => {
    // Xác minh tiêu đề trang và hiển thị của các input biểu mẫu
    await expect(page).toHaveTitle(/Sleek Task Manager/);
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginSubmitBtn).toBeVisible();
    await expect(loginPage.errorAlert).toBeHidden();
  });

  test('should show error message with invalid credentials', async () => {
    await loginPage.login('wronguser', 'wrongpassword');
    
    // Xác minh thông báo lỗi hiển thị thành công bằng cơ chế tự động đợi của Playwright
    await expect(loginPage.errorAlert).toBeVisible();
    
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toBe('Invalid username or password.');
  });

  test('should login successfully with valid credentials and logout', async () => {
    // Thực hiện đăng nhập bằng tài khoản admin chính xác
    await loginPage.login('admin', 'password123');

    // Xác minh giao diện dashboard hiển thị tên người dùng chính xác
    await expect(dashboardPage.userDisplayName).toBeVisible();
    const displayName = await dashboardPage.getUsername();
    expect(displayName).toBe('admin');

    // Xác minh form đăng nhập đã bị ẩn đi
    await expect(loginPage.usernameInput).toBeHidden();

    // Thực hiện đăng xuất khỏi hệ thống
    await dashboardPage.logout();

    // Xác minh hệ thống đã chuyển hướng lại về trang đăng nhập
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(dashboardPage.userDisplayName).toBeHidden();
  });
});
