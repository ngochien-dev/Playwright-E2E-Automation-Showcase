import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import fs from 'fs';
import path from 'path';

test.describe('Kiểm thử Tính năng Xuất dữ liệu (Export CSV)', () => {
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

  test('nên xuất file CSV chứa danh sách công việc thành công', async ({ page }) => {
    // 1. Chờ sự kiện download bắt đầu
    const downloadPromise = page.waitForEvent('download');
    
    // 2. Click nút Xuất CSV
    await page.click('#export-csv-btn');
    
    // 3. Đợi file tải xuống
    const download = await downloadPromise;
    
    // 4. Kiểm tra tên file đề xuất
    expect(download.suggestedFilename()).toMatch(/^tasks_export_\d+\.csv$/);
    
    // 5. Lưu file vào thư mục tạm và đọc nội dung
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Đọc nội dung file CSV
    const fileContent = fs.readFileSync(downloadPath!, 'utf-8');
    
    // 6. Kiểm tra nội dung (Có chứa tiêu đề cột và task mặc định)
    expect(fileContent).toContain('ID,Tiêu đề,Mô tả,Trạng thái,Độ ưu tiên,Người được giao,Ngày hết hạn,Thẻ');
    expect(fileContent).toContain('Task hệ thống ban đầu');
  });

  test('nên xuất file CSV chứa chính xác số dòng tương ứng với các task hiện có', async ({ page }) => {
    // 1. Tạo thêm 2 task mới
    await dashboardPage.createTask('Export Task 1', 'Mô tả 1');
    await dashboardPage.createTask('Export Task 2', 'Mô tả 2');

    // 2. Chờ sự kiện download bắt đầu
    const downloadPromise = page.waitForEvent('download');
    await page.click('#export-csv-btn');
    const download = await downloadPromise;

    // 3. Đọc nội dung file tải xuống
    const downloadPath = await download.path();
    const fileContent = fs.readFileSync(downloadPath!, 'utf-8');

    // 4. Phân tích số dòng (bỏ dòng tiêu đề và dòng trống ở cuối)
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    // Tổng số task hiện có: 1 task mặc định lúc reset + 2 task vừa tạo = 3 tasks.
    // Số dòng trong CSV: 1 dòng header + 3 dòng tasks = 4 dòng.
    expect(lines.length).toBe(4);
    
    expect(fileContent).toContain('Export Task 1');
    expect(fileContent).toContain('Export Task 2');
  });
});
