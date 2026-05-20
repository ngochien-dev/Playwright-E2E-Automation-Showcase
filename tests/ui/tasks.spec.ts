import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Quản Lý Công Việc (CRUD)', () => {
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

  test('nên hiển thị task mặc định hệ thống sau khi reset cơ sở dữ liệu', async () => {
    // Xác minh hiển thị của task hệ thống được tạo tự động sau khi reset
    const initialTask = dashboardPage.getTaskCard('Task hệ thống ban đầu');
    await expect(initialTask).toBeVisible();
    await expect(initialTask.locator('.task-item-desc')).toHaveText('Task mặc định được tạo trong quá trình khởi tạo.');
    
    await expect(dashboardPage.countTodo).toHaveText('1');
  });

  test('nên tạo công việc mới và thêm vào cột Cần Làm', async () => {
    const taskTitle = 'Viết bộ test tự động Playwright';
    const taskDesc = 'Viết các class POM, cài đặt cấu hình và chạy các file kiểm thử.';

    await dashboardPage.createTask(taskTitle, taskDesc);

    // Xác minh thẻ task mới đã được thêm thành công vào giao diện
    const taskCard = dashboardPage.getTaskCard(taskTitle);
    await expect(taskCard).toBeVisible();
    await expect(taskCard.locator('.task-item-desc')).toHaveText(taskDesc);

    // Xác minh bộ đếm số lượng task ở cột Cần Làm tăng lên
    await expect(dashboardPage.countTodo).toHaveText('2'); // Gồm task mặc định + task mới tạo
  });

  test('nên cập nhật chi tiết công việc và chuyển sang cột khác qua modal', async () => {
    const originalTitle = 'Task hệ thống ban đầu';
    const newTitle = 'Xem lại code của nhóm';
    const newDesc = 'Kiểm tra các yêu cầu gộp code và chạy thử test cục bộ.';

    // Sửa thông tin task và thay đổi cột trạng thái thông qua Modal Form
    await dashboardPage.editTask(originalTitle, newTitle, newDesc, 'in_progress');

    // Xác minh task có tên cũ đã biến mất
    const oldCard = dashboardPage.getTaskCard(originalTitle);
    await expect(oldCard).toBeHidden();

    // Xác minh task với tên mới đã được chuyển sang cột Đang Làm
    const newCard = dashboardPage.getTaskCard(newTitle);
    await expect(newCard).toBeVisible();
    await expect(newCard.locator('.task-item-desc')).toHaveText(newDesc);

    // Xác minh số lượng task ở cột Cần Làm và Đang Làm cập nhật đúng
    await expect(dashboardPage.countTodo).toHaveText('0');
    await expect(dashboardPage.countInProgress).toHaveText('1');
  });

  test('nên di chuyển công việc qua các cột bằng nút di chuyển nhanh', async () => {
    const taskTitle = 'Task hệ thống ban đầu';

    // Click nút chuyển nhanh từ cột Cần Làm -> Đang Làm
    await dashboardPage.moveTaskForward(taskTitle);
    await expect(dashboardPage.countTodo).toHaveText('0');
    await expect(dashboardPage.countInProgress).toHaveText('1');

    // Click nút chuyển nhanh từ cột Đang Làm -> Đã Xong
    await dashboardPage.moveTaskForward(taskTitle);
    await expect(dashboardPage.countInProgress).toHaveText('0');
    await expect(dashboardPage.countCompleted).toHaveText('1');

    // Xác minh rằng các task ở cột Đã Xong sẽ không hiển thị nút chuyển trạng thái tiếp nữa
    const completedCard = dashboardPage.getTaskCard(taskTitle);
    await expect(completedCard.locator('.move-task')).toBeHidden();
  });

  test('nên xóa công việc và cập nhật bộ đếm trên bảng công việc', async () => {
    const taskTitle = 'Task hệ thống ban đầu';

    // Thực hiện thao tác xóa task
    await dashboardPage.deleteTask(taskTitle);

    // Xác minh thẻ task đó đã bị xóa hoàn toàn khỏi giao diện
    const taskCard = dashboardPage.getTaskCard(taskTitle);
    await expect(taskCard).toBeHidden();

    // Xác minh bộ đếm của cột giảm về 0
    await expect(dashboardPage.countTodo).toHaveText('0');
  });
});
