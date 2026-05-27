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
});
