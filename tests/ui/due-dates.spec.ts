import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';


test.describe('Kiểm thử Quản lý Thời hạn (Due Dates)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
    await loginPage.login('admin', 'password123');
    await dashboardPage.resetDatabase();
  });

  test('nên tạo công việc với ngày hết hạn và hiển thị huy hiệu', async ({ page }) => {
    await dashboardPage.openCreateTaskModal();
    await page.fill('#task-title', 'Task có thời hạn');
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('#task-due-date', dateString);
    
    await dashboardPage.saveTask();

    // Verify card has due date badge
    const taskCard = page.locator('.task-item').filter({ hasText: 'Task có thời hạn' });
    await expect(taskCard).toBeVisible();
    
    const badge = taskCard.locator('.due-date-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/due-date-warning/); // tomorrow is within 2 days
  });
});
