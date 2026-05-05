import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';

const API_URL = "/api";

export const infrastructureHandlers = [
  // Stations
  http.get(`${API_URL}/stations`, ({ request }) => {
    // get page and interval of elements
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = 10;
    const start = page * size;
    const end = start + size;
    // get the interval of elements from the mock db
    const content = mockDb.stations.slice(start, end);
    
    return HttpResponse.json({
      content,
      last: end >= mockDb.stations.length,
    });
  }),

  http.post(`${API_URL}/stations`, async ({ request }) => {
    const data = await request.json() as { name: string };
    // create a new station
    const newStation = {
      id: `station-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      canDelete: true,
    };
    // add the new station to the mock db
    mockDb.stations.push(newStation);
    return new HttpResponse(null, { status: 201 });
  }),

  http.put(`${API_URL}/stations/:id`, async ({ request, params }) => {
    const { id } = params;
    const data = await request.json() as { name: string };
    // find the station in the mock db
    const station = mockDb.stations.find((s) => s.id === id);
    // if the station is found, update it
    if (station) {
      station.name = data.name;
      return new HttpResponse(null, { status: 200 });
    }
    // if the station is not found, return 404
    return new HttpResponse(null, { status: 404 });
  }),

  http.delete(`${API_URL}/stations/:id`, ({ params }) => {
    const { id } = params;
    // remove the station from the mock db
    mockDb.stations = mockDb.stations.filter((s) => s.id !== id);
    return new HttpResponse(null, { status: 200 });
  }),

  // Trains
  http.get(`${API_URL}/trains`, ({ request }) => {
    const url = new URL(request.url);
    // get page and interval of elements
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = 10;
    const start = page * size;
    const end = start + size;
    // get the interval of elements from the mock db
    const content = mockDb.trains.slice(start, end);
    
    return HttpResponse.json({
      content,
      last: end >= mockDb.trains.length,
    });
  }),

  http.post(`${API_URL}/trains`, async ({ request }) => {
    const data = await request.json() as any;
    // create a new train
    const newTrain = {
      id: `train-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      basePriceIncreasePercentage: data.basePriceIncreasePercentage,
      seatClasses: data.seatClasses.map((sc: any) => ({
        id: `sc-${Math.random().toString(36).substr(2, 9)}`,
        ...sc,
      })),
    };
    // add the new train to the mock db
    mockDb.trains.push(newTrain);
    return new HttpResponse(null, { status: 201 });
  }),

  http.delete(`${API_URL}/trains/:id`, ({ params }) => {
    const { id } = params;
    // remove the train from the mock db
    mockDb.trains = mockDb.trains.filter((t) => t.id !== id);
    return new HttpResponse(null, { status: 200 });
  }),

  // Lines
  http.get(`${API_URL}/lines`, ({ request }) => {
    const url = new URL(request.url);
    // get page and interval of elements
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = 10;
    const start = page * size;
    const end = start + size;
    // get the interval of elements from the mock db
    const content = mockDb.lines.slice(start, end);
    
    return HttpResponse.json({
      content,
      last: end >= mockDb.lines.length,
    });
  }),

  http.post(`${API_URL}/lines`, async ({ request }) => {
    const data = await request.json() as any;
    // create a new line
    const newLine = {
      id: `line-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      nodes: data.nodes.map((node: any, index: number) => ({
        id: `node-${Math.random().toString(36).substr(2, 9)}`,
        stationId: node.stationId,
        stationName: mockDb.stations.find(s => s.id === node.stationId)?.name || 'Unknown',
        kmFromSource: node.kmFromSource,
        orderIndex: index,
      })),
    };
    // add the new line to the mock db
    mockDb.lines.push(newLine);

    // if createReverse is true, create a reverse line
    if (data.createReverse) {
      const reverseLine = {
        id: `line-${Math.random().toString(36).substr(2, 9)}`,
        name: `${newLine.name} (Reverse)`,
        nodes: [...newLine.nodes].reverse().map((node, index) => ({
          ...node,
          id: `node-rev-${Math.random().toString(36).substr(2, 9)}`,
          orderIndex: index,
          kmFromSource: Math.abs(newLine.nodes[newLine.nodes.length - 1].kmFromSource - node.kmFromSource),
        })),
      };
      mockDb.lines.push(reverseLine);
    }
    
    return new HttpResponse(null, { status: 201 });
  }),

  http.delete(`${API_URL}/lines/:id`, ({ params }) => {
    const { id } = params;
    // remove the line from the mock db
    mockDb.lines = mockDb.lines.filter((l) => l.id !== id);
    return new HttpResponse(null, { status: 200 });
  }),
];
