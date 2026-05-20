import { test, expect } from '@playwright/test';

test.describe('Kiểm Thử REST API Backend', () => {
  let authToken: string;
  let createdTaskId: number;

  // Chạy trước tất cả test case trong file này: Xác thực để lấy token đăng nhập
  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'password123'
      }
    });
    
    expect(loginResponse.status()).toBe(200);
    const body = await loginResponse.json();
    authToken = body.token;
    expect(authToken).toBe('mock-jwt-token-admin');
  });

  // Reset database trước mỗi test case API để đảm bảo môi trường sạch
  test.beforeEach(async ({ request }) => {
    const resetResponse = await request.post('/api/db/reset');
    expect(resetResponse.status()).toBe(200);
  });

  test('GET /api/tasks - nên từ chối các yêu cầu không có token hợp lệ', async ({ request }) => {
    const response = await request.get('/api/tasks');
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error).toContain('Không có quyền truy cập');
  });

  test('POST /api/tasks - nên tạo thành công công việc mới qua API', async ({ request }) => {
    const taskPayload = {
      title: 'Công việc tự động hóa API',
      description: 'Được tạo tự động bằng mã nguồn để kiểm thử API phía backend'
    };

    const response = await request.post('/api/tasks', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: taskPayload
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    
    expect(body).toHaveProperty('id');
    createdTaskId = body.id; // Lưu lại ID để dùng cho các test case update/delete sau này
    expect(body.title).toBe(taskPayload.title);
    expect(body.description).toBe(taskPayload.description);
    expect(body.status).toBe('todo');
  });

  test('PUT /api/tasks/:id - nên cập nhật thành công trạng thái công việc', async ({ request }) => {
    // 1. Tạo một task mới trước khi tiến hành cập nhật
    const createResponse = await request.post('/api/tasks', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { title: 'Hãy sửa tôi', description: 'Chi tiết ban đầu' }
    });
    const task = await createResponse.json();

    // 2. Thực hiện request PUT để thay đổi thông tin và trạng thái task
    const updateResponse = await request.put(`/api/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        title: 'Tiêu đề công việc đã sửa',
        status: 'in_progress'
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updatedBody = await updateResponse.json();
    expect(updatedBody.title).toBe('Tiêu đề công việc đã sửa');
    expect(updatedBody.status).toBe('in_progress');
  });

  test('DELETE /api/tasks/:id - nên xóa thành công công việc', async ({ request }) => {
    // 1. Tạo một task mới trước khi tiến hành xóa
    const createResponse = await request.post('/api/tasks', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { title: 'Hãy xóa tôi' }
    });
    const task = await createResponse.json();

    // 2. Thực hiện gửi request DELETE để xóa task theo ID
    const deleteResponse = await request.delete(`/api/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(deleteResponse.status()).toBe(200);
    const deleteBody = await deleteResponse.json();
    expect(deleteBody.message).toContain('Xóa công việc thành công.');

    // 3. Thực hiện GET lại task để chắc chắn nó không còn tồn tại
    const getResponse = await request.get('/api/tasks', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const tasks = await getResponse.json();
    const found = tasks.some((t: any) => t.id === task.id);
    expect(found).toBe(false);
  });

  test('RBAC - nên từ chối yêu cầu tạo mới/sửa/xóa công việc từ tài khoản Người xem (viewer) với mã lỗi 403', async ({ request }) => {
    // 1. Đăng nhập tài khoản viewer để lấy token
    const viewerLogin = await request.post('/api/auth/login', {
      data: {
        username: 'viewer',
        password: 'password123'
      }
    });
    expect(viewerLogin.status()).toBe(200);
    const viewerBody = await viewerLogin.json();
    const viewerToken = viewerBody.token;
    expect(viewerToken).toBe('mock-jwt-token-viewer');

    // 2. Thử tạo mới công việc với token viewer -> nhận 403 Forbidden
    const createResponse = await request.post('/api/tasks', {
      headers: { 'Authorization': `Bearer ${viewerToken}` },
      data: { title: 'Task gian lận' }
    });
    expect(createResponse.status()).toBe(403);
    const createBody = await createResponse.json();
    expect(createBody.error).toContain('Quyền truy cập bị từ chối');

    // 3. Thử cập nhật công việc của admin -> nhận 403 Forbidden
    const updateResponse = await request.put('/api/tasks/1', {
      headers: { 'Authorization': `Bearer ${viewerToken}` },
      data: { status: 'completed' }
    });
    expect(updateResponse.status()).toBe(403);

    // 4. Thử xóa công việc của admin -> nhận 403 Forbidden
    const deleteResponse = await request.delete('/api/tasks/1', {
      headers: { 'Authorization': `Bearer ${viewerToken}` }
    });
    expect(deleteResponse.status()).toBe(403);
  });
});
