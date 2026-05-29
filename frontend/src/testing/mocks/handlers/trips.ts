import { http, HttpResponse, delay } from 'msw';
import { mockDb, type TripResponse } from '../db';
const API_URL = "/api";

export const tripsHandlers = [
  // GET /trips
  http.get(`${API_URL}/trips`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const lineId = url.searchParams.get('lineId');
    //const date = url.searchParams.get('date');
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '10');

    let filteredTrips = [...mockDb.trips];
    if (lineId) {
      filteredTrips = filteredTrips.filter(t => t.lineId === lineId);
    }

    //if (date) filteredTrips = filteredTrips.filter(t => t.date === date);
    

    const start = page * size;
    const end = start + size;
    let pagedTrips: TripResponse[] = filteredTrips.slice(start, end).map(({ lineId, ...trip }) => trip);
    const isLast = end >= filteredTrips.length;

    console.log("trips : " , pagedTrips);


    return HttpResponse.json({
      content: pagedTrips,
      last: isLast,
    });
  }),

  // GET /trips/settings
  http.get(`${API_URL}/trips/settings`, async () => {
    await delay(200);
    return HttpResponse.json(mockDb.tripSettings);
  }),

  // PUT /trips/settings
  http.put(`${API_URL}/trips/settings`, async ({ request }) => {
    await delay(300);
    const newSettings = (await request.json()) as any;
    mockDb.tripSettings = { ...mockDb.tripSettings, ...newSettings };
    return new HttpResponse(null, { status: 200 });
  }),

  // POST /trips/sync
  http.post(`${API_URL}/trips/sync`, async () => {
    await delay(1500); // Simulate heavy engine processing
    return new HttpResponse(null, { status: 200 });
  }),
];
