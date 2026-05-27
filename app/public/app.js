document.addEventListener('DOMContentLoaded', () => {
  // --- Khởi tạo State ---
  let token = localStorage.getItem('token') || '';
  let username = localStorage.getItem('username') || '';
  let role = localStorage.getItem('role') || '';
  let tasks = [];

  // --- Tìm các thành phần DOM ---
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');
  const loginErrorText = document.getElementById('login-error-text');

  // Đăng ký tài khoản
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const registerForm = document.getElementById('register-form');
  const regUsernameInput = document.getElementById('reg-username');
  const regPasswordInput = document.getElementById('reg-password');
  const regRoleSelect = document.getElementById('reg-role');
  const registerError = document.getElementById('register-error');
  const registerErrorText = document.getElementById('register-error-text');
  const registerSuccess = document.getElementById('register-success');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
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
  const taskStatusSelect = document.getElementById('task-status');
  const statusGroup = document.getElementById('status-group');
  const cancelTaskBtn = document.getElementById('cancel-task-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  
  // Subtasks
  const subtasksContainer = document.getElementById('subtasks-container');
  const addSubtaskBtn = document.getElementById('add-subtask-btn');
  const modalSubtaskProgress = document.getElementById('modal-subtask-progress');
  const modalSubtaskText = document.getElementById('modal-subtask-text');
  let currentSubtasks = [];
  
  // File Attachment
  const attachmentGroup = document.getElementById('attachment-group');
  const taskAttachment = document.getElementById('task-attachment');
  const attachmentInfo = document.getElementById('attachment-info');
  const attachmentLink = document.getElementById('attachment-link');
  
  // Các bộ lọc tìm kiếm và độ ưu tiên
  const searchInput = document.getElementById('search-input');
  const priorityFilter = document.getElementById('priority-filter');
  const taskPriorityInput = document.getElementById('task-priority');

  // Phase 3 Features
  const taskDueDateInput = document.getElementById('task-due-date');
  const taskTagsInput = document.getElementById('task-tags');
  const taskAssigneeSelect = document.getElementById('task-assignee');
  
  // Nút Export CSV
  const exportCsvBtn = document.getElementById('export-csv-btn');

  // Khởi tạo Quill Editor
  let quill = null;
  if (document.getElementById('task-desc-editor')) {
    quill = new Quill('#task-desc-editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ]
      },
      placeholder: 'Nhập mô tả chi tiết công việc hoặc các bước tái tạo lỗi...'
    });
  }

  // Comments
  const commentsGroup = document.getElementById('comments-group');
  const commentsList = document.getElementById('comments-list');
  const newCommentInput = document.getElementById('new-comment-input');
  const addCommentBtn = document.getElementById('add-comment-btn');
  let currentComments = [];

  // Ngăn kéo lịch sử hoạt động
  const openActivityBtn = document.getElementById('open-activity-btn');
  const closeActivityBtn = document.getElementById('close-drawer-btn');
  const activityDrawer = document.getElementById('activity-drawer');
  const activityList = document.getElementById('activity-list');

  // Ngăn kéo Thống kê
  const openAnalyticsBtn = document.getElementById('open-analytics-btn');
  const closeAnalyticsBtn = document.getElementById('close-analytics-btn');
  const analyticsDrawer = document.getElementById('analytics-drawer');
  const ctxChart = document.getElementById('taskChart');
  let taskChartInstance = null;

  // Nút chuyển đổi Giao diện Tối/Sáng
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      themeToggleBtn.querySelector('i').className = 'fa-solid fa-sun';
      themeToggleBtn.querySelector('.theme-text').textContent = 'Sáng';
    }

    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-mode');
      if (isLight) {
        localStorage.setItem('theme', 'light');
        themeToggleBtn.querySelector('i').className = 'fa-solid fa-sun';
        themeToggleBtn.querySelector('.theme-text').textContent = 'Sáng';
      } else {
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.querySelector('i').className = 'fa-solid fa-moon';
        themeToggleBtn.querySelector('.theme-text').textContent = 'Tối';
      }
    });
  }

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
    if (registerError) registerError.style.display = 'none';
    if (registerSuccess) registerSuccess.style.display = 'none';
    if (tabLogin) {
      tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
      if (authTitle) authTitle.textContent = 'Chào Mừng Quay Lại';
      if (authSubtitle) authSubtitle.textContent = 'Vui lòng nhập tài khoản để truy cập bảng công việc.';
    }
  }

  function showDashboard() {
    authView.style.display = 'none';
    dashboardView.style.display = 'block';
    userDisplayName.textContent = `${username} (${role === 'admin' ? 'Quản trị viên' : 'Người xem'})`;
    
    // Ẩn/hiện các chức năng tạo/reset dựa trên vai trò
    if (role === 'viewer') {
      openAddTaskBtn.style.display = 'none';
      resetDbBtn.style.display = 'none';
    } else {
      openAddTaskBtn.style.display = 'block';
      resetDbBtn.style.display = 'block';
    }
    
    fetchTasks();
    fetchUsers();
  }

  // --- Lắng nghe sự kiện (Event Listeners) ---

  // Chuyển sang Tab Đăng Nhập
  if (tabLogin) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      authTitle.textContent = 'Chào Mừng Quay Lại';
      authSubtitle.textContent = 'Vui lòng nhập tài khoản để truy cập bảng công việc.';
      loginError.style.display = 'none';
    });
  }

  // Chuyển sang Tab Đăng Ký
  if (tabRegister) {
    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
      authTitle.textContent = 'Tạo Tài Khoản Mới';
      authSubtitle.textContent = 'Đăng ký tài khoản để bắt đầu quản lý công việc.';
      registerError.style.display = 'none';
      registerSuccess.style.display = 'none';
    });
  }

  // Xử lý nộp form Đăng Ký
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      registerError.style.display = 'none';
      registerSuccess.style.display = 'none';

      const registerData = {
        username: regUsernameInput.value.trim(),
        password: regPasswordInput.value,
        role: regRoleSelect.value
      };

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Đăng ký tài khoản thất bại');
        }

        registerSuccess.style.display = 'flex';
        registerForm.reset();

        // Tự động chuyển sang Tab Đăng Nhập sau 1.5 giây và điền sẵn username
        setTimeout(() => {
          tabLogin.click();
          usernameInput.value = data.username;
          passwordInput.focus();
        }, 1500);
      } catch (err) {
        registerErrorText.textContent = err.message;
        registerError.style.display = 'flex';
      }
    });
  }

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
      role = data.role;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);

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
    role = '';
    tasks = [];
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
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

  // --- Subtasks Logic ---
  function renderSubtasks() {
    if (!subtasksContainer) return;
    subtasksContainer.innerHTML = '';
    let completedCount = 0;

    currentSubtasks.forEach((subtask, index) => {
      if (subtask.completed) completedCount++;
      const item = document.createElement('div');
      item.className = 'subtask-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = subtask.completed;
      checkbox.addEventListener('change', (e) => {
        currentSubtasks[index].completed = e.target.checked;
        updateSubtaskProgress();
      });

      const input = document.createElement('input');
      input.type = 'text';
      input.value = subtask.title;
      input.placeholder = 'Tên việc con...';
      input.addEventListener('input', (e) => {
        currentSubtasks[index].title = e.target.value;
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-subtask-btn';
      removeBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
      removeBtn.addEventListener('click', () => {
        currentSubtasks.splice(index, 1);
        renderSubtasks();
      });

      item.appendChild(checkbox);
      item.appendChild(input);
      item.appendChild(removeBtn);
      subtasksContainer.appendChild(item);
    });

    updateSubtaskProgress();
  }

  function updateSubtaskProgress() {
    if (currentSubtasks.length === 0) {
      modalSubtaskProgress.style.width = '0%';
      modalSubtaskText.textContent = '0/0';
      return;
    }
    const completed = currentSubtasks.filter(st => st.completed).length;
    const total = currentSubtasks.length;
    const percent = (completed / total) * 100;
    modalSubtaskProgress.style.width = percent + '%';
    modalSubtaskText.textContent = `${completed}/${total}`;
  }

  if (addSubtaskBtn) {
    addSubtaskBtn.addEventListener('click', () => {
      currentSubtasks.push({ title: '', completed: false });
      renderSubtasks();
    });
  }

  // Mở Modal biểu mẫu để tạo công việc mới
  openAddTaskBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Tạo Công Việc Mới';
    taskIdInput.value = '';
    taskTitleInput.value = '';
    if (quill) quill.root.innerHTML = '';
    if (taskDueDateInput) taskDueDateInput.value = '';
    if (taskTagsInput) taskTagsInput.value = '';
    if (taskAssigneeSelect) taskAssigneeSelect.value = '';
    statusGroup.style.display = 'none'; // Task mới tạo mặc định luôn có trạng thái "todo"
    if (attachmentGroup) attachmentGroup.style.display = 'none'; // Không cho upload khi tạo mới
    commentsGroup.style.display = 'none'; // Ẩn comment khi tạo mới
    currentSubtasks = [];
    currentComments = [];
    renderSubtasks();
    taskModal.style.display = 'flex';
  });

  // Đóng Modal Form
  function renderComments() {
    commentsList.innerHTML = '';
    currentComments.forEach(c => {
      const el = document.createElement('div');
      el.className = 'comment-item';
      
      const avatarInitial = c.username ? c.username.charAt(0).toUpperCase() : '?';
      
      el.innerHTML = `
        <div class="comment-avatar">${avatarInitial}</div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-author">${c.username}</span>
            <span class="comment-time">${new Date(c.timestamp).toLocaleString('vi-VN')}</span>
          </div>
          <div class="comment-text">${c.text}</div>
        </div>
      `;
      commentsList.appendChild(el);
    });
    // Scroll to bottom
    commentsList.scrollTop = commentsList.scrollHeight;
  }

  if (addCommentBtn) {
    addCommentBtn.addEventListener('click', () => {
      const text = newCommentInput.value.trim();
      if (!text) return;
      currentComments.push({
        username: username,
        text: text,
        timestamp: new Date().toISOString()
      });
      newCommentInput.value = '';
      renderComments();
    });
  }

  // Export CSV
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (tasks.length === 0) {
        alert('Không có dữ liệu để xuất.');
        return;
      }
      
      const headers = ['ID', 'Tiêu đề', 'Mô tả', 'Trạng thái', 'Độ ưu tiên', 'Người được giao', 'Ngày hết hạn', 'Thẻ'];
      const rows = tasks.map(t => [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        t.assignee || '',
        t.due_date || '',
        t.tags ? t.tags.join(', ') : ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Đóng Modal Form
  const closeModal = () => {
    taskModal.style.display = 'none';
  };
  closeModalBtn.addEventListener('click', closeModal);
  cancelTaskBtn.addEventListener('click', closeModal);

  // Lắng nghe sự kiện Upload File
  if (taskAttachment) {
    taskAttachment.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      const taskId = taskIdInput.value;
      if (!file || !taskId) return;

      const formData = new FormData();
      formData.append('attachment', file);

      try {
        const response = await fetch(`/api/tasks/${taskId}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload lỗi');

        attachmentInfo.style.display = 'flex';
        attachmentLink.href = data.attachment_url;
        attachmentLink.textContent = data.attachment_name;
        
        await fetchTasks(); // Cập nhật lại UI chính
      } catch (err) {
        alert('Lỗi tải file: ' + err.message);
      }
      // Reset input để có thể chọn lại cùng 1 file
      taskAttachment.value = '';
    });
  }

  // Đóng Modal khi người dùng click ra vùng tối bên ngoài card
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) {
      closeModal();
    }
  });

  // Lắng nghe sự kiện tìm kiếm và lọc độ ưu tiên
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderBoard();
    });
  }

  if (priorityFilter) {
    priorityFilter.addEventListener('change', () => {
      renderBoard();
    });
  }

  // Mở ngăn kéo lịch sử hoạt động
  if (openActivityBtn) {
    openActivityBtn.addEventListener('click', () => {
      activityDrawer.style.display = 'flex';
      fetchActivities();
    });
  }

  // Đóng ngăn kéo lịch sử hoạt động
  if (closeActivityBtn) {
    closeActivityBtn.addEventListener('click', () => {
      activityDrawer.style.display = 'none';
    });
  }

  if (activityDrawer) {
    activityDrawer.addEventListener('click', (e) => {
      if (e.target === activityDrawer) {
        activityDrawer.style.display = 'none';
      }
    });
  }

  // Mở ngăn kéo thống kê
  if (openAnalyticsBtn) {
    openAnalyticsBtn.addEventListener('click', () => {
      analyticsDrawer.style.display = 'flex';
      renderChart();
    });
  }

  // Đóng ngăn kéo thống kê
  if (closeAnalyticsBtn) {
    closeAnalyticsBtn.addEventListener('click', () => {
      analyticsDrawer.style.display = 'none';
    });
  }

  if (analyticsDrawer) {
    analyticsDrawer.addEventListener('click', (e) => {
      if (e.target === analyticsDrawer) {
        analyticsDrawer.style.display = 'none';
      }
    });
  }

  // Gửi Form (Lưu hoặc cập nhật thông tin công việc)
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const taskId = taskIdInput.value;
    const taskData = {
      title: taskTitleInput.value.trim(),
      description: quill ? quill.root.innerHTML : '',
      priority: taskPriorityInput.value,
      subtasks: currentSubtasks.filter(st => st.title.trim() !== ''), // Remove empty subtasks
      due_date: taskDueDateInput ? taskDueDateInput.value : null,
      tags: taskTagsInput ? taskTagsInput.value.split(',').map(t => t.trim()).filter(t => t !== '') : [],
      assignee: taskAssigneeSelect ? taskAssigneeSelect.value : null,
      comments: currentComments
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
      await fetchActivities();
    } catch (err) {
      console.error('Lỗi khi fetch tasks:', err);
    }
  }

  async function fetchUsers() {
    if (!token) return;
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Không thể tải danh sách users');
      const users = await response.json();
      if (taskAssigneeSelect) {
        taskAssigneeSelect.innerHTML = '<option value="">-- Chọn người phụ trách --</option>';
        users.forEach(u => {
          const option = document.createElement('option');
          option.value = u.username;
          option.textContent = u.username;
          taskAssigneeSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error('Lỗi fetch users:', err);
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

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedPriority = priorityFilter ? priorityFilter.value : 'all';

    tasks.forEach(task => {
      // Áp dụng bộ lọc tìm kiếm và độ ưu tiên
      if (searchTerm) {
        const titleMatch = task.title && task.title.toLowerCase().includes(searchTerm);
        const descMatch = task.description && task.description.toLowerCase().includes(searchTerm);
        if (!titleMatch && !descMatch) {
          return;
        }
      }

      if (selectedPriority !== 'all') {
        if (task.priority !== selectedPriority) {
          return;
        }
      }
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

    if (role !== 'viewer') {
      card.setAttribute('draggable', 'true');

      // Thêm các sự kiện kéo card
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', task.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    }

    const priorityText = task.priority === 'high' ? 'Cao' : task.priority === 'low' ? 'Thấp' : 'Trung bình';
    
    // Subtasks indicator
    let subtasksIndicator = '';
    if (task.subtasks && task.subtasks.length > 0) {
      const completed = task.subtasks.filter(st => st.completed).length;
      const total = task.subtasks.length;
      subtasksIndicator = `
        <div class="task-subtasks-indicator">
          <i class="fa-solid fa-list-check"></i> ${completed}/${total}
        </div>
      `;
    }

    // Phase 3 Meta Data
    let dueDateHtml = '';
    if (task.due_date) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const dueDate = new Date(task.due_date);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let badgeClass = 'due-date-badge';
      let icon = 'fa-regular fa-calendar';
      if (diffDays < 0) {
        badgeClass += ' due-date-overdue';
        icon = 'fa-solid fa-triangle-exclamation';
      } else if (diffDays <= 2) {
        badgeClass += ' due-date-warning';
        icon = 'fa-solid fa-clock';
      }
      
      const formattedDate = dueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      dueDateHtml = `<div class="${badgeClass}"><i class="${icon}"></i> ${formattedDate}</div>`;
    }

    let tagsHtml = '';
    if (task.tags && task.tags.length > 0) {
      tagsHtml = task.tags.map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('');
    }

    let assigneeHtml = '';
    if (task.assignee) {
      const initial = task.assignee.charAt(0).toUpperCase();
      assigneeHtml = `<div class="assignee-avatar" title="Phụ trách: ${escapeHtml(task.assignee)}">${initial}</div>`;
    }

    card.innerHTML = `
      <div class="task-item-header">
        <span class="task-item-title">${escapeHtml(task.title)}</span>
      </div>
      ${task.description ? `<p class="task-item-desc">${escapeHtml(task.description)}</p>` : ''}
      ${subtasksIndicator}
      <div class="card-meta">
        <div class="priority-badge priority-${task.priority || 'medium'}">${priorityText}</div>
        ${dueDateHtml}
        ${tagsHtml}
        ${assigneeHtml}
      </div>
      ${role !== 'viewer' ? `
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
      ` : ''}
    `;

    // Click vào vùng thân thẻ task để mở modal chỉnh sửa (bỏ qua nếu click trúng nút icon hành động)
    card.addEventListener('click', (e) => {
      if (role === 'viewer') return; // Viewer không được mở modal sửa
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

    const editBtn = card.querySelector('.edit-task');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(task);
      });
    }

    const deleteBtn = card.querySelector('.delete-task');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
          await deleteTask(task.id);
        }
      });
    }

    return card;
  }

  function openEditModal(task) {
    modalTitle.textContent = 'Cập Nhật Công Việc';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    if (quill) quill.root.innerHTML = task.description || '';
    taskStatusSelect.value = task.status;
    taskPriorityInput.value = task.priority || 'medium';
    if (taskDueDateInput) taskDueDateInput.value = task.due_date || '';
    if (taskTagsInput) taskTagsInput.value = task.tags ? task.tags.join(', ') : '';
    if (taskAssigneeSelect) taskAssigneeSelect.value = task.assignee || '';
    
    currentSubtasks = task.subtasks || [];
    renderSubtasks();

    currentComments = task.comments || [];
    commentsGroup.style.display = 'block';
    renderComments();

    statusGroup.style.display = 'block'; // Hiển thị ô chọn trạng thái khi chỉnh sửa
    if (attachmentGroup) {
      attachmentGroup.style.display = 'block'; // Hiện khung tải file khi sửa
      if (task.attachment_url) {
        attachmentInfo.style.display = 'flex';
        attachmentLink.href = task.attachment_url;
        attachmentLink.textContent = task.attachment_name;
      } else {
        attachmentInfo.style.display = 'none';
      }
    }
    currentSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
    renderSubtasks();
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

  async function fetchActivities() {
    if (!token) return;
    try {
      const response = await fetch('/api/activities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Không thể tải lịch sử hoạt động');
      const activities = await response.json();
      renderActivities(activities);
    } catch (err) {
      console.error(err.message);
    }
  }

  function renderActivities(activities) {
    if (!activityList) return;
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
      activityList.innerHTML = '<p class="text-muted" style="text-align: center; margin-top: 2rem;">Chưa có hoạt động nào được ghi nhận.</p>';
      return;
    }

    activities.forEach(act => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      
      let badgeType = 'badge-update';
      if (act.action === 'CREATE') badgeType = 'badge-create';
      else if (act.action === 'MOVE') badgeType = 'badge-move';
      else if (act.action === 'DELETE') badgeType = 'badge-delete';
      else if (act.action === 'RESET') badgeType = 'badge-reset';

      const formattedTime = new Date(act.created_at).toLocaleString('vi-VN');

      item.innerHTML = `
        <div class="timeline-badge ${badgeType}"></div>
        <div class="timeline-meta">
          <span class="timeline-user">@${escapeHtml(act.username)}</span>
          <span class="timeline-time">${formattedTime}</span>
        </div>
        <div class="timeline-title">${act.task_title !== '-' ? `<strong>${escapeHtml(act.task_title)}</strong>: ` : ''}${escapeHtml(act.details)}</div>
      `;
      activityList.appendChild(item);
    });
  }

  // --- Analytics Chart Logic ---
  function renderChart() {
    if (!ctxChart) return;
    
    let todoCount = 0;
    let progressCount = 0;
    let completedCount = 0;
    tasks.forEach(t => {
      if (t.status === 'todo') todoCount++;
      else if (t.status === 'in_progress') progressCount++;
      else if (t.status === 'completed') completedCount++;
    });

    if (taskChartInstance) {
      taskChartInstance.destroy();
    }

    const isLightMode = document.body.classList.contains('light-mode');
    const textColor = isLightMode ? '#0f0c29' : '#fff';

    taskChartInstance = new Chart(ctxChart, {
      type: 'pie',
      data: {
        labels: ['Cần Làm', 'Đang Làm', 'Đã Xong'],
        datasets: [{
          data: [todoCount, progressCount, completedCount],
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(16, 185, 129, 0.7)'
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(16, 185, 129, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor }
          }
        }
      }
    });
  }

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
