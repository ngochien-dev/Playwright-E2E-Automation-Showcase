import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Thao tác Hàng loạt (Batch Actions E2E)', () => {
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

  test('nên chọn nhiều công việc và cập nhật độ ưu tiên / lưu trữ hàng loạt thành công', async ({ page }) => {
    // 1. Tạo 3 task
    await dashboardPage.createTask('Task Batch A', 'Mô tả A');
    await dashboardPage.createTask('Task Batch B', 'Mô tả B');
    await dashboardPage.createTask('Task Batch C', 'Mô tả C');

    const cardA = page.locator('.task-item').filter({ has: page.locator('.task-item-title', { hasText: 'Task Batch A' }) });
    const cardB = page.locator('.task-item').filter({ has: page.locator('.task-item-title', { hasText: 'Task Batch B' }) });
    const cardC = page.locator('.task-item').filter({ has: page.locator('.task-item-title', { hasText: 'Task Batch C' }) });

    // 2. Click nút "Chọn Nhiều" để kích hoạt chế độ chọn hàng loạt
    await page.click('#batch-select-btn');
    await expect(page.locator('body')).toHaveClass(/batch-select-active/);

    // 3. Tích chọn cả 3 task bằng cách click vào thân thẻ task
    await cardA.click();
    await cardB.click();
    await cardC.click();

    // Xác minh thanh tác vụ hàng loạt hiển thị số lượng đúng
    const countText = page.locator('#batch-selected-count');
    await expect(countText).toBeVisible();
    await expect(countText).toHaveText('Đã chọn 3 công việc');

    // 4. Click đổi độ ưu tiên thành "Cao" hàng loạt
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/tasks/batch') && 
      response.request().method() === 'PUT'
    );
    await page.click('#batch-priority-high');
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Xác minh Toast thông báo thành công và các thẻ được đổi độ ưu tiên
    const toast = page.locator('.toast-item');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Cập nhật độ ưu tiên hàng loạt thành công');

    await expect(cardA.locator('.priority-badge')).toHaveText('Cao');
    await expect(cardB.locator('.priority-badge')).toHaveText('Cao');
    await expect(cardC.locator('.priority-badge')).toHaveText('Cao');

    // 5. Thử nghiệm lưu trữ (archived) hàng loạt cho Task A và Task B
    await page.click('#batch-select-btn'); // Bật lại chế độ chọn nhiều
    await cardA.click();
    await cardB.click();
    await expect(countText).toHaveText('Đã chọn 2 công việc');

    // Chấp nhận hộp thoại xác nhận xóa hàng loạt
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    const archiveResponsePromise = page.waitForResponse(res => 
      res.url().includes('/api/tasks/batch') && 
      res.request().method() === 'PUT'
    );
    await page.click('#batch-archive-btn');
    const archiveResponse = await archiveResponsePromise;
    expect(archiveResponse.status()).toBe(200);

    // Xác minh Task A và Task B biến mất khỏi Kanban, chỉ còn lại Task C
    await expect(cardA).toBeHidden();
    await expect(cardB).toBeHidden();
    await expect(cardC).toBeVisible();
  });
});
