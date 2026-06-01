import { test, expect } from '@playwright/test';
import PATHS from '../src/app/paths';

const loginAsAdmin = async (page: any) => {
  await page.goto(PATHS.ADMIN.LOGIN);
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForURL(PATHS.ADMIN.DASHBOARD);
};

test.describe('Trips Management (Voyages) flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Page loads and settings can be updated', async ({ page }) => {
    // Navigate to Voyages
    await page.getByRole('link', { name: 'Voyages' }).click();
    await page.waitForURL(PATHS.ADMIN.TRIPS);

    // Verify header and settings card presence
    await expect(page.getByRole('heading', { name: 'Gestion des Voyages' })).toBeVisible();
    await expect(page.getByText('Génération de Voyages')).toBeVisible();

    // Test Auto-Gen Toggle
    const autoGenSwitch = page.getByRole('switch');
    const isCheckedInitial = await autoGenSwitch.getAttribute('aria-checked') === 'true';
    
    await autoGenSwitch.click();
    await expect(page.getByText('Paramètres mis à jour')).toBeVisible();
    
    const isCheckedAfter = await autoGenSwitch.getAttribute('aria-checked') === 'true';
    expect(isCheckedAfter).toBe(!isCheckedInitial);

    // Test Generation Span Select
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: '14 Jours' }).click();
    await expect(page.getByText('Paramètres mis à jour')).toBeVisible();

    // Test Manual Sync
    await page.getByRole('button', { name: 'Sync Now' }).click();
    await expect(page.getByText('Synchronisation terminée')).toBeVisible();
  });

  test('Filtering and Pagination', async ({ page }) => {
    await page.getByRole('link', { name: 'Voyages' }).click();
    await page.waitForURL(PATHS.ADMIN.TRIPS);

    // Test Line Filter
    const filtersRow = page.locator('.flex.items-center.gap-4').last();
    await filtersRow.getByRole('combobox').click();
    
    // Select a line (Tunis ↔ Sfax from mock data)
    await page.getByRole('option', { name: 'Tunis ↔ Sfax' }).click();
    
    // Verify table updates ( we can check if the select value changed)
    await expect(filtersRow.getByRole('combobox')).toContainText('Tunis ↔ Sfax');

    // set date to 2026-05-09
    //await page.locator('#trip-date-filter').fill('2026-05-09');


    // Test Pagination (Load More)
    const loadMoreBtn = page.getByRole('button', { name: 'Afficher plus' });
    await loadMoreBtn.isVisible()
    const initialRowCount = await page.locator('tbody tr').count();
    await loadMoreBtn.click();
    
    // more rows loaded
    const newRowCount = await page.locator('tbody tr').count();
    expect(newRowCount).toBeGreaterThan(initialRowCount);
  });
});
