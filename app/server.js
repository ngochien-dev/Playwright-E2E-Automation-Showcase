const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.sqlite');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kết nối cơ sở dữ liệu SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Lỗi kết nối database:', err.message);
  } else {
    console.log('Đã kết nối thành công đến database SQLite.');
    initializeDatabase();
  }
});

// Khởi tạo các bảng dữ liệu ban đầu và chèn tài khoản admin mặc định
// Khởi tạo các bảng dữ liệu ban đầu và chèn các tài khoản phân quyền mặc định
function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'admin'
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        action TEXT,
        task_title TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chèn user admin mặc định nếu chưa tồn tại
    db.run(
      `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
      ['admin', 'password123', 'admin'],
      (err) => {
        if (err) console.error('Lỗi khi chèn tài khoản mock admin:', err.message);
      }
    );

    // Chèn user viewer mặc định nếu chưa tồn tại
    db.run(
      `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
      ['viewer', 'password123', 'viewer'],
      (err) => {
        if (err) console.error('Lỗi khi chèn tài khoản mock viewer:', err.message);
      }
    );
  });
}

// Hàm tiện ích ghi nhận lịch sử hoạt động
function logActivity(username, action, taskTitle, details, callback) {
  db.run(
    'INSERT INTO activity_logs (username, action, task_title, details) VALUES (?, ?, ?, ?)',
    [username || 'Hệ thống', action, taskTitle || '', details || ''],
    callback
  );
}

// Middleware dùng để xác thực token gửi lên trong Header
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Không có quyền truy cập. Token bị thiếu.' });
  }
  if (authHeader === 'Bearer mock-jwt-token-admin') {
    req.user = { role: 'admin', username: 'admin' };
    next();
  } else if (authHeader === 'Bearer mock-jwt-token-viewer') {
    req.user = { role: 'viewer', username: 'viewer' };
    next();
  } else {
    return res.status(401).json({ error: 'Không có quyền truy cập. Token không hợp lệ.' });
  }
}

// Middleware dùng để phân quyền tài khoản admin (chỉ admin mới có quyền ghi/chỉnh sửa)
function authorizeAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Chỉ tài khoản Quản trị viên mới được phép thực hiện hành động này.' });
  }
}

// --- CÁC ENDPOINT API ---

// API Đăng nhập
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu không được bỏ trống.' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }
      // Trả về token tương ứng với phân quyền của user
      const token = user.role === 'admin' ? 'mock-jwt-token-admin' : 'mock-jwt-token-viewer';
      res.json({ token, username: user.username, role: user.role });
    }
  );
});

// API Lấy danh sách Task
app.get('/api/tasks', authenticate, (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// API Tạo mới một Task
app.post('/api/tasks', authenticate, authorizeAdmin, (req, res) => {
  const { title, description, priority } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Tiêu đề công việc là bắt buộc.' });
  }
  const taskPriority = priority || 'medium';

  db.run(
    'INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)',
    [title, description || '', 'todo', taskPriority],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const taskId = this.lastID;
      logActivity(req.user.username, 'CREATE', title, `Đã tạo công việc mới (Độ ưu tiên: ${taskPriority === 'high' ? 'Cao' : taskPriority === 'low' ? 'Thấp' : 'Trung bình'})`, () => {
        res.status(201).json({
          id: taskId,
          title,
          description,
          status: 'todo',
          priority: taskPriority
        });
      });
    }
  );
});

// API Cập nhật nội dung hoặc trạng thái của một Task
app.put('/api/tasks/:id', authenticate, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority } = req.body;

  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc.' });
    }

    const updatedTitle = title !== undefined ? title : task.title;
    const updatedDesc = description !== undefined ? description : task.description;
    const updatedStatus = status !== undefined ? status : task.status;
    const updatedPriority = priority !== undefined ? priority : task.priority;

    db.run(
      'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ? WHERE id = ?',
      [updatedTitle, updatedDesc, updatedStatus, updatedPriority, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        const sendResponse = () => {
          res.json({
            id: parseInt(id),
            title: updatedTitle,
            description: updatedDesc,
            status: updatedStatus,
            priority: updatedPriority
          });
        };
        if (status !== undefined && status !== task.status) {
          const statusMap = { 'todo': 'Cần Làm', 'in_progress': 'Đang Làm', 'completed': 'Đã Xong' };
          logActivity(req.user.username, 'MOVE', updatedTitle, `Đã chuyển sang cột "${statusMap[updatedStatus]}"`, sendResponse);
        } else {
          logActivity(req.user.username, 'UPDATE', updatedTitle, 'Đã cập nhật chi tiết công việc', sendResponse);
        }
      }
    );
  });
});

// API Xóa một Task theo ID
app.delete('/api/tasks/:id', authenticate, authorizeAdmin, (req, res) => {
  const { id } = req.params;

  db.get('SELECT title FROM tasks WHERE id = ?', [id], (err, task) => {
    if (err || !task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc.' });
    }

    db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      logActivity(req.user.username, 'DELETE', task.title, 'Đã xóa công việc', () => {
        res.json({ message: 'Xóa công việc thành công.', id: parseInt(id) });
      });
    });
  });
});

// API Lấy danh sách Lịch sử hoạt động
app.get('/api/activities', authenticate, (req, res) => {
  db.all('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// API Reset Database (API phụ trợ phục vụ automation test để dọn dẹp dữ liệu cũ)
app.post('/api/db/reset', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM tasks', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Không thể reset cơ sở dữ liệu.' });
      }
      // Dọn dẹp cả lịch sử hoạt động khi reset database để sạch môi trường test
      db.run('DELETE FROM activity_logs', (err) => {
        if (err) console.error('Lỗi khi xóa bảng logs:', err.message);
        
        // Chèn lại task hệ thống mặc định để kiểm tra tính năng reset
        db.run(
          "INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)",
          ['Task hệ thống ban đầu', 'Task mặc định được tạo trong quá trình khởi tạo.', 'todo', 'high'],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Không thể chèn công việc mặc định.' });
            }
            logActivity('Hệ thống', 'RESET', '-', 'Đã đặt lại cơ sở dữ liệu về mặc định', () => {
              res.json({ message: 'Reset database thành công.' });
            });
          }
        );
      });
    });
  });
});

// Route catch-all để phục vụ ứng dụng Single Page App (SPA) ở frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khởi động Express Server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
