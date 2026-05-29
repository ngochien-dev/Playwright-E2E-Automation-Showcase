import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Thùng rác & Lưu trữ Công việc (Recycle Bin & Soft Delete)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Chấp nhận tất cả các native confirm dialogs của trình duyệt
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await loginPage.navigate();
    await loginPage.login('admin', 'password123');
    await dashboardPage.resetDatabase();
  });

  test('nên thực hiện được luồng di chuyển task vào Thùng rác, Khôi phục và Xóa vĩnh viễn', async ({ page }) => {
    const taskTitle = 'Task Thử Nghiệm Thùng Rác';

    // 1. Tạo task mới
    await dashboardPage.createTask(taskTitle, 'Mô tả công việc kiểm thử lưu trữ');
    const taskCard = dashboardPage.getTaskCard(taskTitle);
    await expect(taskCard).toBeVisible();

    // 2. Click nút xóa ngoài Kanban board (kích hoạt soft-delete)
    await taskCard.locator('.delete-task').click();
    await expect(taskCard).toBeHidden();

    // 3. Mở Drawer Thùng rác
    await page.click('#open-trash-btn');
    const trashDrawer = page.locator('#trash-drawer');
    await expect(trashDrawer).toBeVisible();

    // 4. Xác minh task đã xóa hiện diện trong Thùng rác
    const trashItem = page.locator('#trash-list .timeline-item', { hasText: taskTitle });
    await expect(trashItem).toBeVisible();

    // 5. Bấm nút Khôi phục (Restore)
    await trashItem.locator('.restore-task-btn').click();
    
    // Xác minh item biến mất khỏi thùng rác
    await expect(trashItem).toBeHidden();

    // Đóng drawer thùng rác
    await page.click('#close-trash-btn');
    await expect(trashDrawer).toBeHidden();

    // Xác minh task xuất hiện lại trên bảng Kanban
    await expect(taskCard).toBeVisible();

    // 6. Xóa lại task một lần nữa
    await taskCard.locator('.delete-task').click();
    await expect(taskCard).toBeHidden();

    // Mở lại Thùng rác
    await page.click('#open-trash-btn');
    await expect(trashDrawer).toBeVisible();
    await expect(trashItem).toBeVisible();

    // 7. Bấm nút Xóa (Xóa vĩnh viễn)
    await trashItem.locator('.perm-delete-task-btn').click();

    // Xác minh Thùng rác trở nên trống rỗng
    await expect(trashItem).toBeHidden();
    await expect(page.locator('#trash-list')).toContainText('Thùng rác trống.');
  });
});
