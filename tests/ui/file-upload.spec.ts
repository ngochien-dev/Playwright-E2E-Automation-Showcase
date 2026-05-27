import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import path from 'path';

test.describe('Kiểm thử Tính năng Tải File Đính Kèm (File Upload)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await loginPage.navigate();
    await loginPage.login('admin', 'password123');
    await expect(dashboardPage.userDisplayName).toBeVisible();
    await dashboardPage.resetDatabase();
  });

  test('nên tạo công việc, tải lên một file báo cáo và xác minh link tải xuống', async ({ page }) => {
    const taskTitle = 'Kiểm thử Báo Cáo Bảo Mật';
    
    // 1. Tạo task mới (Lúc tạo mới form tải file sẽ bị ẩn)
    await dashboardPage.openCreateTaskModal();
    await dashboardPage.fillTaskForm(taskTitle, 'Cần đính kèm báo cáo quét bảo mật');
    await dashboardPage.saveTask();
    
    // 2. Mở lại task vừa tạo
    await dashboardPage.getTaskCard(taskTitle).locator('.edit-task').click();
    await expect(dashboardPage.taskModal).toBeVisible();
    
    // 3. Thực hiện tải file lên
    // Đường dẫn tuyệt đối đến file mock
    const fileToUpload = path.join(__dirname, '..', 'fixtures', 'sample-report.pdf');
    
    // Đảm bảo nút tải file và form tải file hiển thị
    await expect(dashboardPage.fileInput).toBeAttached();
    
    // Gọi hàm POM thực hiện setInputFiles và đợi API trả về
    await dashboardPage.uploadAttachment(fileToUpload);
    
    // 4. Kiểm tra UI hiển thị đúng tên file và link href không trống
    await expect(dashboardPage.attachmentLink).toBeVisible();
    await expect(dashboardPage.attachmentLink).toHaveText('sample-report.pdf');
    
    const href = await dashboardPage.attachmentLink.getAttribute('href');
    expect(href).toContain('/uploads/');
    
    // Lưu lại và mở ra kiểm tra lần 2 để đảm bảo đã lưu vào Database
    await dashboardPage.saveTask();
    
    await dashboardPage.getTaskCard(taskTitle).locator('.edit-task').click();
    await expect(dashboardPage.taskModal).toBeVisible();
    await expect(dashboardPage.attachmentLink).toBeVisible();
    await expect(dashboardPage.attachmentLink).toHaveText('sample-report.pdf');
  });
});
