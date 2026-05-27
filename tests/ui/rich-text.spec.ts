import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Trình soạn thảo văn bản (Rich Text Editor)', () => {
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

  test('nên nhập và định dạng văn bản với Quill Editor thành công', async ({ page }) => {
    await dashboardPage.openCreateTaskModal();
    await page.fill('#task-title', 'Task with Rich Text');
    
    // Đảm bảo Quill editor đã hiển thị
    const editor = page.locator('.ql-editor');
    await expect(editor).toBeVisible();

    // Nhập nội dung
    await editor.click();
    await page.keyboard.type('Nội dung bình thường. ');

    // Bật In đậm (Bold)
    await page.click('.ql-bold');
    await page.keyboard.type('Nội dung in đậm.');

    await dashboardPage.saveTask();

    // Mở lại công việc để kiểm tra nội dung
    const taskCard = page.locator('.task-item').filter({ hasText: 'Task with Rich Text' });
    await expect(taskCard).toBeVisible();
    await taskCard.click();

    // Đảm bảo nội dung trong editor có chứa thẻ strong (in đậm)
    const editorContent = await editor.innerHTML();
    expect(editorContent).toContain('Nội dung bình thường.');
    expect(editorContent).toContain('<strong>Nội dung in đậm.</strong>');
  });
});
