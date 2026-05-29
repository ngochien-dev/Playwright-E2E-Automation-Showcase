import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Tương tác nhanh Việc con trên thẻ (Quick Subtasks E2E)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
    
    // Đồng ý hộp thoại xác nhận khi reset database
    const handleResetDialog = async (dialog) => {
      await dialog.accept();
    };
    page.on('dialog', handleResetDialog);

    await loginPage.login('admin', 'password123');
    await dashboardPage.resetDatabase();

    page.off('dialog', handleResetDialog);
  });

  test('nên tương tác check/uncheck việc con trực tiếp trên thẻ Kanban thành công', async ({ page }) => {
    // 1. Tạo task mới có 2 subtasks
    await dashboardPage.openCreateTaskModal();
    await dashboardPage.fillTaskForm('Task Quick Subtask', 'Mô tả');
    await dashboardPage.addSubtask('Subtask Một');
    await dashboardPage.addSubtask('Subtask Hai');
    await dashboardPage.saveTask();

    const card = page.locator('.task-item').filter({ has: page.locator('.task-item-title', { hasText: 'Task Quick Subtask' }) });
    await expect(card).toBeVisible();

    // Xác minh chỉ số subtasks ban đầu là 0/2
    const indicator = card.locator('.task-subtasks-indicator');
    await expect(indicator).toHaveText(/0\/2/);

    // 2. Hover chuột vào thẻ task để kích hoạt hiển thị nhanh danh sách việc con
    await card.hover();
    const quickSubtasks = card.locator('.card-quick-subtasks');
    await expect(quickSubtasks).toBeVisible();

    // 3. Tích chọn subtask đầu tiên trực tiếp trên thẻ
    const firstCheckbox = card.locator('.card-quick-subtasks-item').first().locator('input[type="checkbox"]');
    
    const putResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/tasks/') && 
      response.request().method() === 'PUT' && 
      response.status() === 200
    );
    await firstCheckbox.check();
    await putResponsePromise;

    // Xác minh chỉ số tiến độ trên thẻ tự động cập nhật lên 1/2
    await expect(indicator).toHaveText(/1\/2/);

    // 4. Reload lại trang và xác minh trạng thái đã chọn được lưu bền bỉ
    await page.reload();
    await expect(page.locator('#dashboard-view')).toBeVisible();
    await expect(indicator).toHaveText(/1\/2/);
  });
});
