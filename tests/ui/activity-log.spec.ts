import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Lịch Sử Hoạt Động (Activity Log Timeline & Audit Trail)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Chấp nhận toàn cục tất cả các hộp thoại native confirm của trình duyệt
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // 1. Đăng nhập hệ thống với tài khoản Admin
    await loginPage.navigate();
    await loginPage.login('admin', 'password123');

    // 2. Reset database qua nút Reset trên UI để sạch dữ liệu
    await dashboardPage.resetDatabase();
  });

  test('nên ghi nhận chính xác lịch sử hoạt động khi Thêm, Sửa, Chuyển cột và Xóa công việc', async () => {
    // 1. Mở ngăn kéo lịch sử hoạt động ban đầu
    await dashboardPage.openActivityLogs();
    
    // 2. Xác minh hoạt động reset database đã được ghi nhận tự động
    await expect(dashboardPage.timelineItems.first()).toContainText('@Hệ thống');
    await expect(dashboardPage.timelineItems.first()).toContainText('Đã đặt lại cơ sở dữ liệu về mặc định');

    // 3. Đóng ngăn kéo lịch sử
    await dashboardPage.closeActivityLogs();

    // 4. Tạo một công việc mới: "Viết test case Lịch sử"
    await dashboardPage.createTask('Viết test case Lịch sử', 'Mô tả chi tiết hoạt động log', 'high');

    // 5. Mở lại ngăn kéo lịch sử và kiểm tra log tạo mới
    await dashboardPage.openActivityLogs();
    await expect(dashboardPage.timelineItems.first()).toContainText('@admin');
    await expect(dashboardPage.timelineItems.first()).toContainText('Viết test case Lịch sử');
    await expect(dashboardPage.timelineItems.first()).toContainText('Đã tạo công việc mới (Độ ưu tiên: Cao)');

    // 6. Đóng ngăn kéo lịch sử
    await dashboardPage.closeActivityLogs();

    // 7. Di chuyển công việc nhanh sang cột "Đang Làm"
    await dashboardPage.moveTaskForward('Viết test case Lịch sử');

    // 8. Mở lại ngăn kéo lịch sử và kiểm tra log di chuyển
    await dashboardPage.openActivityLogs();
    await expect(dashboardPage.timelineItems.first()).toContainText('@admin');
    await expect(dashboardPage.timelineItems.first()).toContainText('Viết test case Lịch sử');
    await expect(dashboardPage.timelineItems.first()).toContainText('Đã chuyển sang cột "Đang Làm"');

    // 9. Đóng ngăn kéo lịch sử
    await dashboardPage.closeActivityLogs();

    // 10. Chỉnh sửa mô tả chi tiết công việc
    await dashboardPage.editTask('Viết test case Lịch sử', 'Viết test case Lịch sử', 'Mô tả đã được cập nhật lại', 'in_progress', 'low');

    // 11. Mở lại ngăn kéo lịch sử và kiểm tra log cập nhật
    await dashboardPage.openActivityLogs();
    await expect(dashboardPage.timelineItems.first()).toContainText('@admin');
    await expect(dashboardPage.timelineItems.first()).toContainText('Viết test case Lịch sử');
    await expect(dashboardPage.timelineItems.first()).toContainText('Đã cập nhật chi tiết công việc');

    // 12. Đóng ngăn kéo lịch sử
    await dashboardPage.closeActivityLogs();

    // 13. Xóa công việc
    await dashboardPage.deleteTask('Viết test case Lịch sử');

    // 14. Mở lại ngăn kéo lịch sử và kiểm tra log xóa công việc
    await dashboardPage.openActivityLogs();
    await expect(dashboardPage.timelineItems.first()).toContainText('@admin');
    await expect(dashboardPage.timelineItems.first()).toContainText('Viết test case Lịch sử');
    await expect(dashboardPage.timelineItems.first()).toContainText('Đã xóa công việc');
  });
});
