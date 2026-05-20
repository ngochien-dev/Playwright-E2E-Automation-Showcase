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
function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'todo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chèn user admin mặc định dùng để đăng nhập kiểm thử nếu chưa tồn tại
    db.run(
      `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
      ['admin', 'password123'],
      (err) => {
        if (err) console.error('Lỗi khi chèn tài khoản mock admin:', err.message);
      }
    );
  });
}

// Middleware dùng để xác thực token gửi lên trong Header
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== 'Bearer mock-jwt-token-12345') {
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing token.' });
  }
  next();
}

// --- CÁC ENDPOINT API ---

// API Đăng nhập
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }
      // Trả về token mock đơn giản để xác thực ở các API sau
      res.json({ token: 'mock-jwt-token-12345', username: user.username });
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
app.post('/api/tasks', authenticate, (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  db.run(
    'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
    [title, description || '', 'todo'],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        title,
        description,
        status: 'todo'
      });
    }
  );
});

// API Cập nhật nội dung hoặc trạng thái của một Task
app.put('/api/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const updatedTitle = title !== undefined ? title : task.title;
    const updatedDesc = description !== undefined ? description : task.description;
    const updatedStatus = status !== undefined ? status : task.status;

    db.run(
      'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
      [updatedTitle, updatedDesc, updatedStatus, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({
          id: parseInt(id),
          title: updatedTitle,
          description: updatedDesc,
          status: updatedStatus
        });
      }
    );
  });
});

// API Xóa một Task theo ID
app.delete('/api/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.json({ message: 'Task deleted successfully.', id: parseInt(id) });
  });
});

// API Reset Database (API phụ trợ phục vụ automation test để dọn dẹp dữ liệu cũ)
app.post('/api/db/reset', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM tasks', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to reset tasks database.' });
      }
      // Chèn lại task hệ thống mặc định để kiểm tra tính năng reset
      db.run(
        "INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)",
        ['Initial System Task', 'Default task created during reset setup.', 'todo'],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to insert default task.' });
          }
          res.json({ message: 'Database reset completed successfully.' });
        }
      );
    });
  });
});

// Route catch-all để phục vụ ứng dụng Single Page App (SPA) ở frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khởi động Express Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
