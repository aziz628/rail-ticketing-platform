import { http, HttpResponse, delay } from 'msw';
import { mockDb, persistMockDb } from '../db';

const API_URL = "/api";

function getMockUser(role: 'VOYAGER' | 'AGENT') {
  return mockDb.users.find((entry) => entry.role === role) ?? null;
}


export const ticketsHandlers = [

  // GET trips search 
  http.get(`${API_URL}/trips/search`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const originNodeId = url.searchParams.get('originId');
    const destinationNodeId = url.searchParams.get('destinationId');
    const date = url.searchParams.get('date');

    const results = mockDb.trips.filter(trip => {
      // Only filter by date if provided
      if (date && trip.date !== date) return false;

      // Find the line for this trip
      const line = mockDb.lines.find(l => l.id === trip.lineId);
      if (!line) return false;

      // Lookup the nodes by their IDs and verify order
      const originNode = line.nodes.find(n => n.id === originNodeId);
      const destNode = line.nodes.find(n => n.id === destinationNodeId);
      if (!originNode || !destNode) return false;

      return originNode.orderIndex < destNode.orderIndex;
    });

    return HttpResponse.json({
      content: results.map(trip => {
        const line = mockDb.lines.find(l => l.id === trip.lineId)!;
        const originNode = line.nodes.find(n => n.id === originNodeId)!;
        const destNode = line.nodes.find(n => n.id === destinationNodeId)!;
        return {
          tripId: trip.id,
          lineName: trip.lineName,
          trainName: trip.trainName,
          originStationName: originNode.stationName,
          destinationStationName: destNode.stationName,
          departureTime: '08:30',
          arrivalTime: '12:45',
          date: trip.date,
          bookingDeadlineExpired: false,
          hasAvailableSeats: true,
        };
      }),
      last: true,
    });
  }),

  // GET trips booking-details
  http.get(`${API_URL}/trips/:id/booking-details`, async ({ params, request }) => {
    await delay(200);
    const currentUser = getMockUser('VOYAGER');

    const url = new URL(request.url);
    const tripId = params.id as string;
    const originNodeId = url.searchParams.get('originId');
    const destinationNodeId = url.searchParams.get('destinationId');
  

    const trip = mockDb.trips.find(t => t.id === tripId);
    if (!trip) return new HttpResponse(null, { status: 404 });

    const line = mockDb.lines.find(l => l.id === trip.lineId);
    if (!line) return new HttpResponse(null, { status: 404 });

    const originNode = line.nodes.find(n => n.id === originNodeId);
    const destNode = line.nodes.find(n => n.id === destinationNodeId);
    if (!originNode || !destNode) return new HttpResponse(null, { status: 400 });

    // Calculate distance price based on km delta between the two nodes
    const distanceKm = destNode.kmFromSource - originNode.kmFromSource;
    const PRICE_PER_KM = 0.15; // DT per km (realistic mock)
    const distancePrice = parseFloat((distanceKm * PRICE_PER_KM).toFixed(2));

    const train = mockDb.trains.find(t => t.name === trip.trainName);
    if (!train) return new HttpResponse(null, { status: 404 });

    const seatClasses = train.seatClasses.map(sc => {
      const basePrice = parseFloat((distancePrice * (1 + train.basePriceIncreasePercentage / 100)).toFixed(2));
      const finalPrice = parseFloat((basePrice * (1 + sc.priceIncreasePercentage / 100)).toFixed(2));
      return {
        id: sc.id,
        type: sc.type,
        distancePrice,
        basePrice,
        finalPrice,
        available: true,
      };
    });

    // Check if user already bought this exact trip segment
    const isAlreadyBought = mockDb.tickets.some(
      t => t.originStationName === originNode.stationName &&
           t.destinationStationName === destNode.stationName &&
           t.date === trip.date
    );

  // Check if user has an active subscription for this line to allow free booking

  const freeBookingAllowed = mockDb.subscriptions.some(
    (subscription) =>
      subscription.userId === currentUser?.id &&
      subscription.lineName === line.name &&
      subscription.status === 'ACTIVE'    
  );

    return HttpResponse.json({
      tripId: trip.id,
      originName: originNode.stationName,
      destinationName: destNode.stationName,
      departureTime: '08:30',
      arrivalTime: '12:45',
      date: trip.date,
      trainName: trip.trainName,
      isAlreadyBought,
      userBlocked: false,
      freeBookingAllowed,
      seatClasses,
    });
  }),

  // POST /tickets/initiate-payment
  http.post(`${API_URL}/tickets/initiate-payment`, async ({ request }) => {
    await delay(400);
    const body = await request.json() as {
      tripId: string;
      originLineNodeId: string;
      destinationLineNodeId: string;
      seatClassId: string;
    };

    const trip = mockDb.trips.find(t => t.id === body.tripId);
    if (!trip) return new HttpResponse(null, { status: 404 });

    const line = mockDb.lines.find(l => l.id === trip.lineId);
    if (!line) return new HttpResponse(null, { status: 404 });

    const originNode = line.nodes.find(n => n.id === body.originLineNodeId);
    const destNode = line.nodes.find(n => n.id === body.destinationLineNodeId);
    if (!originNode || !destNode) return new HttpResponse(null, { status: 400 });

    const train = mockDb.trains.find(t => t.name === trip.trainName);
    const seatClass = train?.seatClasses.find(sc => sc.id === body.seatClassId);
    if (!seatClass) return new HttpResponse(null, { status: 400 });

    // Compute amount the same way booking-details does
    const distanceKm = destNode.kmFromSource - originNode.kmFromSource;
    const distancePrice = distanceKm * 0.15;
    const basePrice = distancePrice * (1 + (train?.basePriceIncreasePercentage ?? 0) / 100);
    const amount = parseFloat((basePrice * (1 + seatClass.priceIncreasePercentage / 100)).toFixed(2));
    
    // create a mock PSP session 
    const pspSessionId = `psp-${crypto.randomUUID()}`;

    // set session data in mockDb to be used later in the payment step
    mockDb.activePspSession = {
      targetType: 'TICKET',
      pspSessionId,
      amount,
      remainingTimeinSecondes: 300,
      tripId: body.tripId,
      originNodeId: body.originLineNodeId,
      destinationNodeId: body.destinationLineNodeId,
      seatClassId: body.seatClassId,
    };

    return HttpResponse.json({ pspSessionId });
  }),

  // GET /mock-psp/session
  http.get(`${API_URL}/mock-psp/session/:id`, async ({ params }) => {
    await delay(200);
    const session = mockDb.activePspSession;
    if (!session || session.pspSessionId !== params.id) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      pspSessionId: session.pspSessionId,
      amount: session.amount,
      remainingTimeinSecondes: session.remainingTimeinSecondes,
    });
  }),

  // POST mock PSP payment endpoint
  http.post(`${API_URL}/mock-psp/pay/:targetType`, async ({ params, request }) => {
    await delay(500);
    const body = await request.json() as {
      pspSessionId: string;
      cardNumber: string;
      cvv: string;
      expiryDate: string;
    };
    
    // Validate session
    const session = mockDb.activePspSession;
    if (!session || session.pspSessionId !== body.pspSessionId) {
      return new HttpResponse(
        JSON.stringify({ status: 410, message: 'Session de paiement expirée ou invalide.' }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Simulate card declined: any card starting with "4000" is declined
    const rawCard = body.cardNumber.replace(/\s/g, '');
    if (rawCard.startsWith('4000')) {
      return new HttpResponse(
        JSON.stringify({ status: 400, message: 'Paiement refusé par la banque.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    
    if (params.targetType === 'SUBSCRIPTION') {
      // check if session is for subscription payment
      if (session.targetType !== 'SUBSCRIPTION' || !session.subscriptionId) {
        return new HttpResponse(
          JSON.stringify({ status: 410, message: 'Session de paiement expirée ou invalide.' }),
          { status: 410, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // check if subscription exists
      const subscription = mockDb.subscriptions.find((entry) => entry.id === session.subscriptionId);
      if (!subscription) {
        return new HttpResponse(null, { status: 404 });
      }

      // Activate subscription
      const today = new Date();
      const expireDate = new Date(today);
      expireDate.setDate(expireDate.getDate() + (subscription.duration === 'MONTHLY' ? 30 : 90));
      subscription.status = 'ACTIVE';
      subscription.expireDate = expireDate.toISOString().split('T')[0];
      mockDb.activePspSession = null;

      persistMockDb();

      return new HttpResponse(null, { status: 200 });
    }

    // Payment accepted  create the ticket from session data
    const trip = mockDb.trips.find(t => t.id === session.tripId);
    const line = trip ? mockDb.lines.find(l => l.id === trip.lineId) : null;
    const originNode = line?.nodes.find(n => n.id === session.originNodeId);
    const destNode = line?.nodes.find(n => n.id === session.destinationNodeId);
    const train = trip ? mockDb.trains.find(t => t.name === trip.trainName) : null;
    const seatClass = train?.seatClasses.find(sc => sc.id === session.seatClassId);

    // Add the new ticket to the mockDb
    mockDb.tickets.unshift({
      id: crypto.randomUUID(),
      originStationName: originNode?.stationName ?? 'Inconnu',
      destinationStationName: destNode?.stationName ?? 'Inconnu',
      departureTime: '08:30',
      arrivalTime: '12:45',
      date: trip?.date ?? new Date().toISOString().split('T')[0],
      seatClassName: seatClass?.type ?? 'SECOND',
      price: session.amount,
      status: 'PAID',
    });

    // Invalidate session after use
    mockDb.activePspSession = null;

    return new HttpResponse(null, { status: 200 });
  }),

  // POST  /tickets/book-free
  http.post(`${API_URL}/tickets/book-free`, async ({ request }) => {
    await delay(250);
    const body = await request.json() as {
      tripId: string;
      originLineNodeId: string;
      destinationLineNodeId: string;
      seatClassId: string;
    };

    const trip = mockDb.trips.find(t => t.id === body.tripId);
    if (!trip) return new HttpResponse(null, { status: 404 });

    const line = mockDb.lines.find(l => l.id === trip.lineId);
    if (!line) return new HttpResponse(null, { status: 404 });

    const originNode = line.nodes.find(n => n.id === body.originLineNodeId);
    const destNode = line.nodes.find(n => n.id === body.destinationLineNodeId);
    if (!originNode || !destNode) return new HttpResponse(null, { status: 400 });

    const train = mockDb.trains.find(t => t.name === trip.trainName);
    const seatClass = train?.seatClasses.find(sc => sc.id === body.seatClassId);
    if (!seatClass) return new HttpResponse(null, { status: 400 });

    const ticket = {
      id: crypto.randomUUID(),
      originStationName: originNode.stationName,
      destinationStationName: destNode.stationName,
      departureTime: '08:30',
      arrivalTime: '12:45',
      date: trip.date,
      seatClassName: seatClass.type,
      price: 0,
      status: 'PAID',
    };

    mockDb.tickets.unshift(ticket);

    return HttpResponse.json(ticket, { status: 200 });
  }),

  // GET tickets 
  http.get(`${API_URL}/tickets/:filter`, async ({ params, request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '0');
    const pageSize = 10;
    const filter = params.filter as string;

    const today = new Date().toISOString().split('T')[0];
    const filtered = mockDb.tickets.filter(t =>
      filter === 'UPCOMING' ? t.date >= today : t.date < today
    );

    const start = page * pageSize;
    const pageContent = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      content: pageContent,
      last: start + pageSize >= filtered.length,
    });
  }),

  // GET tickets
  http.get(`${API_URL}/tickets/:id/download`, async ({ params }) => {
    await delay(300);
    const ticket = mockDb.tickets.find(t => t.id === params.id);
    if (!ticket) return new HttpResponse(null, { status: 404 });

    const pdfContent = new Blob(['%PDF-1.4 Mock Ticket PDF'], { type: 'application/pdf' });
    return new HttpResponse(pdfContent, {
      headers: { 'Content-Type': 'application/pdf' },
    });
  }),
];

