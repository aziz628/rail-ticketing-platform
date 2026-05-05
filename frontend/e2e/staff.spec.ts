import { test, expect } from '@playwright/test';
import PATHS from '../src/app/paths';

const loginAsAdmin = async (page: any) => {
  page.goto(PATHS.ADMIN.LOGIN);
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForURL(PATHS.ADMIN.PROFILE);
  await expect(page.getByRole('banner')).toContainText('Administrateur');
};

test.describe('Staff Management flows (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Agents load, create and deactivate flow', async ({ page }) => {
    // Navigate using sidebar
    await page.getByRole('link', { name: 'Personnel' }).click();
    await page.waitForURL(PATHS.ADMIN.STAFF);

    // Verify initial data loaded from mock database 
    await expect(page.getByText('Ahmed Agent')).toBeVisible();
    await expect(page.getByText('Sara Agent')).toBeVisible();

    // Open create agent modal
    await page.click('button:has-text("Nouvel agent")');
    
    // Fill agent data
    await page.fill('input[id="agent-name"]', 'Bilel Agent');
    await page.fill('input[id="agent-email"]', 'bilel@sncft.tn');
    await page.click('button:has-text("Créer l\'agent")');
    
    // Success notification and visibility
    await expect(page.getByText('Agent créé avec succès')).toBeVisible();
    await expect(page.getByText('Bilel Agent')).toBeVisible();

    // Deactivate agent
    const row = page.locator('tr', { hasText: 'Ahmed Agent' });
    await row.getByLabel('Désactiver').click();
    
    // Confirm deactivation
    await page.click('button:has-text("Désactiver")');
    await expect(page.getByText('L\'agent a été désactivé avec succès')).toBeVisible();
    await expect(page.getByText('Ahmed Agent')).not.toBeVisible();
  });

  test('Controllers load, create and deactivate flow', async ({ page }) => {
    await page.getByRole('link', { name: 'Personnel' }).click();
    await page.waitForURL(PATHS.ADMIN.STAFF);

    // Switch to Controllers tab
    await page.click('button:has-text("Contrôleurs")');

    // Verify initial data
    await expect(page.getByText('Mohamed Controller')).toBeVisible();
    await expect(page.getByText('Tunis ↔ Sfax')).toBeVisible();

    // Open create controller modal
    await page.click('button:has-text("Nouveau contrôleur")');
    
    // Fill controller data
    await page.fill('input[id="name"]', 'Yassine Controller');
    await page.fill('input[id="email"]', 'yassine@sncft.tn');
    
    // Select line (Tunis ↔ Sfax)
    await page.click('button:has-text("Sélectionner une ligne")');
    
    // Use getByRole to ensure we click the option in the dropdown, not the background table
    const option = page.getByRole('option', { name: 'Tunis ↔ Sfax' });
    await expect(option).toBeVisible();
    await option.click();
    
    await page.click('button:has-text("Créer le contrôleur")');
    
    // Success notification and visibility
    await expect(page.getByText('Contrôleur créé avec succès')).toBeVisible();
    await expect(page.getByText('Yassine Controller')).toBeVisible();
  });
});
