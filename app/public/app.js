document.addEventListener('DOMContentLoaded', () => {
  // --- State ---
  let token = localStorage.getItem('token') || '';
  let username = localStorage.getItem('username') || '';
  let tasks = [];

  // --- DOM Elements ---
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

  // Modal elements
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

  // --- Initial Check ---
  if (token) {
    showDashboard();
  } else {
    showAuth();
  }

  // --- Views Toggling ---
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

  // --- Event Listeners ---

  // Login Submit
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
        throw new Error(data.error || 'Authentication failed');
      }

      token = data.token;
      username = data.username;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);

      // Reset form fields
      usernameInput.value = '';
      passwordInput.value = '';

      showDashboard();
    } catch (err) {
      loginErrorText.textContent = err.message;
      loginError.style.display = 'flex';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    token = '';
    username = '';
    tasks = [];
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    showAuth();
  });

  // Reset Database
  resetDbBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete all tasks and reset the database?')) {
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
      if (!response.ok) throw new Error('Reset failed');
      await fetchTasks();
    } catch (err) {
      alert('Error resetting database: ' + err.message);
    }
  }

  // Modal Open for Create
  openAddTaskBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Create New Task';
    taskIdInput.value = '';
    taskTitleInput.value = '';
    taskDescInput.value = '';
    statusGroup.style.display = 'none'; // Default is always "todo" for new tasks
    taskModal.style.display = 'flex';
  });

  // Modal Close
  const closeModal = () => {
    taskModal.style.display = 'none';
  };
  closeModalBtn.addEventListener('click', closeModal);
  cancelTaskBtn.addEventListener('click', closeModal);

  // Close modal when clicking outside card
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) {
      closeModal();
    }
  });

  // Form Submit (Create or Edit Task)
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
      if (!response.ok) throw new Error(data.error || 'Failed to save task');

      closeModal();
      await fetchTasks();
    } catch (err) {
      alert('Error saving task: ' + err.message);
    }
  });

  // --- API Calls & UI Rendering ---

  async function fetchTasks() {
    try {
      const response = await fetch('/api/tasks', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        // Token expired/invalid, logout
        logoutBtn.click();
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch tasks');

      tasks = await response.json();
      renderBoard();
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }

  function renderBoard() {
    // Clear list columns
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

    // Update counters
    countTodo.textContent = todoCount;
    countInProgress.textContent = progressCount;
    countCompleted.textContent = completedCount;
  }

  function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-item task-item-${task.status}`;
    card.setAttribute('data-id', task.id);
    card.setAttribute('id', `task-card-${task.id}`);

    card.innerHTML = `
      <div class="task-item-header">
        <span class="task-item-title">${escapeHtml(task.title)}</span>
      </div>
      ${task.description ? `<p class="task-item-desc">${escapeHtml(task.description)}</p>` : ''}
      <div class="task-item-actions">
        ${task.status !== 'completed' ? `
          <button class="action-icon move-task" title="Move task forward" data-id="${task.id}" data-status="${task.status}">
            <i class="fa-solid fa-circle-arrow-right"></i>
          </button>
        ` : ''}
        <button class="action-icon edit-task" title="Edit task" data-id="${task.id}">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="action-icon delete-task" title="Delete task" data-id="${task.id}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    // Click on card body to view/edit (excluding buttons)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.action-icon')) return; // Ignore button clicks
      openEditModal(task);
    });

    // Event listeners for action buttons
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
      if (confirm('Delete this task?')) {
        await deleteTask(task.id);
      }
    });

    return card;
  }

  function openEditModal(task) {
    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskStatusSelect.value = task.status;
    statusGroup.style.display = 'block'; // Show status choice when editing
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

      if (!response.ok) throw new Error('Failed to update task status');
      await fetchTasks();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  }

  async function deleteTask(id) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete task');
      await fetchTasks();
    } catch (err) {
      alert('Error deleting task: ' + err.message);
    }
  }

  // Utility to escape HTML entities (XSS prevention)
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
