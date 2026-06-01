import { test, expect } from '@playwright/test';
import PATHS from '../src/app/paths';

const loginAsAdmin = async (page: any) => {
  await page.goto(PATHS.ADMIN.LOGIN);
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForURL(PATHS.ADMIN.DASHBOARD);
  await expect(page.getByRole('banner')).toContainText('Administrateur');
};

test.describe('Schedules Management flows (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Complex Creation schedule and Validation', async ({ page }) => {
    // Navigate to Schedules
    await page.getByRole('link', { name: 'Horaires' }).click();
    await page.waitForURL(PATHS.ADMIN.SCHEDULES);

    // Verify initial state
    await expect(page.getByText('Ligne', {exact: true })).toBeVisible();

    // Open Create Modal
    await page.click('button:has-text("Créer un horaire")');
    await expect(page.getByText('Créer un horaire journalier')).toBeVisible();

    // Select Line (should populate stops)
    await page.click('#line-select');
    await page.getByRole('option', { name: 'Tunis ↔ Sfax' }).click();

    // Verify stops appeared in the modal
    const modal = page.getByRole('dialog');
    await expect(modal.getByText('Tunis Ville', { exact: true })).toBeVisible();
    await expect(modal.getByText('Sousse', { exact: true })).toBeVisible();
    await expect(modal.getByText('Sfax', { exact: true })).toBeVisible();

    //  Select Train
    await page.click('#train-select');
    await page.getByRole('option', { name: 'EXP' }).click();

    //  Select Controller
    await page.click('#controller-select');
    await page.getByRole('option', { name: 'Mohamed Controller' }).click();

    //  Day Toggles
    await page.getByLabel('Lun').click();
    await page.getByLabel('Mer').click();
    await page.getByLabel('Ven').click();

    //  Validation: Out of order times
    await page.locator('input[type="time"]').nth(0).fill('10:00');
    // enable the checkbox of intermediate stop so time input will appear
    await page.locator('div').filter({ hasText: /^Sousse$/ }).getByRole('checkbox').click();
    
    await page.locator('input[type="time"]').nth(1).fill('11:00');
    await page.locator('input[type="time"]').nth(2).fill('09:00'); // Sfax before Sousse
    await page.click('button:has-text("Créer l\'horaire")');

    await expect(page.getByText("Les arrêts doivent être dans l'ordre croissant")).toBeVisible();

    //  Fix times and submit
    await page.locator('input[type="time"]').nth(2).fill('12:00');
    await page.click('button:has-text("Créer l\'horaire")');

    //  Success notification
    await expect(page.getByText('Horaire créé avec succès')).toBeVisible();
  });

  test('Deactivation and Tab Filtering', async ({ page }) => {
    await page.getByRole('link', { name: 'Horaires' }).click();
    await page.waitForURL(PATHS.ADMIN.SCHEDULES);

    // Initial Active Tab
    const row = page.locator('tr', { hasText: 'Tunis ↔ Sfax' }).first();
    await expect(row).toBeVisible();

    //  Deactivate
    await row.getByTitle('Désactiver').click();
    
    // Use the specific ID we added
    await page.click('#deactivate-date-input');
    
    // Select a day in the calendar. 
    // We'll use a locator that finds the day "28" within the popover/calendar.
    // we use a filter for the day number as a string .
    await page.getByRole('button').filter({ hasText: /^28$/ }).click();
    
    await page.click('button:has-text("Confirmer la désactivation")');

    await expect(page.getByText('Horaire désactivé avec succès')).toBeVisible();
    
    //  Tab Filtering: Should move to Inactive tab
    // Wait for the row to disappear from Active tab (since mock marks it as isDeleted)
    await expect(row).not.toBeVisible();

    // Switch to Désactivés (Inactive) tab
    await page.click('button:has-text("Désactivés")');
    await expect(page.locator('tr', { hasText: 'Tunis ↔ Sfax' }).first()).toBeVisible();
  });

  test('Hard Delete flow', async ({ page }) => {
    await page.getByRole('link', { name: 'Horaires' }).click();
    
    const row = page.locator('tr', { hasText: 'Tunis ↔ Sfax' }).first();
    
    //  Click Delete
    await row.getByTitle('Supprimer').click();
    
    //  Confirm in ConfirmationModal
    await expect(page.getByText('Êtes-vous sûr de vouloir supprimer définitivement')).toBeVisible();
    await page.click('button:has-text("Supprimer")');

    //  Success
    await expect(page.getByText('Horaire supprimé définitivement')).toBeVisible();
    // (Note: In a real test we'd check it's gone, but it depends on mock data reset)
  });

  test('Line Filter flow', async ({ page }) => {
    await page.getByRole('link', { name: 'Horaires' }).click();
    
    // Wait for data in the table
    await expect(page.getByRole('cell', { name: 'Tunis ↔ Sfax' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Tunis ↔ Gabès' }).first()).toBeVisible();

    // 1. Filter by Tunis ↔ Sfax
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Tunis ↔ Sfax' }).click();

    // 2. Verify Gabes is gone, Sfax remains in table
    await expect(page.getByRole('cell', { name: 'Tunis ↔ Sfax' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Tunis ↔ Gabès' })).not.toBeVisible();

    // 3. Reset Filter
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Toutes les lignes' }).click();

    // 4. Verify both are back
    await expect(page.getByRole('cell', { name: 'Tunis ↔ Sfax' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Tunis ↔ Gabès' }).first()).toBeVisible();
  });
});
