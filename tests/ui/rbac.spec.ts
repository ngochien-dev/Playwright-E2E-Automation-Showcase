import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm Thử Phân Quyền Vai Trò (Role-Based Access Control - RBAC)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
  });

  test('Người xem (viewer) - nên không thấy các nút chỉnh sửa/thêm/xóa/reset trên giao diện', async ({ page }) => {
    // 1. Đăng nhập với tài khoản viewer
    await loginPage.login('viewer', 'password123');

    // 2. Xác minh hiển thị tên người dùng và vai trò đúng
    await expect(dashboardPage.userDisplayName).toHaveText('viewer (Người xem)');

    // 3. Xác minh các nút mutations chính bị ẩn hoàn toàn
    await expect(dashboardPage.openAddTaskBtn).toBeHidden();
    await expect(dashboardPage.resetDbBtn).toBeHidden();

    // 4. Reset DB qua API trước để tạo dữ liệu mặc định (sử dụng request của page)
    const requestContext = page.request;
    await requestContext.post('/api/db/reset');
    await page.reload();

    // 5. Xác minh các thẻ công việc không có nút hành động (chuyển trạng thái, sửa, xóa)
    const taskTitle = 'Task hệ thống ban đầu';
    const taskCard = dashboardPage.getTaskCard(taskTitle);
    await expect(taskCard).toBeVisible();

    const moveBtn = taskCard.locator('.move-task');
    const editBtn = taskCard.locator('.edit-task');
    const deleteBtn = taskCard.locator('.delete-task');
    
    await expect(moveBtn).toBeHidden();
    await expect(editBtn).toBeHidden();
    await expect(deleteBtn).toBeHidden();

    // 6. Xác minh thuộc tính draggable của thẻ không tồn tại hoặc bằng false
    const draggableAttr = await taskCard.getAttribute('draggable');
    expect(draggableAttr).toBeNull(); // Không draggable
  });

  test('Quản trị viên (admin) - nên có đầy đủ các quyền thao tác trên giao diện', async () => {
    // 1. Đăng nhập với tài khoản admin
    await loginPage.login('admin', 'password123');

    // 2. Xác minh hiển thị tên người dùng và vai trò
    await expect(dashboardPage.userDisplayName).toHaveText('admin (Quản trị viên)');

    // 3. Xác minh các nút mutations chính hiển thị rõ ràng
    await expect(dashboardPage.openAddTaskBtn).toBeVisible();
    await expect(dashboardPage.resetDbBtn).toBeVisible();

    // 4. Xác minh thẻ công việc hiển thị đầy đủ các hành động sửa/xóa/kéo thả
    const taskTitle = 'Task hệ thống ban đầu';
    const taskCard = dashboardPage.getTaskCard(taskTitle);
    await expect(taskCard).toBeVisible();

    await expect(taskCard.locator('.move-task')).toBeVisible();
    await expect(taskCard.locator('.edit-task')).toBeVisible();
    await expect(taskCard.locator('.delete-task')).toBeVisible();

    const draggableAttr = await taskCard.getAttribute('draggable');
    expect(draggableAttr).toBe('true');
  });
});
