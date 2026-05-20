import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Kiểm thử So Sánh Hình Ảnh Giao Diện (Visual Testing)', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Bỏ qua kiểm thử visual trên môi trường GitHub Actions CI (Linux) để tránh lệch font rendering so với Windows
    if (process.env.GITHUB_ACTIONS) {
      test.skip(true, 'Bỏ qua kiểm thử so sánh hình ảnh trên CI');
    }
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('Giao diện Trang Đăng nhập - So sánh hình ảnh snapshot', async ({ page }) => {
    // Định vị khung biểu mẫu đăng nhập
    const loginCard = page.locator('#auth-view');
    await expect(loginCard).toBeVisible();

    // Kiểm thử so sánh hình ảnh (Visual Snapshot)
    // Tự động bỏ qua sai lệch nhỏ (dưới 2% số pixel) do kết cấu font chữ khác biệt trên từng hệ điều hành
    await expect(loginCard).toHaveScreenshot('login-card.png', {
      maxDiffPixelRatio: 0.02
    });
  });

  test('Thanh Header của Dashboard - So sánh hình ảnh snapshot', async ({ page }) => {
    // Thực hiện đăng nhập bằng tài khoản quản trị viên
    await loginPage.login('admin', 'password123');

    // Chờ tiêu đề trang Dashboard hiển thị ổn định
    const header = page.locator('.header-card');
    await expect(header).toBeVisible();

    // Kiểm thử so sánh hình ảnh thanh Header của Dashboard
    await expect(header).toHaveScreenshot('dashboard-header.png', {
      maxDiffPixelRatio: 0.02
    });
  });
});
