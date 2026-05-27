import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';


test.describe('Kiểm thử Giao Việc (Assignment)', () => {
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

  test('nên giao việc cho một người dùng và hiển thị avatar', async ({ page }) => {
    // We expect the dropdown to have options fetched from /api/users
    await dashboardPage.openCreateTaskModal();
    await page.fill('#task-title', 'Task Assign');
    
    // Select the first user (admin)
    await page.selectOption('#task-assignee', 'admin');
    
    await dashboardPage.saveTask();

    const taskCard = page.locator('.task-item').filter({ hasText: 'Task Assign' });
    await expect(taskCard).toBeVisible();
    
    // Verify assignee avatar
    const avatar = taskCard.locator('.assignee-avatar');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveText('A'); // 'A' for admin
  });
});
