import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Phụ thuộc Công việc (Task Dependencies)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
    
    // Đăng ký bộ lắng nghe dialog để chấp nhận thông báo xác nhận reset database
    const handleResetDialog = async (dialog) => {
      await dialog.accept();
    };
    page.on('dialog', handleResetDialog);

    await loginPage.login('admin', 'password123');
    await dashboardPage.resetDatabase();

    // Hủy đăng ký bộ lắng nghe dialog sau khi reset để tránh xung đột với các trường hợp khác
    page.off('dialog', handleResetDialog);
  });

  test('nên chặn hoàn thành task phụ thuộc khi task blocker chưa xong', async ({ page }) => {
    // 1. Tạo 2 task: Task A và Task B
    await dashboardPage.createTask('Task A', 'Công việc chặn');
    await dashboardPage.createTask('Task B', 'Công việc bị chặn');

    // Sử dụng bộ định vị chính xác dựa trên tiêu đề thẻ để tránh strict mode violation do chữ "Task A" xuất hiện trong badge của Task B
    const cardA = page.locator('.task-item').filter({ has: page.locator('.task-item-title', { hasText: 'Task A' }) });
    const cardB = page.locator('.task-item').filter({ has: page.locator('.task-item-title', { hasText: 'Task B' }) });

    // 2. Thiết lập Task B phụ thuộc vào Task A (Bị chặn bởi Task A)
    await cardB.click();
    
    // Đợi modal hiển thị và dropdown chứa Task A
    const dependencySelect = page.locator('#task-dependency');
    await expect(dependencySelect).toBeVisible();
    await dependencySelect.selectOption({ label: 'Task A' });
    await dashboardPage.saveTask();

    // Kiểm tra xem thẻ Task B có hiển thị badge phụ thuộc không
    const dependencyBadge = cardB.locator('.dependency-badge');
    await expect(dependencyBadge).toBeVisible();
    await expect(dependencyBadge).toContainText('Bị chặn bởi: Task A');

    // 3. Di chuyển Task B sang "Đang làm" (In Progress) -> Thành công
    const moveBtnB = cardB.locator('.move-task');
    await moveBtnB.click();
    await page.waitForResponse(response => response.url().includes('/api/tasks/') && response.status() === 200);
    
    const listInProgress = page.locator('#list-in-progress');
    await expect(listInProgress.locator('.task-item', { hasText: 'Task B' })).toBeVisible();

    // 4. Thử di chuyển Task B sang "Đã Xong" (Completed) -> Bị chặn
    let alertMessage = '';
    page.once('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await moveBtnB.click();
    await page.waitForTimeout(500); // Đợi dialog kích hoạt và đóng
    expect(alertMessage).toContain('đang bị chặn bởi công việc "Task A" chưa hoàn thành');

    // Kiểm tra Task B vẫn nằm ở cột "Đang làm"
    await expect(listInProgress.locator('.task-item', { hasText: 'Task B' })).toBeVisible();

    // 5. Di chuyển Task A sang "Đã Xong" (Completed)
    const moveBtnA = cardA.locator('.move-task');
    
    // todo -> in_progress
    await moveBtnA.click();
    await page.waitForResponse(response => response.url().includes('/api/tasks/') && response.status() === 200);

    // in_progress -> completed
    await moveBtnA.click();
    await page.waitForResponse(response => response.url().includes('/api/tasks/') && response.status() === 200);

    const listCompleted = page.locator('#list-completed');
    await expect(listCompleted.locator('.task-item', { hasText: 'Task A' })).toBeVisible();

    // 6. Di chuyển Task B sang "Đã Xong" (Completed) -> Thành công
    await moveBtnB.click();
    await page.waitForResponse(response => response.url().includes('/api/tasks/') && response.status() === 200);

    // Kiểm tra Task B nằm ở cột "Đã Xong"
    await expect(listCompleted.locator('.task-item', { hasText: 'Task B' })).toBeVisible();
  });
});
