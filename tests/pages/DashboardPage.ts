import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly userDisplayName: Locator;
  readonly logoutBtn: Locator;
  readonly resetDbBtn: Locator;
  readonly openAddTaskBtn: Locator;
  readonly themeToggleBtn: Locator;

  // Định vị các Cột & Danh sách Task
  readonly listTodo: Locator;
  readonly listInProgress: Locator;
  readonly listCompleted: Locator;

  readonly countTodo: Locator;
  readonly countInProgress: Locator;
  readonly countCompleted: Locator;

  // Định vị các phần tử trong Modal Form
  readonly taskModal: Locator;
  readonly modalTitle: Locator;
  readonly taskTitleInput: Locator;
  readonly taskDescInput: Locator;
  readonly taskStatusSelect: Locator;
  readonly saveTaskBtn: Locator;
  readonly cancelTaskBtn: Locator;

  // Subtasks
  readonly addSubtaskBtn: Locator;
  readonly subtasksContainer: Locator;

  // File Attachment
  readonly fileInput: Locator;
  readonly attachmentLink: Locator;

  // Định vị các bộ lọc tìm kiếm & độ ưu tiên
  readonly searchInput: Locator;
  readonly priorityFilter: Locator;
  readonly taskPrioritySelect: Locator;

  // Định vị Drawer Lịch sử hoạt động
  readonly openActivityBtn: Locator;
  readonly closeDrawerBtn: Locator;
  readonly activityDrawer: Locator;
  readonly activityList: Locator;
  readonly timelineItems: Locator;

  constructor(page: Page) {
    super(page);
    this.userDisplayName = page.locator('#user-display-name');
    this.logoutBtn = page.locator('#logout-btn');
    this.resetDbBtn = page.locator('#reset-db-btn');
    this.openAddTaskBtn = page.locator('#open-add-task-btn');
    this.themeToggleBtn = page.locator('#theme-toggle-btn');

    this.listTodo = page.locator('#list-todo');
    this.listInProgress = page.locator('#list-in-progress');
    this.listCompleted = page.locator('#list-completed');

    this.countTodo = page.locator('#count-todo');
    this.countInProgress = page.locator('#count-in-progress');
    this.countCompleted = page.locator('#count-completed');

    // Modal
    this.taskModal = page.locator('#task-modal');
    this.modalTitle = page.locator('#modal-title');
    this.taskTitleInput = page.locator('#task-title');
    this.taskDescInput = page.locator('#task-desc');
    this.taskStatusSelect = page.locator('#task-status');
    this.saveTaskBtn = page.locator('#save-task-btn');
    this.cancelTaskBtn = page.locator('#cancel-task-btn');

    this.addSubtaskBtn = page.locator('#add-subtask-btn');
    this.subtasksContainer = page.locator('#subtasks-container');

    this.fileInput = page.locator('#task-attachment');
    this.attachmentLink = page.locator('#attachment-link');

    // Bộ lọc
    this.searchInput = page.locator('#search-input');
    this.priorityFilter = page.locator('#priority-filter');
    this.taskPrioritySelect = page.locator('#task-priority');

    // Drawer
    this.openActivityBtn = page.locator('#open-activity-btn');
    this.closeDrawerBtn = page.locator('#close-drawer-btn');
    this.activityDrawer = page.locator('#activity-drawer');
    this.activityList = page.locator('#activity-list');
    this.timelineItems = page.locator('#activity-list .timeline-item');
  }

  async logout() {
    await this.logoutBtn.click();
  }

  async resetDatabase() {
    await this.resetDbBtn.click();
    // Đợi API reset database trả về response thành công
    await this.page.waitForResponse(response => response.url().includes('/api/db/reset') && response.status() === 200);
    // Wait for the subsequent fetchTasks() call triggered by the frontend to finish
    await this.page.waitForResponse(response => response.url().includes('/api/tasks') && response.request().method() === 'GET' && response.status() === 200);
    await this.page.waitForTimeout(500);
  }

  async openCreateTaskModal() {
    await this.openAddTaskBtn.click();
    await this.taskModal.waitFor({ state: 'visible' });
  }

  async fillTaskForm(title: string, description: string = '', status?: 'todo' | 'in_progress' | 'completed', priority?: 'low' | 'medium' | 'high') {
    await this.taskTitleInput.fill(title);
    await this.taskDescInput.fill(description);
    if (status) {
      await this.taskStatusSelect.selectOption(status);
    }
    if (priority) {
      await this.taskPrioritySelect.selectOption(priority);
    }
  }

  async saveTask() {
    await this.saveTaskBtn.click();
    await this.taskModal.waitFor({ state: 'hidden' });
  }

  async createTask(title: string, description: string = '', priority: 'low' | 'medium' | 'high' = 'medium') {
    await this.openCreateTaskModal();
    await this.fillTaskForm(title, description, undefined, priority);
    await this.saveTask();
    // Đợi thẻ công việc mới hiển thị để chắc chắn đã render xong
    await this.getTaskCard(title).waitFor({ state: 'visible' });
    await this.page.waitForTimeout(300);
  }

  // Các hàm phụ trợ (helper) xử lý thẻ Task
  getTaskCard(title: string): Locator {
    return this.page.locator(`.task-item`, { hasText: title });
  }

  async editTask(originalTitle: string, newTitle: string, newDescription: string, newStatus?: 'todo' | 'in_progress' | 'completed', newPriority?: 'low' | 'medium' | 'high') {
    const card = this.getTaskCard(originalTitle);
    await card.click(); // Click vào thân của thẻ task để mở modal chỉnh sửa
    await this.taskModal.waitFor({ state: 'visible' });
    await this.fillTaskForm(newTitle, newDescription, newStatus, newPriority);
    await this.saveTask();
    // Đợi thẻ công việc mới hiển thị để chắc chắn đã render xong
    await this.getTaskCard(newTitle).waitFor({ state: 'visible' });
    await this.page.waitForTimeout(300);
  }

  async searchTask(keyword: string) {
    await this.searchInput.fill(keyword);
  }

  async filterByPriority(priority: 'all' | 'low' | 'medium' | 'high') {
    await this.priorityFilter.selectOption(priority);
  }

  // Upload file đính kèm
  async uploadAttachment(filePath: string) {
    // Lưu ý: với file-input ẩn (display: none), Playwright vẫn upload được qua setInputFiles
    await this.fileInput.setInputFiles(filePath);
    // Chờ API upload file trả về thành công
    await this.page.waitForResponse(response => response.url().includes('/upload') && response.status() === 200);
  }

  async moveTaskForward(title: string) {
    const card = this.getTaskCard(title);
    const moveBtn = card.locator('.move-task');
    await moveBtn.click();
    // Đợi API cập nhật trạng thái task trả về thành công
    await this.page.waitForResponse(response => response.url().includes('/api/tasks/') && response.status() === 200);
    await this.page.waitForTimeout(300);
  }

  async deleteTask(title: string) {
    const card = this.getTaskCard(title);
    const deleteBtn = card.locator('.delete-task');
    await deleteBtn.click();
    // Đợi thẻ công việc biến mất khỏi DOM
    await card.waitFor({ state: 'hidden' });
    await this.page.waitForTimeout(300);
  }

  async getColumnTaskCount(column: 'todo' | 'in_progress' | 'completed'): Promise<number> {
    let countText = '';
    if (column === 'todo') {
      countText = await this.countTodo.innerText();
    } else if (column === 'in_progress') {
      countText = await this.countInProgress.innerText();
    } else if (column === 'completed') {
      countText = await this.countCompleted.innerText();
    }
    return parseInt(countText, 10);
  }

  async getUsername(): Promise<string> {
    const text = await this.userDisplayName.textContent();
    return text ? text.trim() : '';
  }

  async dragAndDropTask(title: string, targetColumn: 'todo' | 'in_progress' | 'completed') {
    const card = this.getTaskCard(title);
    let targetList: Locator;
    if (targetColumn === 'todo') {
      targetList = this.listTodo;
    } else if (targetColumn === 'in_progress') {
      targetList = this.listInProgress;
    } else {
      targetList = this.listCompleted;
    }
    await card.dragTo(targetList);
    // Đợi API cập nhật trạng thái task trả về thành công
    await this.page.waitForResponse(response => response.url().includes('/api/tasks/') && response.status() === 200);
    await this.page.waitForTimeout(300);
  }

  async openActivityLogs() {
    await this.openActivityBtn.click();
    await this.activityDrawer.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(300);
  }

  async closeActivityLogs() {
    await this.closeDrawerBtn.click();
    await this.activityDrawer.waitFor({ state: 'hidden' });
  }

  async getActivityLogTexts(): Promise<string[]> {
    return this.timelineItems.allTextContents();
  }

  async toggleTheme() {
    await this.themeToggleBtn.click();
    // Chờ hiệu ứng chuyển đổi CSS
    await this.page.waitForTimeout(300);
  }

  // --- Hỗ trợ Subtasks ---
  async addSubtask(title: string) {
    await this.addSubtaskBtn.click();
    const lastSubtaskInput = this.subtasksContainer.locator('.subtask-item input[type="text"]').last();
    await lastSubtaskInput.fill(title);
  }

  async checkSubtask(index: number, check: boolean = true) {
    const checkbox = this.subtasksContainer.locator('.subtask-item').nth(index).locator('input[type="checkbox"]');
    if (check) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  getTaskSubtasksIndicator(taskTitle: string): Locator {
    return this.getTaskCard(taskTitle).locator('.task-subtasks-indicator');
  }
}
