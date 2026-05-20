document.addEventListener('DOMContentLoaded', () => {
  // --- Khởi tạo State ---
  let token = localStorage.getItem('token') || '';
  let username = localStorage.getItem('username') || '';
  let tasks = [];

  // --- Tìm các thành phần DOM ---
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');
  const loginErrorText = document.getElementById('login-error-text');
  const userDisplayName = document.getElementById('user-display-name');
  const logoutBtn = document.getElementById('logout-btn');
  const resetDbBtn = document.getElementById('reset-db-btn');
  const openAddTaskBtn = document.getElementById('open-add-task-btn');

  const listTodo = document.getElementById('list-todo');
  const listInProgress = document.getElementById('list-in-progress');
  const listCompleted = document.getElementById('list-completed');

  const countTodo = document.getElementById('count-todo');
  const countInProgress = document.getElementById('count-in-progress');
  const countCompleted = document.getElementById('count-completed');

  // Các phần tử của Modal Form
  const taskModal = document.getElementById('task-modal');
  const modalTitle = document.getElementById('modal-title');
  const taskForm = document.getElementById('task-form');
  const taskIdInput = document.getElementById('task-id');
  const taskTitleInput = document.getElementById('task-title');
  const taskDescInput = document.getElementById('task-desc');
  const taskStatusSelect = document.getElementById('task-status');
  const statusGroup = document.getElementById('status-group');
  const cancelTaskBtn = document.getElementById('cancel-task-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // --- Kiểm tra đăng nhập ban đầu ---
  if (token) {
    showDashboard();
  } else {
    showAuth();
  }

  // --- Điều khiển Ẩn/Hiện Màn hình ---
  function showAuth() {
    authView.style.display = 'block';
    dashboardView.style.display = 'none';
    loginError.style.display = 'none';
  }

  function showDashboard() {
    authView.style.display = 'none';
    dashboardView.style.display = 'block';
    userDisplayName.textContent = username;
    fetchTasks();
  }

  // --- Lắng nghe sự kiện (Event Listeners) ---

  // Xử lý nộp form Đăng nhập
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    const loginData = {
      username: usernameInput.value.trim(),
      password: passwordInput.value
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      token = data.token;
      username = data.username;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);

      // Xóa sạch các ô nhập liệu sau khi đăng nhập
      usernameInput.value = '';
      passwordInput.value = '';

      showDashboard();
    } catch (err) {
      loginErrorText.textContent = err.message;
      loginError.style.display = 'flex';
    }
  });

  // Xử lý sự kiện Đăng xuất
  logoutBtn.addEventListener('click', () => {
    token = '';
    username = '';
    tasks = [];
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    showAuth();
  });

  // Xử lý sự kiện click Reset Database
  resetDbBtn.addEventListener('click', async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ công việc và khôi phục cài đặt gốc Database không?')) {
      return;
    }
    await resetDatabase();
  });

  async function resetDatabase() {
    try {
      const response = await fetch('/api/db/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Khôi phục cơ sở dữ liệu thất bại');
      await fetchTasks();
    } catch (err) {
      alert('Lỗi reset database: ' + err.message);
    }
  }

  // Mở Modal biểu mẫu để tạo công việc mới
  openAddTaskBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Tạo Công Việc Mới';
    taskIdInput.value = '';
    taskTitleInput.value = '';
    taskDescInput.value = '';
    statusGroup.style.display = 'none'; // Task mới tạo mặc định luôn có trạng thái "todo"
    taskModal.style.display = 'flex';
  });

  // Đóng Modal Form
  const closeModal = () => {
    taskModal.style.display = 'none';
  };
  closeModalBtn.addEventListener('click', closeModal);
  cancelTaskBtn.addEventListener('click', closeModal);

  // Đóng Modal khi người dùng click ra vùng tối bên ngoài card
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) {
      closeModal();
    }
  });

  // Gửi Form (Lưu hoặc cập nhật thông tin công việc)
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const taskId = taskIdInput.value;
    const taskData = {
      title: taskTitleInput.value.trim(),
      description: taskDescInput.value.trim()
    };

    let url = '/api/tasks';
    let method = 'POST';

    if (taskId) {
      url = `/api/tasks/${taskId}`;
      method = 'PUT';
      taskData.status = taskStatusSelect.value;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể lưu công việc');

      closeModal();
      await fetchTasks();
    } catch (err) {
      alert('Lỗi lưu công việc: ' + err.message);
    }
  });

  // --- Gọi API & Dựng dữ liệu lên Giao diện (Render) ---

  async function fetchTasks() {
    try {
      const response = await fetch('/api/tasks', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        // Token hết hạn hoặc không hợp lệ, đăng xuất ngay
        logoutBtn.click();
        return;
      }

      if (!response.ok) throw new Error('Không thể tải danh sách công việc');

      tasks = await response.json();
      renderBoard();
    } catch (err) {
      console.error('Lỗi khi fetch tasks:', err);
    }
  }

  function renderBoard() {
    // Xóa sạch dữ liệu cũ trong các cột trước khi render mới
    listTodo.innerHTML = '';
    listInProgress.innerHTML = '';
    listCompleted.innerHTML = '';

    let todoCount = 0;
    let progressCount = 0;
    let completedCount = 0;

    tasks.forEach(task => {
      const taskEl = createTaskCard(task);

      if (task.status === 'todo') {
        listTodo.appendChild(taskEl);
        todoCount++;
      } else if (task.status === 'in_progress') {
        listInProgress.appendChild(taskEl);
        progressCount++;
      } else if (task.status === 'completed') {
        listCompleted.appendChild(taskEl);
        completedCount++;
      }
    });

    // Cập nhật lại số đếm hiển thị ở đầu các cột
    countTodo.textContent = todoCount;
    countInProgress.textContent = progressCount;
    countCompleted.textContent = completedCount;
  }

  function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-item task-item-${task.status}`;
    card.setAttribute('data-id', task.id);
    card.setAttribute('id', `task-card-${task.id}`);
    card.setAttribute('draggable', 'true');

    // Thêm các sự kiện kéo card
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', task.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    card.innerHTML = `
      <div class="task-item-header">
        <span class="task-item-title">${escapeHtml(task.title)}</span>
      </div>
      ${task.description ? `<p class="task-item-desc">${escapeHtml(task.description)}</p>` : ''}
      <div class="task-item-actions">
        ${task.status !== 'completed' ? `
          <button class="action-icon move-task" title="Chuyển trạng thái" data-id="${task.id}" data-status="${task.status}">
            <i class="fa-solid fa-circle-arrow-right"></i>
          </button>
        ` : ''}
        <button class="action-icon edit-task" title="Chỉnh sửa" data-id="${task.id}">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="action-icon delete-task" title="Xóa bỏ" data-id="${task.id}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    // Click vào vùng thân thẻ task để mở modal chỉnh sửa (bỏ qua nếu click trúng nút icon hành động)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.action-icon')) return;
      openEditModal(task);
    });

    // Event listener cho nút chuyển trạng thái nhanh
    const moveBtn = card.querySelector('.move-task');
    if (moveBtn) {
      moveBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const currentStatus = moveBtn.getAttribute('data-status');
        const nextStatus = currentStatus === 'todo' ? 'in_progress' : 'completed';
        await updateTaskStatus(task.id, nextStatus);
      });
    }

    card.querySelector('.edit-task').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(task);
    });

    card.querySelector('.delete-task').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
        await deleteTask(task.id);
      }
    });

    return card;
  }

  function openEditModal(task) {
    modalTitle.textContent = 'Chỉnh Sửa Công Việc';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskStatusSelect.value = task.status;
    statusGroup.style.display = 'block'; // Hiển thị ô chọn trạng thái khi chỉnh sửa
    taskModal.style.display = 'flex';
  }

  async function updateTaskStatus(id, newStatus) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Không thể cập nhật trạng thái công việc');
      await fetchTasks();
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  }

  async function deleteTask(id) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Không thể xóa công việc');
      await fetchTasks();
    } catch (err) {
      alert('Lỗi khi xóa: ' + err.message);
    }
  }

  // --- Cấu hình các sự kiện Drag & Drop cho các cột công việc ---
  const boardColumnsSetup = [
    { list: listTodo, status: 'todo' },
    { list: listInProgress, status: 'in_progress' },
    { list: listCompleted, status: 'completed' }
  ];

  boardColumnsSetup.forEach(setup => {
    setup.list.addEventListener('dragover', (e) => {
      e.preventDefault();
      setup.list.classList.add('drag-over');
    });

    setup.list.addEventListener('dragleave', () => {
      setup.list.classList.remove('drag-over');
    });

    setup.list.addEventListener('drop', async (e) => {
      e.preventDefault();
      setup.list.classList.remove('drag-over');
      
      const id = e.dataTransfer.getData('text/plain');
      if (id) {
        // Tìm thông tin task để tránh gửi API nếu thả vào đúng cột cũ
        const task = tasks.find(t => t.id === parseInt(id));
        if (task && task.status !== setup.status) {
          await updateTaskStatus(task.id, setup.status);
        }
      }
    });
  });

  // Hàm tiện ích để chuẩn hóa chuỗi HTML tránh các cuộc tấn công XSS
  function escapeHtml(string) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(string).replace(/[&<>"']/g, function(m) { return map[m]; });
  }
});
