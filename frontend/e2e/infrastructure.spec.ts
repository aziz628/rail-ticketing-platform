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

test.describe('Infrastructure flows (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Stations: CRUD flow', async ({ page }) => {
    await page.getByRole('link', { name: 'Gares' }).click();
    
    await expect(page.getByText('Tunis Ville')).toBeVisible();
    await expect(page.getByText('Sousse')).toBeVisible();

    await page.click('button:has-text("Nouvelle gare")');
    await page.fill('input[name="name"]', 'Bizerte');
    await page.click('button:has-text("Créer la gare")');
    
    await expect(page.getByText('La gare a été créée avec succès')).toBeVisible();
    await expect(page.getByText('Bizerte')).toBeVisible();

    await page.getByLabel('Modifier la gare Bizerte').click();
    await page.fill('input[name="name"]', 'Bizerte Nord');
    await page.click('button:has-text("Enregistrer")');
    await expect(page.getByText('La gare a été mise à jour avec succès')).toBeVisible();
    await expect(page.getByText('Bizerte Nord')).toBeVisible();

    await page.getByLabel('Supprimer la gare Bizerte Nord').click();
    await page.click('button:has-text("Supprimer")');
    await expect(page.getByText('La gare a été supprimée avec succès')).toBeVisible();
    await expect(page.getByText('Bizerte Nord')).not.toBeVisible();
  });

  test('Trains: Create flow and Validation', async ({ page }) => {
    await page.getByRole('link', { name: 'Trains' }).click();

    await expect(page.getByText('Alstom Coradia')).toBeVisible();

    await page.click('button:has-text("Nouveau train")');
    
    await page.getByLabel('Activer la classe SECOND').click();
    await page.click('button:has-text("Créer le train")');
  
    await expect(page.getByText('Veuillez activer au moins une classe de siège')).toBeVisible();

    await page.fill('input[name="name"]', 'Express 700');
    await page.getByLabel('Activer la classe FIRST').click();
    await page.click('button:has-text("Créer le train")');
    
    await expect(page.getByText('Le train a été créé avec succès')).toBeVisible();
    await expect(page.getByText('Express 700')).toBeVisible();
  });

  test('Lines: Sequence Builder and Constraints', async ({ page }) => {
    await page.getByRole('link', { name: 'Lignes' }).click();
    
    await expect(page.getByText('Tunis ↔ Sfax')).toBeVisible();

    await page.click('button:has-text("Créer une ligne")');
    await page.fill('input[name="name"]', 'Tunis - Bizerte');
    
    await page.fill('input[name="nodes.1.kmFromSource"]', '0');
    await page.click('button:has-text("Verrouiller & Créer")');

    await expect(page.getByText('Les distances doivent être strictement croissantes')).toBeVisible();

    await page.click('button:has-text("Ajouter une gare intermédiaire")');
    
    await page.selectOption('select[name="nodes.0.stationId"]', "34f4935a-c9c9-4648-96fe-a02ca5e292bd");
    await page.selectOption('select[name="nodes.1.stationId"]', "8283142e-f01e-48dd-a8e8-b6d09cc57582");
    await page.fill('input[name="nodes.1.kmFromSource"]', '140');
    await page.selectOption('select[name="nodes.2.stationId"]', "99627c07-45a8-4450-9219-71421a69deee");
    await page.fill('input[name="nodes.2.kmFromSource"]', '270');
    
    await page.click('button:has-text("Verrouiller & Créer")');
    await expect(page.getByText('La ligne a été créée avec succès')).toBeVisible();    
    await expect(page.getByText('Tunis - Bizerte', { exact: true })).toBeVisible();
    await expect(page.getByText('Tunis - Bizerte (Reverse)')).toBeVisible();
  });

  test('Lines: Rule < 2 stations prevents modal', async ({ page }) => {
    await page.getByRole('link', { name: 'Gares' }).click();
        
    await page.getByLabel('Supprimer la gare Sousse').click();
    await page.click('button:has-text("Supprimer")');
    await page.getByLabel('Supprimer la gare Sfax').click();
    await page.click('button:has-text("Supprimer")');
    
    await page.getByRole('link', { name: /Lignes/i }).click();
    
    await page.click('button:has-text("Créer une ligne")');
    
    await expect(page.getByText('Vous devez avoir au moins 2 gares pour créer une ligne.')).toBeVisible();
    
    await expect(page.getByText('Créer une ligne stricte')).not.toBeVisible();
  });
});
