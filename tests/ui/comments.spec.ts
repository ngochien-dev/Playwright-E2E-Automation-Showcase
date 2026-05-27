import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Tính năng Bình luận (Comments)', () => {
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

  test('nên thêm bình luận mới vào công việc thành công', async ({ page }) => {
    // 1. Tạo công việc mới
    await dashboardPage.openCreateTaskModal();
    await page.fill('#task-title', 'Task with Comments');
    await dashboardPage.saveTask();

    // 2. Mở lại công việc
    const taskCard = page.locator('.task-item').filter({ hasText: 'Task with Comments' });
    await expect(taskCard).toBeVisible();
    await taskCard.click();

    // 3. Đảm bảo form bình luận hiển thị
    const commentsGroup = page.locator('#comments-group');
    await expect(commentsGroup).toBeVisible();

    // 4. Nhập bình luận
    await page.fill('#new-comment-input', 'Đây là một bình luận test.');
    await page.click('#add-comment-btn');

    // 5. Xác minh bình luận hiển thị trong danh sách tạm thời (trước khi lưu server)
    const commentItem = page.locator('.comment-item').first();
    await expect(commentItem).toBeVisible();
    await expect(commentItem.locator('.comment-author')).toHaveText('admin');
    await expect(commentItem.locator('.comment-text')).toHaveText('Đây là một bình luận test.');

    // 6. Lưu công việc (Gửi API PUT)
    await dashboardPage.saveTask();

    // 7. Mở lại công việc lần nữa để đảm bảo bình luận đã được lưu trên Server
    await taskCard.click();
    await expect(page.locator('.comment-item').first().locator('.comment-text')).toHaveText('Đây là một bình luận test.');
  });
});
