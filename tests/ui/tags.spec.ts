import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';


test.describe('Kiểm thử Hệ thống Gắn Thẻ (Tags)', () => {
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

  test('nên tạo công việc với nhiều tags và hiển thị đúng', async ({ page }) => {
    await dashboardPage.openCreateTaskModal();
    await page.fill('#task-title', 'Task có Tags');
    await page.fill('#task-tags', 'Bug, UI, Critical');
    await dashboardPage.saveTask();

    const taskCard = page.locator('.task-item').filter({ hasText: 'Task có Tags' });
    await expect(taskCard).toBeVisible();
    
    // Check tags
    await expect(taskCard.locator('.tag-pill', { hasText: 'Bug' })).toBeVisible();
    await expect(taskCard.locator('.tag-pill', { hasText: 'UI' })).toBeVisible();
    await expect(taskCard.locator('.tag-pill', { hasText: 'Critical' })).toBeVisible();
  });
});
