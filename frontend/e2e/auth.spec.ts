import { test, expect } from '@playwright/test';
import PATHS from '../src/app/paths';

test.describe('Auth flows with MSW worker', () => {
  test('login then see profile data', async ({ page }) => {
    await page.goto(PATHS.VOYAGER.LOGIN);

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(PATHS.VOYAGER.PROFILE);

    const main = page.getByRole('main');
    await expect(main).toContainText('Utilisateur Test');
    await expect(main).toContainText('test@example.com');
  });

  test('login with wrong email', async ({ page }) => {  
    await page.goto(PATHS.VOYAGER.LOGIN);

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'password123');

    const loginResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/login'));
    await page.click('button[type="submit"]');
    const loginResponse = await loginResponsePromise;

    expect(loginResponse.status()).toBe(401);
    
    await expect(page).toHaveURL(PATHS.VOYAGER.LOGIN);

    const notification = page.getByText('Identifiants invalides');
    await expect(notification).toBeVisible();
  });

  test('register then land on profile', async ({ page }) => {
    await page.goto(PATHS.VOYAGER.REGISTER);

    await page.fill('input[name="email"]', 'new.client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.check('#cin');
    await page.fill('input[name="nationalIdNumber"]', '34567891');
    
    const registerResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/register'));
    await page.click('button[type="submit"]');

    const registerResponse = await registerResponsePromise;
    expect(registerResponse.status()).toBe(201);

    await page.waitForURL(PATHS.VOYAGER.PROFILE);

    const main = page.getByRole('main');
    await expect(main).toContainText('new client');
    await expect(main).toContainText('new.client@example.com');
  });

  test('forgot password then reset password', async ({ page }) => {
    await page.goto(PATHS.VOYAGER.FORGOT);

    await page.fill('input[name="email"]', 'test@example.com');
    const forgotResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/forgot-password'));
    await page.click('button[type="submit"]');

    const forgotResponse = await forgotResponsePromise;
    expect(forgotResponse.status()).toBe(200);

    await page.waitForURL(PATHS.VOYAGER.RESET);

    await page.fill('input[name="otp"]', '12345678');
    await page.fill('input[name="newPassword"]', 'newpassword123');
    await page.fill('input[name="confirmPassword"]', 'newpassword123');
    const resetResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/reset-password'));
    await page.click('button[type="submit"]');

    const resetResponse = await resetResponsePromise;
    expect(resetResponse.status()).toBe(200);

    await page.waitForURL(PATHS.VOYAGER.LOGIN);
  });

  test('logout redirects back to login', async ({ page }) => {
    await page.goto(PATHS.VOYAGER.LOGIN);

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    const loginResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/login'));
    await page.click('button[type="submit"]');

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    await page.waitForURL(PATHS.VOYAGER.PROFILE);
    const logoutResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/logout'));
    
    await page.click('button:has-text("Se déconnecter")');
    const logoutResponse = await logoutResponsePromise;
    expect(logoutResponse.status()).toBe(200);
    
    await page.waitForURL(PATHS.VOYAGER.LOGIN);
  });
});
