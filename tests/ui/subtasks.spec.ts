import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Tính năng Việc con (Subtasks / Checklists)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Tự động chấp nhận mọi hộp thoại xác nhận (confirm dialogs)
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await loginPage.navigate();
    await loginPage.login('admin', 'password123');
    await expect(dashboardPage.userDisplayName).toBeVisible();
    await dashboardPage.resetDatabase();
  });

  test('nên tạo công việc với nhiều việc con và hiển thị thanh tiến trình chính xác', async ({ page }) => {
    const taskTitle = 'Chuẩn bị tài liệu Release';
    
    await dashboardPage.openCreateTaskModal();
    await dashboardPage.fillTaskForm(taskTitle, 'Mô tả chi tiết tài liệu');
    
    // Thêm các việc con
    await dashboardPage.addSubtask('Soạn thảo Release Notes');
    await dashboardPage.addSubtask('Cập nhật tài liệu API');
    await dashboardPage.addSubtask('Gửi email thông báo cho team');

    // Mặc định tạo ra thì progress bar phải hiển thị 0/3
    const progressText = page.locator('#modal-subtask-text');
    await expect(progressText).toHaveText('0/3');

    // Tích chọn hoàn thành 2 công việc con đầu tiên
    await dashboardPage.checkSubtask(0, true); // Việc 1
    await dashboardPage.checkSubtask(1, true); // Việc 2
    
    // Kiểm tra progress text đổi thành 2/3
    await expect(progressText).toHaveText('2/3');
    
    // Lưu công việc
    await dashboardPage.saveTask();

    // Kiểm tra hiển thị indicator ngoài thẻ công việc (Kanban card)
    const indicator = dashboardPage.getTaskSubtasksIndicator(taskTitle);
    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText('2/3');

    // Mở lại công việc để kiểm tra xem subtasks có lưu đúng không
    await dashboardPage.getTaskCard(taskTitle).locator('.edit-task').click();
    await expect(dashboardPage.taskModal).toBeVisible();
    
    // Kiểm tra 2 ô đầu tiên vẫn đang được check
    const checkbox1 = dashboardPage.subtasksContainer.locator('.subtask-item').nth(0).locator('input[type="checkbox"]');
    const checkbox2 = dashboardPage.subtasksContainer.locator('.subtask-item').nth(1).locator('input[type="checkbox"]');
    const checkbox3 = dashboardPage.subtasksContainer.locator('.subtask-item').nth(2).locator('input[type="checkbox"]');
    
    await expect(checkbox1).toBeChecked();
    await expect(checkbox2).toBeChecked();
    await expect(checkbox3).not.toBeChecked();

    // Hoàn thành nốt công việc thứ 3
    await dashboardPage.checkSubtask(2, true);
    await expect(progressText).toHaveText('3/3');
    
    // Lưu lại
    await dashboardPage.saveTask();
    
    // Kiểm tra lại ngoài Dashboard
    await expect(indicator).toContainText('3/3');
  });
});
