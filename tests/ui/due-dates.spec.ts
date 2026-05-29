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

  test('nên hiển thị đúng màu huy hiệu cảnh báo (đỏ cho quá hạn, vàng cho sắp hết hạn, bình thường cho xa)', async ({ page }) => {
    // 1. Tạo task quá hạn (hôm qua)
    await dashboardPage.openCreateTaskModal();
    await page.fill('#task-title', 'Task Quá Hạn');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await page.fill('#task-due-date', yesterday.toISOString().split('T')[0]);
    await dashboardPage.saveTask();

    // 2. Tạo task sắp hết hạn (ngày mai)
    await dashboardPage.openCreateTaskModal();
    await page.fill('#task-title', 'Task Sắp Hết Hạn');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('#task-due-date', tomorrow.toISOString().split('T')[0]);
    await dashboardPage.saveTask();

    // 3. Tạo task hết hạn xa (5 ngày nữa)
    await dashboardPage.openCreateTaskModal();
    await page.fill('#task-title', 'Task Hạn Xa');
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 5);
    await page.fill('#task-due-date', farFuture.toISOString().split('T')[0]);
    await dashboardPage.saveTask();

    // 4. Xác minh màu sắc huy hiệu trên giao diện
    const cardOverdue = page.locator('.task-item').filter({ hasText: 'Task Quá Hạn' });
    const badgeOverdue = cardOverdue.locator('.due-date-badge');
    await expect(badgeOverdue).toHaveClass(/due-date-overdue/);

    const cardWarning = page.locator('.task-item').filter({ hasText: 'Task Sắp Hết Hạn' });
    const badgeWarning = cardWarning.locator('.due-date-badge');
    await expect(badgeWarning).toHaveClass(/due-date-warning/);

    const cardNormal = page.locator('.task-item').filter({ hasText: 'Task Hạn Xa' });
    const badgeNormal = cardNormal.locator('.due-date-badge');
    // Đảm bảo không có class cảnh báo quá hạn hay sắp hết hạn
    await expect(badgeNormal).not.toHaveClass(/due-date-overdue/);
    await expect(badgeNormal).not.toHaveClass(/due-date-warning/);
  });
});
