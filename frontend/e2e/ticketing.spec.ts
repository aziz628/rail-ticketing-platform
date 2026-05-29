import { test, expect } from '@playwright/test';
import PATHS from '../src/app/paths';

const loginAsVoyager = async (page: any) => {
  await page.goto(PATHS.VOYAGER.LOGIN);
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL(PATHS.VOYAGER.TICKETS);
};

test.describe('Ticketing Flow (Voyager)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsVoyager(page);
  });

  test('Full purchase and download flow', async ({ page }) => {
    // Navigate to Search Page via sidebar link
    await page.getByRole('link', { name: 'Rechercher trajet' }).click();
    await page.waitForURL(PATHS.VOYAGER.SEARCH);

    // Select a line first (required to unlock station dropdowns)
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Tunis ↔ Sfax' }).click();

    // Select departure station
    const stationSelects = page.getByRole('combobox');
    await stationSelects.nth(1).click();
    await page.getByRole('option', { name: 'Tunis Ville' }).click();

    // Select arrival station
    await stationSelects.nth(2).click();
    await page.getByRole('option', { name: 'Sfax' }).click();

    // Submit search
    await page.click('button:has-text("Rechercher des trajets")');

    // 2. Results page - verify trip is shown and click Réserver
    await page.waitForURL(`**${PATHS.VOYAGER.RESULTS}**`);
    await expect(page.getByText('Tunis Ville')).toBeVisible();
    await expect(page.getByText('Sfax')).toBeVisible();

    await page.click('button:has-text("Réserver")');

    // 3. Trip Details page - verify seat classes loaded and select one
    await page.waitForURL(`**${PATHS.VOYAGER.TRIP_DETAILS}**`);
    await expect(page.getByText('Classe de voyage')).toBeVisible();

    await page.click('button:has-text("Première Classe")');

    // Click Pay
    await page.click('button:has-text("Payer")');

    // 4. PSP Payment page
    await page.waitForURL((url) => url.pathname.startsWith(PATHS.VOYAGER.PAYMENT) && url.searchParams.get('targetType') === 'TICKET');
    await expect(page.getByText('Paiement Sécurisé')).toBeVisible();  

    // Fill card details by placeholder (no name/id on inputs)
    await page.fill('input[placeholder="0000 0000 0000 0000"]', '1234 1234 1234 1234');
    await page.fill('input[placeholder="MM/YY"]', '12/28');
    await page.fill('input[placeholder="•••"]', '123');

    await page.click('button:has-text("Valider le paiement")');

    // check success page url
    await page.waitForURL((url) => url.pathname === PATHS.VOYAGER.PAYMENT_SUCCESS && url.searchParams.get('targetType') === 'TICKET');
    await expect(page.getByText('Paiement Réussi')).toBeVisible();
    // press button 'Mes Billets'
    await page.click('button:has-text("Mes Billets")');

    // 5. Should land on My Tickets page
    await page.waitForURL(PATHS.VOYAGER.TICKETS);

    // Tabs are visible
    await expect(page.locator('button:has-text("À venir")')).toBeVisible();
    await expect(page.locator('button:has-text("Passés")')).toBeVisible();

    // Newly created ticket should appear with download button (there is many so limit to the first one)
    await expect(page.locator('button:has-text("Télécharger PDF")').first()).toBeVisible();
  });
  

  test('Free booking flow creates a ticket without payment', async ({ page }) => {
    await page.getByRole('link', { name: 'Rechercher trajet' }).click();
    await page.waitForURL(PATHS.VOYAGER.SEARCH);

    // Select the test-only line that has an active subscription seeded for the voyager
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Tunis ↔ TestFree' }).click();

    const stationSelects = page.getByRole('combobox');
    await stationSelects.nth(1).click();
    await page.getByRole('option', { name: 'Tunis Ville' }).click();

    await stationSelects.nth(2).click();
    await page.getByRole('option', { name: 'Sfax' }).click();

    await page.click('button:has-text("Rechercher des trajets")');
    await page.waitForURL(`**${PATHS.VOYAGER.RESULTS}**`);

    await page.click('button:has-text("Réserver")');
    await page.waitForURL(`**${PATHS.VOYAGER.TRIP_DETAILS}**`);

    await expect(page.getByRole('button', { name: 'Réserver gratuitement' })).toBeVisible();

    await page.click('button:has-text("Réserver gratuitement")');
    await page.waitForURL(PATHS.VOYAGER.TICKETS);

    await expect(page.locator('button:has-text("Télécharger PDF")').first()).toBeVisible();
    await expect(page.locator('text=0.00 DT').first()).toBeVisible();
  });

  test('Ticket history tabs switch correctly', async ({ page }) => {
    // Navigate directly using the sidebar nav link
    await page.getByRole('link', { name: 'mes billets' }).click();
    await page.waitForURL(PATHS.VOYAGER.TICKETS);

    // Default tab is 'À venir' — seeded upcoming ticket visible
    await expect(page.locator('button:has-text("À venir")')).toBeVisible();
    await expect(page.getByText('Tunis Ville')).toBeVisible();

    // Switch to 'Passés'
    await page.click('button:has-text("Passés")');

    // Seeded past ticket (Sousse → Tunis Ville) should appear
    await expect(page.getByText('Sousse')).toBeVisible();

    // Switch back to 'À venir'
    await page.click('button:has-text("À venir")');
    await expect(page.getByText('Tunis Ville')).toBeVisible();
  });
});
