import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Giả Lập API & Chặn Kết Nối Mạng (Network Interception)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('nên giả lập phản hồi danh sách task và hiển thị các thẻ giả lập lên giao diện UI', async ({ page }) => {
    // Định nghĩa danh sách các task giả lập (mock tasks) bằng tiếng Việt
    const mockTasks = [
      { id: 991, title: 'Task Giả Lập Số Một', description: 'Mô tả chi tiết sinh ra từ Mock Playwright', status: 'todo' },
      { id: 992, title: 'Task Giả Lập Số Hai', description: 'Một mô tả mock khác từ API Interception', status: 'in_progress' }
    ];

    // Chặn API GET /api/tasks và trả về kết quả giả lập tự định nghĩa
    await page.route('**/api/tasks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTasks)
      });
    });

    // Thực hiện đăng nhập (sẽ kích hoạt hàm fetchTasks() gọi đến API đã bị chặn)
    await loginPage.navigate();
    await loginPage.login('admin', 'password123');

    // Xác minh các task giả lập được hiển thị chính xác trên giao diện các cột tương ứng
    const taskCard1 = dashboardPage.getTaskCard('Task Giả Lập Số Một');
    const taskCard2 = dashboardPage.getTaskCard('Task Giả Lập Số Hai');

    await expect(taskCard1).toBeVisible();
    await expect(taskCard1.locator('.task-item-desc')).toHaveText('Mô tả chi tiết sinh ra từ Mock Playwright');
    await expect(dashboardPage.countTodo).toHaveText('1');

    await expect(taskCard2).toBeVisible();
    await expect(taskCard2.locator('.task-item-desc')).toHaveText('Một mô tả mock khác từ API Interception');
    await expect(dashboardPage.countInProgress).toHaveText('1');
  });
});
