import { test, expect } from '@playwright/test';

test.describe('REST API Testing', () => {
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
    expect(authToken).toBe('mock-jwt-token-12345');
  });

  // Reset database trước mỗi test case API để đảm bảo môi trường sạch
  test.beforeEach(async ({ request }) => {
    const resetResponse = await request.post('/api/db/reset');
    expect(resetResponse.status()).toBe(200);
  });

  test('GET /api/tasks - should reject unauthorized requests', async ({ request }) => {
    const response = await request.get('/api/tasks');
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error).toContain('Unauthorized');
  });

  test('POST /api/tasks - should create a task via API', async ({ request }) => {
    const taskPayload = {
      title: 'API Automation Task',
      description: 'Created programmatically to verify backend APIs'
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

  test('PUT /api/tasks/:id - should update a task status', async ({ request }) => {
    // 1. Tạo một task mới trước khi tiến hành cập nhật
    const createResponse = await request.post('/api/tasks', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { title: 'Update Me', description: 'Original details' }
    });
    const task = await createResponse.json();

    // 2. Thực hiện request PUT để thay đổi thông tin và trạng thái task
    const updateResponse = await request.put(`/api/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        title: 'Updated Task Title',
        status: 'in_progress'
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updatedBody = await updateResponse.json();
    expect(updatedBody.title).toBe('Updated Task Title');
    expect(updatedBody.status).toBe('in_progress');
  });

  test('DELETE /api/tasks/:id - should delete a task', async ({ request }) => {
    // 1. Tạo một task mới trước khi tiến hành xóa
    const createResponse = await request.post('/api/tasks', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { title: 'Delete Me' }
    });
    const task = await createResponse.json();

    // 2. Thực hiện gửi request DELETE để xóa task theo ID
    const deleteResponse = await request.delete(`/api/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(deleteResponse.status()).toBe(200);
    const deleteBody = await deleteResponse.json();
    expect(deleteBody.message).toBe('Task deleted successfully.');
    expect(deleteBody.id).toBe(task.id);

    // 3. Xác minh lại xem task đã thực sự bị xóa khỏi danh sách chưa
    const getResponse = await request.get('/api/tasks', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const tasks = await getResponse.json();
    const found = tasks.some((t: any) => t.id === task.id);
    expect(found).toBe(false);
  });
});
