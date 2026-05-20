import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import tasksData from '../data/tasks-data.json';

test.describe('Kiểm thử Hướng Dữ Liệu (DDT)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Chấp nhận toàn cục tất cả các hộp thoại native confirm của trình duyệt
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await loginPage.navigate();
    await loginPage.login('admin', 'password123');
    await dashboardPage.resetDatabase();
  });

  // Duyệt qua từng bộ dữ liệu trong file JSON để tự động chạy các test cases
  for (const taskProfile of tasksData) {
    test(`nên tạo động công việc thành công: "${taskProfile.title}"`, async () => {
      await dashboardPage.createTask(taskProfile.title, taskProfile.description);

      // Xác minh thẻ task đã được dựng lên với tiêu đề và mô tả chính xác
      const taskCard = dashboardPage.getTaskCard(taskProfile.title);
      await expect(taskCard).toBeVisible();
      await expect(taskCard.locator('.task-item-desc')).toHaveText(taskProfile.description);
    });
  }
});
