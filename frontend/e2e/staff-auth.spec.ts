import { test, expect } from '@playwright/test';
import { PATHS } from '../src/app/paths';

test.describe('Staff Auth flows with MSW worker', () => {
  test('staff login then open profile', async ({ page }) => {
    await page.goto(PATHS.STAFF.LOGIN);

    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    
    const loginResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/staff/login'));

    await page.click('button[type="submit"]');

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    await page.waitForURL(PATHS.STAFF.PROFILE,{timeout:5000});

    const main = page.getByRole('main');
    await expect(main).toContainText('Administrateur');
    await expect(main).toContainText('admin@example.com');
  });

  test('staff forgot password then reset password', async ({ page }) => {
    await page.goto(PATHS.STAFF.FORGOT);

    await page.fill('input[name="email"]', 'admin@example.com');
    const forgotResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/staff/forgot-password'));
    await page.click('button[type="submit"]');

    const forgotResponse = await forgotResponsePromise;
    expect(forgotResponse.status()).toBe(200);

    await page.waitForURL(PATHS.STAFF.RESET);

    await page.fill('input[name="otp"]', '12345678');
    await page.fill('input[name="newPassword"]', 'newadmin123');
    await page.fill('input[name="confirmPassword"]', 'newadmin123');
    
    const resetResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/staff/reset-password'));
    await page.click('button[type="submit"]');

    const resetResponse = await resetResponsePromise;
    expect(resetResponse.status()).toBe(200);

    await page.waitForURL(PATHS.STAFF.LOGIN);
  });
});
