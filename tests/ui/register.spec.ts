import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Kiểm Thử Đăng Ký Tài Khoản Mới (User Registration & RBAC)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
    
    // Đảm bảo cơ sở dữ liệu sạch trước mỗi test
    const context = page.context();
    const request = context.request;
    await request.post('/api/db/reset');
  });

  test('nên đăng ký thành công tài khoản Quản trị viên (Admin) mới và thao tác được CRUD', async ({ page }) => {
    const uniqueUsername = `admin_test_${Date.now()}`;
    const password = 'password123';

    await loginPage.switchToRegisterTab();
    await loginPage.register(uniqueUsername, password, 'admin');

    // Xác minh alert thành công hiển thị
    await expect(loginPage.registerSuccessAlert).toBeVisible();
    await expect(loginPage.registerSuccessAlert).toContainText('Đăng ký thành công');

    // Chờ tự động chuyển sang tab Đăng nhập
    await expect(loginPage.usernameInput).toHaveValue(uniqueUsername);

    // Tiến hành đăng nhập với tài khoản vừa tạo
    await loginPage.login(uniqueUsername, password);

    // Xác minh đã vào được Dashboard với vai trò Quản trị viên
    await expect(dashboardPage.userDisplayName).toContainText(uniqueUsername);
    await expect(dashboardPage.userDisplayName).toContainText('Quản trị viên');
    await expect(dashboardPage.openAddTaskBtn).toBeVisible();

    // Tạo mới một task để chứng minh quyền Admin hoạt động đúng
    await dashboardPage.createTask('Task từ Admin mới', 'Mô tả tác vụ đăng ký', 'high');
    const taskCard = dashboardPage.getTaskCard('Task từ Admin mới');
    await expect(taskCard).toBeVisible();
  });

  test('nên đăng ký thành công tài khoản Người xem (Viewer) mới và không có quyền chỉnh sửa', async ({ page }) => {
    const uniqueUsername = `viewer_test_${Date.now()}`;
    const password = 'password123';

    await loginPage.switchToRegisterTab();
    await loginPage.register(uniqueUsername, password, 'viewer');

    // Xác minh alert thành công
    await expect(loginPage.registerSuccessAlert).toBeVisible();

    // Chờ tự động chuyển tab
    await expect(loginPage.usernameInput).toHaveValue(uniqueUsername);

    // Đăng nhập
    await loginPage.login(uniqueUsername, password);

    // Xác minh đã vào Dashboard với vai trò Người xem
    await expect(dashboardPage.userDisplayName).toContainText(uniqueUsername);
    await expect(dashboardPage.userDisplayName).toContainText('Người xem');
    
    // Xác minh nút tạo task bị ẩn theo chính sách phân quyền (RBAC)
    await expect(dashboardPage.openAddTaskBtn).not.toBeVisible();
    await expect(dashboardPage.resetDbBtn).not.toBeVisible();
  });

  test('nên hiển thị thông báo lỗi khi đăng ký tài khoản trùng tên đã tồn tại', async ({ page }) => {
    // 'admin' là tài khoản mặc định hệ thống đã tồn tại sẵn
    await loginPage.switchToRegisterTab();
    await loginPage.register('admin', 'password123', 'admin');

    // Xác minh hiển thị thông báo lỗi đăng ký trùng lặp
    const errorMsg = await loginPage.getRegisterErrorMessage();
    expect(errorMsg).toBe('Tên đăng nhập đã tồn tại.');
    await expect(loginPage.registerSuccessAlert).not.toBeVisible();
  });

  test('nên hiển thị thông báo lỗi khi tên đăng nhập hoặc mật khẩu quá ngắn', async ({ page }) => {
    await loginPage.switchToRegisterTab();
    
    // Tên đăng nhập < 3 ký tự
    await loginPage.register('ab', '12345', 'admin');
    let errorMsg = await loginPage.getRegisterErrorMessage();
    expect(errorMsg).toBe('Tên đăng nhập phải chứa ít nhất 3 ký tự.');

    // Mật khẩu < 4 ký tự
    await loginPage.register('validuser', '123', 'admin');
    errorMsg = await loginPage.getRegisterErrorMessage();
    expect(errorMsg).toBe('Mật khẩu phải chứa ít nhất 4 ký tự.');
  });
});
