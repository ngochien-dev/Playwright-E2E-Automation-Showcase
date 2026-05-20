import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Task Management (CRUD) Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Chấp nhận toàn cục tất cả các hộp thoại native confirm của trình duyệt (xóa task, reset db,...)
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    // Đăng nhập và reset database để đảm bảo môi trường sạch trước mỗi test case
    await loginPage.navigate();
    await loginPage.login('admin', 'password123');
    await dashboardPage.resetDatabase();
  });

  test('should display initial default task after database reset', async () => {
    // Xác minh hiển thị của task hệ thống được tạo tự động sau khi reset
    const initialTask = dashboardPage.getTaskCard('Initial System Task');
    await expect(initialTask).toBeVisible();
    await expect(initialTask.locator('.task-item-desc')).toHaveText('Default task created during reset setup.');
    
    await expect(dashboardPage.countTodo).toHaveText('1');
  });

  test('should create a new task and add it to To Do column', async () => {
    const taskTitle = 'Write Playwright Test Suite';
    const taskDesc = 'Write POM classes, setup config, and run validation specs.';

    await dashboardPage.createTask(taskTitle, taskDesc);

    // Xác minh thẻ task mới đã được thêm thành công vào giao diện
    const taskCard = dashboardPage.getTaskCard(taskTitle);
    await expect(taskCard).toBeVisible();
    await expect(taskCard.locator('.task-item-desc')).toHaveText(taskDesc);

    // Xác minh bộ đếm số lượng task ở cột To Do tăng lên
    await expect(dashboardPage.countTodo).toHaveText('2'); // Gồm task mặc định + task mới tạo
  });

  test('should update task details and move to another column via modal', async () => {
    const originalTitle = 'Initial System Task';
    const newTitle = 'Review Team Code';
    const newDesc = 'Inspect MR submissions and run tests locally.';

    // Sửa thông tin task và thay đổi cột trạng thái thông qua Modal Form
    await dashboardPage.editTask(originalTitle, newTitle, newDesc, 'in_progress');

    // Xác minh task có tên cũ đã biến mất
    const oldCard = dashboardPage.getTaskCard(originalTitle);
    await expect(oldCard).toBeHidden();

    // Xác minh task với tên mới đã được chuyển sang cột In Progress
    const newCard = dashboardPage.getTaskCard(newTitle);
    await expect(newCard).toBeVisible();
    await expect(newCard.locator('.task-item-desc')).toHaveText(newDesc);

    // Xác minh số lượng task ở cột To Do và In Progress cập nhật đúng
    await expect(dashboardPage.countTodo).toHaveText('0');
    await expect(dashboardPage.countInProgress).toHaveText('1');
  });

  test('should move task along columns via quick action move button', async () => {
    const taskTitle = 'Initial System Task';

    // Click nút chuyển nhanh từ cột To Do -> In Progress
    await dashboardPage.moveTaskForward(taskTitle);
    await expect(dashboardPage.countTodo).toHaveText('0');
    await expect(dashboardPage.countInProgress).toHaveText('1');

    // Click nút chuyển nhanh từ cột In Progress -> Completed
    await dashboardPage.moveTaskForward(taskTitle);
    await expect(dashboardPage.countInProgress).toHaveText('0');
    await expect(dashboardPage.countCompleted).toHaveText('1');

    // Xác minh rằng các task ở cột Completed sẽ không hiển thị nút chuyển trạng thái tiếp nữa
    const completedCard = dashboardPage.getTaskCard(taskTitle);
    await expect(completedCard.locator('.move-task')).toBeHidden();
  });

  test('should delete a task and update dashboard metrics', async () => {
    const taskTitle = 'Initial System Task';

    // Thực hiện thao tác xóa task
    await dashboardPage.deleteTask(taskTitle);

    // Xác minh thẻ task đó đã bị xóa hoàn toàn khỏi giao diện
    const taskCard = dashboardPage.getTaskCard(taskTitle);
    await expect(taskCard).toBeHidden();

    // Xác minh bộ đếm của cột giảm về 0
    await expect(dashboardPage.countTodo).toHaveText('0');
  });
});
