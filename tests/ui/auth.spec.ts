import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm Thử Đăng Nhập & Xác Thực (Auth Tests)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
  });

  test('nên hiển thị chính xác giao diện trang đăng nhập', async ({ page }) => {
    // Xác minh tiêu đề trang và hiển thị của các ô nhập liệu
    await expect(page).toHaveTitle(/Trình Quản Lý Công Việc/);
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginSubmitBtn).toBeVisible();
    await expect(loginPage.errorAlert).toBeHidden();
  });

  test('nên hiển thị thông báo lỗi khi đăng nhập sai tài khoản hoặc mật khẩu', async () => {
    await loginPage.login('wronguser', 'wrongpassword');
    
    // Xác minh thông báo lỗi hiển thị thành công bằng cơ chế tự động đợi của Playwright
    await expect(loginPage.errorAlert).toBeVisible();
    
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toBe('Tên đăng nhập hoặc mật khẩu không chính xác.');
  });

  test('nên đăng nhập thành công với tài khoản hợp lệ và đăng xuất ra ngoài', async () => {
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
