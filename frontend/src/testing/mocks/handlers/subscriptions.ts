import { http, HttpResponse } from 'msw';
import { mockDb, persistMockDb } from '../db';

const API_URL = '/api';

//  helper functions 

function getMockUser(role: 'VOYAGER' | 'AGENT') {
  return mockDb.users.find((entry) => entry.role === role) ?? null;
}

function getSubscriptionAmount(categoryName: string, duration: string) {
  const category = mockDb.subscriptionCategories.find((entry) => entry.name === categoryName);
  if (!category) return 0;

  return duration === 'QUARTERLY' ? category.quarterlyPrice : category.monthlyPrice;
}

function toPagedResponse<T>(content: T[], page: number, size: number) {
  const start = page * size;
  const pageContent = content.slice(start, start + size);

  return {
    content: pageContent,
    last: start + size >= content.length,
  };
}

// handlers
export const subscriptionsHandlers = [
  http.get(`${API_URL}/subscription-categories`, async () => {
    return HttpResponse.json(mockDb.subscriptionCategories);
  }),

  http.patch(`${API_URL}/subscription-categories/:id`, async ({ params, request }) => {
    const body = await request.json() as { monthlyPrice: number; quarterlyPrice: number };
    const category = mockDb.subscriptionCategories.find((entry) => entry.id === params.id);
    if (!category) return new HttpResponse(null, { status: 404 });

    category.monthlyPrice = body.monthlyPrice;
    category.quarterlyPrice = body.quarterlyPrice;

    return HttpResponse.json(category);
  }),

  http.post(`${API_URL}/subscription-requests`, async ({ request }) => {
    const currentUser = getMockUser('VOYAGER');
    if (!currentUser) {
      return HttpResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const categoryName = String(formData.get('categoryName') || '');
    const duration = String(formData.get('duration') || '');
    const lineId = String(formData.get('lineId') || '');
    const proofFile = formData.get('proofFile');

    const category = mockDb.subscriptionCategories.find((entry) => entry.name === categoryName);
    const line = mockDb.lines.find((entry) => entry.id === lineId);

    if (!category) {
      return HttpResponse.json({ message: 'Catégorie introuvable' }, { status: 404 });
    }

    if (!line) {
      return HttpResponse.json({ message: 'Ligne introuvable' }, { status: 404 });
    }

    if (categoryName !== 'CIVIL' && !proofFile) {
      return HttpResponse.json({ message: 'Veuillez joindre le document requis' }, { status: 400 });
    }

    const requestId = `subreq-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const isCivil = categoryName === 'CIVIL';

    mockDb.subscriptionRequests.unshift({
      id: requestId,
      userId: currentUser.id,
      voyagerName: currentUser.name,
      lineName: line.name,
      categoryName: category.name,
      duration: duration === 'QUARTERLY' ? 'QUARTERLY' : 'MONTHLY',
      status: isCivil ? 'APPROVED' : 'PENDING',
      createdAt,
      proofType: proofFile instanceof File ? proofFile.type || 'application/pdf' : null,
    });

    if (isCivil) {
      mockDb.subscriptions.unshift({
        id: `sub-${crypto.randomUUID()}`,
        userId: currentUser.id,
        requestId: requestId,
        lineName: line.name,
        categoryName: category.name,
        duration: duration === 'QUARTERLY' ? 'QUARTERLY' : 'MONTHLY',
        expireDate: null,
        status: 'AWAITING_PAYMENT',
      });
    }

    // Persist changes to sessionStorage for cross-navigation e2e tests
    persistMockDb();

    return HttpResponse.json({
      id: requestId,
      categoryName: category.name,
      duration: duration === 'QUARTERLY' ? 'QUARTERLY' : 'MONTHLY',
      lineName: line.name,
      status: isCivil ? 'APPROVED' : 'PENDING',
      createdAt,
    }, { status: 201 });
  }),

  http.get(`${API_URL}/subscription-requests/me`, async ({ request }) => {
    const currentUser = getMockUser('VOYAGER');
    if (!currentUser) {
      return HttpResponse.json({ content: [], last: true }, { status: 200 });
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '0');
    const pageSize = 10;
    const requests = mockDb.subscriptionRequests
      .filter((entry) => entry.userId === currentUser.id)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((entry) => ({
        id: entry.id,
        categoryName: entry.categoryName,
        duration: entry.duration,
        lineName: entry.lineName,
        status: entry.status,
        createdAt: entry.createdAt,
        rejectReason: entry.rejectReason,
      }));

    return HttpResponse.json(toPagedResponse(requests, page, pageSize));
  }),

  http.get(`${API_URL}/staff/subscription-requests/:status`, async ({ params, request }) => {
    const currentUser = getMockUser('AGENT');
    if (!currentUser) {
      return HttpResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '0');
    const pageSize = 10;
    const status = params.status as 'PENDING' | 'APPROVED' | 'REJECTED';
    
    // no civil requests for staff
    const requests = mockDb.subscriptionRequests
      .filter((entry) => entry.categoryName !== 'CIVIL' && entry.status === status)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((entry) => ({
        id: entry.id,
        voyagerName: entry.voyagerName,
        lineName: entry.lineName,
        categoryName: entry.categoryName,
        duration: entry.duration,
        status: entry.status,
        rejectReason: entry.rejectReason,
        createdAt: entry.createdAt,
      }));

    return HttpResponse.json(toPagedResponse(requests, page, pageSize));
  }),

  http.get(`${API_URL}/staff/subscription-requests/:id/proof`, async ({ params }) => {
    const requestEntry = mockDb.subscriptionRequests.find((entry) => entry.id === params.id);
    if (!requestEntry || !requestEntry.proofType) {
      return new HttpResponse(null, { status: 404 });
    }

    const content = requestEntry.proofType.startsWith('image/')
      ? 'PNG proof image'
      : '%PDF-1.4 proof document';

    const blob = new Blob([content], { type: requestEntry.proofType });
    return new HttpResponse(blob, {
      headers: { 'Content-Type': requestEntry.proofType },
    });
  }),

  http.patch(`${API_URL}/staff/subscription-requests/:id/approve`, async ({ params }) => {
    const currentUser = getMockUser('AGENT');
    if (!currentUser) {
      return new HttpResponse(null, { status: 401 });
    }

    const requestEntry = mockDb.subscriptionRequests.find((entry) => entry.id === params.id);
    if (!requestEntry) return new HttpResponse(null, { status: 404 });

    requestEntry.status = 'APPROVED';
    requestEntry.rejectReason = undefined;

    const existingSubscription = mockDb.subscriptions.find((entry) => entry.requestId === requestEntry.id);
    if (!existingSubscription) {
      mockDb.subscriptions.unshift({
        id: `sub-${crypto.randomUUID()}`,
        userId: requestEntry.userId,
        requestId: requestEntry.id,
        lineName: requestEntry.lineName,
        categoryName: requestEntry.categoryName,
        duration: requestEntry.duration,
        expireDate: null,
        status: 'AWAITING_PAYMENT',
      });
    }

    persistMockDb();

    return new HttpResponse(null, { status: 204 });
  }),

  http.patch(`${API_URL}/staff/subscription-requests/:id/reject`, async ({ params, request }) => {
    const currentUser = getMockUser('AGENT');
    if (!currentUser) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as { rejectReason: string };
    const requestEntry = mockDb.subscriptionRequests.find((entry) => entry.id === params.id);
    if (!requestEntry) return new HttpResponse(null, { status: 404 });

    requestEntry.status = 'REJECTED';
    requestEntry.rejectReason = body.rejectReason;

    persistMockDb();

    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}/subscriptions/:filter`, async ({ request, params }) => {
    const currentUser = getMockUser('VOYAGER');
    if (!currentUser) {
      return HttpResponse.json({ content: [], last: true }, { status: 200 });
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '0');
    const filter = params.filter as 'CURRENT' | 'EXPIRED';
    const pageSize = 10;

    const subscriptions = mockDb.subscriptions
      .filter((entry) => entry.userId === currentUser.id)
      .filter((entry) => {
        if (filter === 'CURRENT') {
          return entry.status === 'ACTIVE' || entry.status === 'AWAITING_PAYMENT';
        }
        return entry.status === 'EXPIRED';
      })
      .map((entry) => ({
        id: entry.id,
        requestId: entry.requestId,
        lineName: entry.lineName,
        categoryName: entry.categoryName,
        duration: entry.duration,
        expireDate: entry.expireDate,
        status: entry.status,
      }));

    return HttpResponse.json(toPagedResponse(subscriptions, page, pageSize));
  }),

  http.post(`${API_URL}/subscriptions/:id/initiate-payment`, async ({ params }) => {
    const currentUser = getMockUser('VOYAGER');
    if (!currentUser) {
      return HttpResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const subscription = mockDb.subscriptions.find((entry) => entry.id === params.id);
    if (!subscription) {
      return HttpResponse.json({ message: 'Abonnement introuvable' }, { status: 404 });
    }

    if (subscription.status !== 'AWAITING_PAYMENT') {
      return HttpResponse.json({ message: 'Cet abonnement ne nécessite pas de paiement' }, { status: 409 });
    }

    if (subscription.userId !== currentUser.id) {
      return HttpResponse.json({ message: 'Abonnement introuvable' }, { status: 404 });
    }
    // create a mock PSP session
    const amount = getSubscriptionAmount(subscription.categoryName, subscription.duration);
    const pspSessionId = `psp-${crypto.randomUUID()}`;

    mockDb.activePspSession = {
      targetType: 'SUBSCRIPTION',
      pspSessionId,
      amount,
      remainingTimeinSecondes: 300,
      subscriptionId: subscription.id,
    };

    persistMockDb();

    return HttpResponse.json({ pspSessionId });
  }),
];
