import { test, expect } from '@playwright/test';
import sqlite3 from 'sqlite3';
import path from 'path';

// Định nghĩa đường dẫn file database
const DB_PATH = path.resolve(__dirname, '../../app/database.sqlite');

test.describe('Database Integrity Verification', () => {
  let db: sqlite3.Database;

  // Hàm helper để thực thi câu lệnh SQL trả về một Promise
  const queryAll = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  test.beforeAll(() => {
    // Mở kết nối trực tiếp đến database SQLite mục tiêu
    db = new sqlite3.Database(DB_PATH);
  });

  test.afterAll(() => {
    // Đóng kết nối database sau khi chạy xong test
    db.close();
  });

  test('Database Schema Verification', async () => {
    // Kiểm tra xem các bảng dữ liệu có tồn tại trong schema không
    const tables = await queryAll("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(t => t.name);
    
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('tasks');
  });

  test('UI/API CRUD to DB Sync Verification', async ({ request }) => {
    // 1. Trước tiên, thực hiện reset Database qua API endpoint để dọn sạch dữ liệu cũ
    await request.post('/api/db/reset');

    // 2. Truy vấn trực tiếp DB: Kiểm tra xem task mặc định ban đầu đã được tạo chưa
    let dbTasks = await queryAll("SELECT * FROM tasks");
    expect(dbTasks.length).toBe(1);
    expect(dbTasks[0].title).toBe('Initial System Task');
    expect(dbTasks[0].status).toBe('todo');

    // 3. Tạo một task mới qua API để kích hoạt luồng lưu trữ dữ liệu xuống SQLite
    const apiLogin = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'password123' }
    });
    const { token } = await apiLogin.json();

    const taskTitle = 'Database Integrity Check Task';
    const taskDesc = 'Inserted via API, verified directly by querying SQLite files';
    
    await request.post('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: { title: taskTitle, description: taskDesc }
    });

    // 4. Truy vấn DB trực tiếp bằng SQL để xác minh bản ghi mới đã được ghi đúng vào ổ đĩa
    dbTasks = await queryAll("SELECT * FROM tasks WHERE title = ?", [taskTitle]);
    
    expect(dbTasks.length).toBe(1);
    expect(dbTasks[0].title).toBe(taskTitle);
    expect(dbTasks[0].description).toBe(taskDesc);
    expect(dbTasks[0].status).toBe('todo');
    expect(dbTasks[0].id).toBeGreaterThan(1);
  });
});
