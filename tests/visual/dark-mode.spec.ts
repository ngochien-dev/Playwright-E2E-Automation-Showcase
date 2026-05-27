import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử So Sánh Hình Ảnh Giao Diện Sáng/Tối (Theme Visual Testing)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Bỏ qua kiểm thử visual trên môi trường GitHub Actions CI (Linux) để tránh lệch font rendering so với Windows
    if (process.env.GITHUB_ACTIONS) {
      test.skip(true, 'Bỏ qua kiểm thử so sánh hình ảnh trên CI');
    }
    
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Chấp nhận toàn cục tất cả các hộp thoại native confirm của trình duyệt
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await loginPage.navigate();
    // Đăng nhập bằng tài khoản admin
    await loginPage.login('admin', 'password123');
    
    // Đợi dashboard hiển thị
    await expect(dashboardPage.userDisplayName).toBeVisible();
    // Reset dữ liệu để có trạng thái bảng công việc chuẩn
    await dashboardPage.resetDatabase();
  });

  test('Giao diện Bảng Công Việc (Light Mode) - So sánh hình ảnh snapshot', async ({ page }) => {
    // 1. Chụp màn hình Dark Mode (mặc định)
    const dashboardContainer = page.locator('.dashboard-wrapper');
    await expect(dashboardContainer).toBeVisible();
    await expect(dashboardContainer).toHaveScreenshot('dashboard-dark-mode.png', {
      maxDiffPixelRatio: 0.02
    });

    // 2. Chuyển đổi sang Light Mode
    await dashboardPage.toggleTheme();
    await expect(dashboardPage.themeToggleBtn).toContainText('Sáng');

    // 3. Chụp màn hình Light Mode
    await expect(dashboardContainer).toHaveScreenshot('dashboard-light-mode.png', {
      maxDiffPixelRatio: 0.02
    });
  });
});
