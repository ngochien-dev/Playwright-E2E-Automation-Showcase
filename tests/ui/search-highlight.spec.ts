import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Tìm kiếm và Highlight (Search Highlight E2E)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
    
    // Đồng ý hộp thoại xác nhận khi reset database
    const handleResetDialog = async (dialog: any) => {
      await dialog.accept();
    };
    page.on('dialog', handleResetDialog);

    await loginPage.login('admin', 'password123');
    await dashboardPage.resetDatabase();

    page.off('dialog', handleResetDialog);
  });

  test('nên highlight các thẻ task khớp từ khóa tìm kiếm và làm mờ các thẻ task không khớp', async ({ page }) => {
    // 1. Tạo 2 task để test
    await dashboardPage.createTask('Task Highlight Target', 'Đây là task mục tiêu để highlight');
    await dashboardPage.createTask('Task Other Background', 'Đây là task làm nền mờ đi');

    const cardTarget = page.locator('.task-item').filter({ has: page.locator('.task-item-title', { hasText: 'Task Highlight Target' }) });
    const cardBackground = page.locator('.task-item').filter({ has: page.locator('.task-item-title', { hasText: 'Task Other Background' }) });

    // Đảm bảo 2 task đều hiển thị ban đầu và không bị highlight/dimmed
    await expect(cardTarget).toBeVisible();
    await expect(cardBackground).toBeVisible();
    await expect(cardTarget).not.toHaveClass(/search-highlight/);
    await expect(cardTarget).not.toHaveClass(/search-dimmed/);
    await expect(cardBackground).not.toHaveClass(/search-highlight/);
    await expect(cardBackground).not.toHaveClass(/search-dimmed/);

    // 2. Nhập từ khóa "Target" vào ô tìm kiếm
    await page.fill('#search-input', 'Target');

    // 3. Xác minh cardTarget được highlight và cardBackground bị mờ
    await expect(cardTarget).toHaveClass(/search-highlight/);
    await expect(cardTarget).not.toHaveClass(/search-dimmed/);

    await expect(cardBackground).toHaveClass(/search-dimmed/);
    await expect(cardBackground).not.toHaveClass(/search-highlight/);

    // 4. Xóa ô tìm kiếm
    await page.fill('#search-input', '');

    // 5. Xác minh cả hai card trở lại trạng thái bình thường (không có highlight/dimmed)
    await expect(cardTarget).not.toHaveClass(/search-highlight/);
    await expect(cardTarget).not.toHaveClass(/search-dimmed/);
    await expect(cardBackground).not.toHaveClass(/search-highlight/);
    await expect(cardBackground).not.toHaveClass(/search-dimmed/);
  });
});
