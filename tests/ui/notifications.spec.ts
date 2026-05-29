import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Trung Tâm Thông Báo (In-App Notification Center)', () => {
  let adminPage: any;
  let viewerPage: any;
  let adminDashboard: DashboardPage;
  let viewerDashboard: DashboardPage;

  test.beforeEach(async ({ browser }) => {
    // 1. Tạo session Admin
    const adminContext = await browser.newContext();
    adminPage = await adminContext.newPage();
    const adminLogin = new LoginPage(adminPage);
    adminDashboard = new DashboardPage(adminPage);

    adminPage.on('dialog', async (dialog: any) => {
      await dialog.accept();
    });

    await adminLogin.navigate();
    await adminLogin.login('admin', 'password123');
    await adminDashboard.resetDatabase();

    // 2. Tạo session Viewer
    const viewerContext = await browser.newContext();
    viewerPage = await viewerContext.newPage();
    const viewerLogin = new LoginPage(viewerPage);
    viewerDashboard = new DashboardPage(viewerPage);

    await viewerLogin.navigate();
    await viewerLogin.login('viewer', 'password123');
  });

  test('nên nhận được thông báo in-app thời gian thực khi được giao task mới', async () => {
    const taskTitle = 'Task Assignment E2E Notification';

    // 1. Admin tạo task mới và giao cho viewer
    await adminDashboard.openCreateTaskModal();
    await adminPage.fill('#task-title', taskTitle);
    await adminPage.selectOption('#task-assignee', 'viewer');
    await adminDashboard.saveTask();

    // 2. Viewer kiểm chứng hiển thị Toast thông báo và badge chuông đổi màu/hiển thị
    const toast = viewerPage.locator('.toast-item');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('admin đã giao công việc "Task Assignment E2E Notification" cho bạn.');

    const badge = viewerPage.locator('#notification-badge');
    await expect(badge).toBeVisible();

    // 3. Viewer click chuông mở danh sách thông báo
    await viewerPage.click('#notification-bell-btn');
    const dropdown = viewerPage.locator('#notification-dropdown');
    await expect(dropdown).toBeVisible();
    await viewerPage.waitForTimeout(500); // Đợi các cuộc gọi API và DOM ổn định

    // 4. Xác minh thông báo hiển thị đúng nội dung và có trạng thái "chưa đọc" (unread)
    const notificationItem = viewerPage.locator('.notification-item').first();
    await expect(notificationItem).toContainText('admin đã giao công việc');
    await expect(notificationItem).toHaveClass(/unread/);

    // 5. Click nút "Đọc tất cả" để đánh dấu tất cả thông báo đã đọc -> badge chuông biến mất và class unread biến mất
    await viewerPage.click('#mark-all-read-btn');
    await expect(notificationItem).not.toHaveClass(/unread/);
    await expect(badge).toBeHidden();
  });

  test('nên bật/tắt dropdown thông báo khi click chuông và đóng lại khi click ra ngoài', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('admin', 'password123');

    const bellBtn = page.locator('#notification-bell-btn');
    const dropdown = page.locator('#notification-dropdown');

    // Mặc định dropdown bị ẩn
    await expect(dropdown).toBeHidden();

    // Click vào chuông để hiển thị dropdown
    await bellBtn.click();
    await expect(dropdown).toBeVisible();

    // Click chuông lần nữa để ẩn dropdown
    await bellBtn.click();
    await expect(dropdown).toBeHidden();

    // Click chuông để hiện lại
    await bellBtn.click();
    await expect(dropdown).toBeVisible();

    // Click vào vùng khác ngoài dropdown (ví dụ click vào h2 tiêu đề "Bảng Công Việc")
    await page.click('h2:has-text("Bảng Công Việc")');
    await expect(dropdown).toBeHidden();
  });
});
