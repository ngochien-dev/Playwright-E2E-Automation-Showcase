import { Page, Locator } from '@playwright/test';

// Class cơ sở (Base Page) chứa các tiện ích dùng chung cho các lớp POM khác
export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Điều hướng trình duyệt đến một đường dẫn tương đối (mặc định là root '/')
  async navigate(path: string = '/') {
    await this.page.goto(path);
  }

  // Lấy tiêu đề (Title) của trang hiện tại
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  // Chờ cho một phần tử hiển thị trên màn hình với thời gian chờ tối đa tùy chọn
  async waitForElement(locator: Locator, timeout: number = 5000) {
    await locator.waitFor({ state: 'visible', timeout });
  }
}
