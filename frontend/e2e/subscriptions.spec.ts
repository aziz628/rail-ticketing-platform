import { test, expect, type Page } from '@playwright/test';
import PATHS from '../src/app/paths';

const loginAsAdmin = async (page: Page) => {
  await page.goto(PATHS.ADMIN.LOGIN);
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(PATHS.ADMIN.DASHBOARD);
  
};

const loginAsVoyager = async (page: Page) => {
  await page.goto(PATHS.VOYAGER.LOGIN);
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(PATHS.VOYAGER.TICKETS);
  
};

const loginAsAgent = async (page: Page) => {
  await page.goto(PATHS.STAFF.LOGIN);
  await page.fill('input[name="email"]', 'agent@example.com');
  await page.fill('input[name="password"]', 'agent123');
  await page.click('button[type="submit"]');
  await page.waitForURL(PATHS.AGENT.SUBSCRIPTION_REQUESTS);
  
};

const voyagerLogout = async (page: Page) => {
  // navigate to profile page
  await page.getByRole('link', { name: 'Profile' }).click();
  await page.waitForURL(PATHS.VOYAGER.PROFILE);
  await page.click('button:has-text("Se déconnecter")');
  await page.waitForURL(PATHS.VOYAGER.LOGIN);
}

const staffLogout = async (page: Page) => {
  // navigate to profile page
  await page.getByRole('link', { name: 'Profile' }).click();
  await page.waitForURL(PATHS.STAFF.PROFILE);
  await page.click('button:has-text("Se déconnecter")');
  await page.waitForURL(PATHS.STAFF.LOGIN);
}

const createSubscriptionRequest = async (
  page: Page,
  category: 'UNIVERSITAIRE' | 'CIVIL',
  lineName: 'Tunis ↔ Sfax' | 'Tunis ↔ Gabès',
  withProof: boolean,
) => {
  // open offers page
  await page.getByRole('link', { name: 'offres' }).click();
  await page.waitForURL(PATHS.VOYAGER.OFFERS);

  // select label using category
  const categoryLabel = category === 'CIVIL' ? 'Civil' : 'Universitaire';

  // select offer card based on category and click request btn
  const offerCard = page.locator('div.rounded-xl')
                        .filter({
                         has: page.getByRole('heading', { name: categoryLabel }) 
                        });
  await offerCard.getByRole('button', { name: 'Faire une demande' }).click();

  // check request page
  await page.waitForURL((url) => url.pathname.startsWith(PATHS.VOYAGER.SUBSCRIPTION_REQUEST));
  await expect(page.getByRole('heading', { name: new RegExp(categoryLabel, 'i') })).toBeVisible();
  
  // select line
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: lineName }).click();

  // attach proof if required
  if (withProof) {
    await expect(page.locator('input[type="file"]')).toHaveCount(1);
    await page.setInputFiles('input[type="file"]', {
      name: 'proof.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 mock proof'),
    });
  } else {
    // ensure file input is not present
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  }

  // intercept the request and assert success 
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/subscription-requests'));
  await page.click('button:has-text("Soumettre la demande")');
  const response = await responsePromise;
  expect(response.status()).toBe(201);

  await expect(page.getByText('Votre demande a été envoyée avec succès.').first()).toBeVisible();
};

test.describe('Subscription sprint flows', () => {
    
  test('Admin categories load and update', async ({ page }) => {
    await loginAsAdmin(page);
    // navigate to subscriptions page
    await page.getByRole('link', { name: 'Abonnements' }).click();
    await page.waitForURL(PATHS.ADMIN.SUBSCRIPTIONS);

    // check categories loaded
    await expect(page.getByText('Scolaire')).toBeVisible();
    await expect(page.getByText('Universitaire')).toBeVisible();
    await expect(page.getByText('Professionnel')).toBeVisible();
    await expect(page.getByText('Civil')).toBeVisible();

    // click edit button for universitaire category
    await page.getByRole('button', { name: 'Modifier les tarifs' }).nth(1).click();
    await page.fill('input[id="monthlyPrice"]', '13.10');
    await page.fill('input[id="quarterlyPrice"]', '36.50');

    // intercept the update request and assert success
    const updateResponsePromise = page.waitForResponse((response) => response.url().includes('/api/subscription-categories/subcat-universitaire'));
    await page.click('button:has-text("Mettre à jour")');
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    await expect(page.getByText('13.10')).toBeVisible();
    await expect(page.getByText('36.50')).toBeVisible();
    await expect(page.getByText('Tarifs mis à jour avec succès.')).toBeVisible();
  });

  test('Voyager requests, agent validation, and subscription payment flow', async ({ page }) => {
    await loginAsVoyager(page);
    // navigate to offers page
    await page.getByRole('link', { name: 'offres' }).click();
    await page.waitForURL(PATHS.VOYAGER.OFFERS);

    // check offers loaded
    await expect(page.getByText('Catégories d\'abonnement')).toBeVisible();
    await expect(page.getByText('Universitaire')).toBeVisible();
    await expect(page.getByText('Civil')).toBeVisible();
    
    // create 2 subscription requests, one with proof and one without
    await createSubscriptionRequest(page, 'UNIVERSITAIRE', 'Tunis ↔ Sfax', true);
    await createSubscriptionRequest(page, 'CIVIL', 'Tunis ↔ Gabès', false);//line-gabes



    // open subscriptions page and tab  requests
    await page.getByRole('link', { name: 'Mes abonnements' }).click();
    await page.waitForURL(PATHS.VOYAGER.SUBSCRIPTIONS);
    await page.getByRole('button', { name: 'Demandes' }).click();

    // check requests are visible - civil is auto-approved, universitaire is pending
    await expect(page.getByRole('heading', { name: 'Universitaire' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Civil' }).first()).toBeVisible();
    await expect(page.getByText('Tunis ↔ Sfax').first()).toBeVisible();
    await expect(page.getByText('Tunis ↔ Gabès').first()).toBeVisible();
    await expect(page.getByText('En attente').first()).toBeVisible();
    await expect(page.getByText('Approuvée').first()).toBeVisible();
    await voyagerLogout(page);

    // open agent page and check requests
    await loginAsAgent(page);
    await page.getByRole('link', { name: 'Demandes' }).click();
    await page.waitForURL(PATHS.AGENT.SUBSCRIPTION_REQUESTS);

    // check universitaire request is visible (civil auto-approves and skips agent queue)
    await expect(page.getByRole('cell', { name: 'Universitaire' }).first()).toBeVisible();

    // open proof modal for universitaire
    const proofRow = page.locator('tr', { hasText: 'Universitaire' });
    await proofRow.getByRole('button', { name: 'Examiner' }).click();
    await expect(page.getByText('Vérifier le justificatif')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approuver' })).toBeVisible();
    
    // approve the universitaire request
    const approveResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/staff/subscription-requests/') && response.url().includes('/approve')
    );
    await page.getByRole('button', { name: 'Approuver' }).click();
    const approveResponse = await approveResponsePromise;
    expect(approveResponse.status()).toBe(204);
    await staffLogout(page);

    // login as voyager and check request statuses
    await loginAsVoyager(page);
    await page.getByRole('link', { name: 'Mes abonnements' }).click();
    await page.waitForURL(PATHS.VOYAGER.SUBSCRIPTIONS);

    // check subscription status, count to be 2
    await expect(page.getByText('En attente de paiement')).toHaveCount(2);
    await page.getByRole('button', { name: 'Payer maintenant' }).first().click();

    await page.waitForURL((url) => url.pathname.startsWith(PATHS.VOYAGER.PAYMENT) && url.searchParams.get('targetType') === 'SUBSCRIPTION');

    await page.fill('input[placeholder="0000 0000 0000 0000"]', '1234 1234 1234 1234');
    await page.fill('input[placeholder="MM/YY"]', '12/28');
    await page.fill('input[placeholder="•••"]', '123');
    await page.click('button:has-text("Valider le paiement")');

    // check success 
    await page.waitForURL((url) => 
    url.pathname === PATHS.VOYAGER.PAYMENT_SUCCESS 
    && url.searchParams.get('targetType') === 'SUBSCRIPTION');
    await expect(page.getByText('Paiement Réussi')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mes Abonnements' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nouvel Abonnement' })).toBeVisible();
    
    // navigate to subscriptions page
    await page.getByRole('button', { name: 'Mes Abonnements' }).click();
    await page.waitForURL(PATHS.VOYAGER.SUBSCRIPTIONS);
    debugger;
    // refetch subscriptions 

    
    await expect(page.getByText('Active').first()).toBeVisible();

    // expect awaiting payment to only be civil
    await expect(page.getByRole('button', { name: 'Payer maintenant' })).toHaveCount(1);
    
    // check requests tab for universitaire is approved, civil is auto-approved
    await page.getByRole('button', { name: 'Demandes' }).click();
    await expect(page.getByText('Approuvée').first()).toBeVisible();
  });
});
