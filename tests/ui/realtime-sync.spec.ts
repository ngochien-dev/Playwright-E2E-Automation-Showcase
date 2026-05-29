import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Đồng bộ thời gian thực (Real-time Collaboration & SSE)', () => {
  let adminPage: any;
  let viewerPage: any;
  let adminDashboard: DashboardPage;
  let viewerDashboard: DashboardPage;

  test.beforeEach(async ({ browser }) => {
    // 1. Tạo Context và Page cho Quản trị viên (Admin)
    const adminContext = await browser.newContext();
    adminPage = await adminContext.newPage();
    const adminLogin = new LoginPage(adminPage);
    adminDashboard = new DashboardPage(adminPage);

    // Chấp nhận các hộp thoại confirm
    adminPage.on('dialog', async (dialog: any) => {
      await dialog.accept();
    });

    await adminLogin.navigate();
    await adminLogin.login('admin', 'password123');
    await adminDashboard.resetDatabase();

    // 2. Tạo Context và Page cho Người xem (Viewer)
    const viewerContext = await browser.newContext();
    viewerPage = await viewerContext.newPage();
    const viewerLogin = new LoginPage(viewerPage);
    viewerDashboard = new DashboardPage(viewerPage);

    await viewerLogin.navigate();
    await viewerLogin.login('viewer', 'password123');
    await expect(viewerDashboard.userDisplayName).toContainText('viewer');
  });

  test('nên tự động cập nhật bảng công việc của viewer khi admin thực hiện CRUD', async () => {
    const taskTitle = 'Task Real-time SSE Sync';

    // 1. Admin tạo một task mới
    await adminDashboard.createTask(taskTitle, 'Mô tả test sync thời gian thực');

    // 2. Viewer kiểm tra xem task có tự động hiển thị mà không cần reload không
    const viewerTaskCard = viewerDashboard.getTaskCard(taskTitle);
    await expect(viewerTaskCard).toBeVisible({ timeout: 5000 });
    await expect(viewerTaskCard.locator('.task-item-desc')).toHaveText('Mô tả test sync thời gian thực');
    await expect(viewerDashboard.countTodo).toHaveText('2'); // Task mặc định + Task mới

    // 3. Admin chuyển task sang cột Đang làm (in_progress)
    await adminDashboard.moveTaskForward(taskTitle);

    // 4. Viewer kiểm tra xem task đã được cập nhật sang cột Đang làm trên UI của mình chưa
    await expect(viewerDashboard.countTodo).toHaveText('1');
    await expect(viewerDashboard.countInProgress).toHaveText('1');

    // 5. Admin xóa task
    await adminDashboard.deleteTask(taskTitle);

    // 6. Viewer kiểm tra xem task đã biến mất khỏi màn hình chưa
    await expect(viewerTaskCard).toBeHidden({ timeout: 5000 });
    await expect(viewerDashboard.countInProgress).toHaveText('0');
  });
});
