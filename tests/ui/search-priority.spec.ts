import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm thử Tìm Kiếm & Lọc Độ Ưu Tiên (Search & Priority Filters)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Chấp nhận toàn cục tất cả các hộp thoại native confirm của trình duyệt
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // 1. Đăng nhập hệ thống
    await loginPage.navigate();
    await loginPage.login('admin', 'password123');

    // 2. Reset database qua nút Reset trên UI để sạch dữ liệu
    await dashboardPage.resetDatabase();
  });

  test('nên tạo được công việc với các độ ưu tiên khác nhau và hiển thị đúng màu nhãn', async () => {
    // 1. Tạo task độ ưu tiên Cao (high)
    await dashboardPage.createTask('Test Priority High', 'Mô tả High', 'high');
    const cardHigh = dashboardPage.getTaskCard('Test Priority High');
    await expect(cardHigh).toBeVisible();
    await expect(cardHigh.locator('.priority-badge')).toHaveText('Cao');
    await expect(cardHigh.locator('.priority-badge')).toHaveClass(/priority-high/);

    // 2. Tạo task độ ưu tiên Thấp (low)
    await dashboardPage.createTask('Test Priority Low', 'Mô tả Low', 'low');
    const cardLow = dashboardPage.getTaskCard('Test Priority Low');
    await expect(cardLow).toBeVisible();
    await expect(cardLow.locator('.priority-badge')).toHaveText('Thấp');
    await expect(cardLow.locator('.priority-badge')).toHaveClass(/priority-low/);
  });

  test('nên lọc danh sách công việc thời gian thực khi nhập từ khóa tìm kiếm', async () => {
    // 1. Tạo 2 task có tên khác nhau
    await dashboardPage.createTask('Báo cáo lỗi bảo mật', 'Tìm thấy lỗ hổng XSS nghiêm trọng', 'high');
    await dashboardPage.createTask('Viết tài liệu API', 'Tài liệu hướng dẫn tích hợp hệ thống', 'low');

    // 2. Nhập từ khóa "bảo mật" vào ô tìm kiếm
    await dashboardPage.searchTask('bảo mật');

    // 3. Xác minh task "Báo cáo lỗi bảo mật" được highlight, task "Viết tài liệu API" bị mờ
    await expect(dashboardPage.getTaskCard('Báo cáo lỗi bảo mật')).toHaveClass(/search-highlight/);
    await expect(dashboardPage.getTaskCard('Viết tài liệu API')).toHaveClass(/search-dimmed/);

    // 4. Nhập từ khóa "hướng dẫn"
    await dashboardPage.searchTask('hướng dẫn');

    // 5. Xác minh task "Viết tài liệu API" được highlight, task "Báo cáo lỗi bảo mật" bị mờ
    await expect(dashboardPage.getTaskCard('Báo cáo lỗi bảo mật')).toHaveClass(/search-dimmed/);
    await expect(dashboardPage.getTaskCard('Viết tài liệu API')).toHaveClass(/search-highlight/);

    // 6. Xóa từ khóa tìm kiếm -> Tất cả hiển thị bình thường (không highlight/dimmed)
    await dashboardPage.searchTask('');
    await expect(dashboardPage.getTaskCard('Báo cáo lỗi bảo mật')).not.toHaveClass(/search-highlight/);
    await expect(dashboardPage.getTaskCard('Báo cáo lỗi bảo mật')).not.toHaveClass(/search-dimmed/);
    await expect(dashboardPage.getTaskCard('Viết tài liệu API')).not.toHaveClass(/search-highlight/);
    await expect(dashboardPage.getTaskCard('Viết tài liệu API')).not.toHaveClass(/search-dimmed/);
  });

  test('nên lọc danh sách công việc chính xác theo phân loại độ ưu tiên', async () => {
    // 1. Tạo các công việc với độ ưu tiên Cao và Thấp
    await dashboardPage.createTask('Task Quan Trọng 1', 'Độ ưu tiên cao', 'high');
    await dashboardPage.createTask('Task Quan Trọng 2', 'Độ ưu tiên cao', 'high');
    await dashboardPage.createTask('Task Bình Thường', 'Độ ưu tiên thấp', 'low');

    // 2. Lọc theo độ ưu tiên: Cao
    await dashboardPage.filterByPriority('high');

    // 3. Xác minh chỉ hiển thị 2 task quan trọng, ẩn task bình thường
    await expect(dashboardPage.getTaskCard('Task Quan Trọng 1')).toBeVisible();
    await expect(dashboardPage.getTaskCard('Task Quan Trọng 2')).toBeVisible();
    await expect(dashboardPage.getTaskCard('Task Bình Thường')).toBeHidden();

    // 4. Lọc theo độ ưu tiên: Thấp
    await dashboardPage.filterByPriority('low');

    // 5. Xác minh chỉ hiển thị task bình thường, ẩn 2 task quan trọng
    await expect(dashboardPage.getTaskCard('Task Quan Trọng 1')).toBeHidden();
    await expect(dashboardPage.getTaskCard('Task Quan Trọng 2')).toBeHidden();
    await expect(dashboardPage.getTaskCard('Task Bình Thường')).toBeVisible();

    // 6. Quay lại chọn: Tất cả độ ưu tiên -> hiển thị tất cả
    await dashboardPage.filterByPriority('all');
    await expect(dashboardPage.getTaskCard('Task Quan Trọng 1')).toBeVisible();
    await expect(dashboardPage.getTaskCard('Task Quan Trọng 2')).toBeVisible();
    await expect(dashboardPage.getTaskCard('Task Bình Thường')).toBeVisible();
  });
});
