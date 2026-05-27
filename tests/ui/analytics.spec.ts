import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';


test.describe('Kiểm thử Biểu đồ Thống kê (Analytics Chart)', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
    await loginPage.login('admin', 'password123');
    await dashboardPage.resetDatabase();
  });

  test('nên hiển thị biểu đồ thống kê Chart.js', async ({ page }) => {
    // Open the analytics drawer
    await page.click('#open-analytics-btn');
    
    // Wait for drawer to be visible
    const drawer = page.locator('#analytics-drawer');
    await expect(drawer).toBeVisible();
    
    // Verify canvas exists
    const canvas = page.locator('#taskChart');
    await expect(canvas).toBeVisible();

    // Since Chart.js animates, wait a bit
    await page.waitForTimeout(1000);

    // Verify it's a valid canvas with width and height
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
