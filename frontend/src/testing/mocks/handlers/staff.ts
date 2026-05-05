import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';

const API_URL = "/api";

export const staffHandlers = [
  // Agents
  http.get(`${API_URL}/staff/agents`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = 10;
    const start = page * size;
    const end = start + size;
    const content = mockDb.agents.slice(start, end);
    
    return HttpResponse.json({
      content,
      last: end >= mockDb.agents.length,
    });
  }),

  http.post(`${API_URL}/staff/agents`, async ({ request }) => {
    const data = await request.json() as { name: string; email: string };
    const newAgent = {
      id: `agent-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: data.email,
      canDelete: true,
    };
    mockDb.agents.push(newAgent);
    return new HttpResponse(null, { status: 201 });
  }),

  // Controllers
  http.get(`${API_URL}/staff/controllers`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = 10;
    const start = page * size;
    const end = start + size;
    const content = mockDb.controllers.slice(start, end);
    
    return HttpResponse.json({
      content,
      last: end >= mockDb.controllers.length,
    });
  }),

  http.post(`${API_URL}/staff/controllers`, async ({ request }) => {
    const data = await request.json() as { name: string; email: string; lineId: string };
    const line = mockDb.lines.find(l => l.id === data.lineId);
    const newController = {
      id: `controller-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: data.email,
      assignedLineName: line?.name || 'Unknown Line',
      canDelete: true,
    };
    mockDb.controllers.push(newController);
    return new HttpResponse(null, { status: 201 });
  }),

  // Deactivate (DELETE) - using generic /staff/agents/:id for now as per staffApi implementation
  http.delete(`${API_URL}/staff/agents/:id`, ({ params }) => {
    const { id } = params;
    mockDb.agents = mockDb.agents.filter(a => a.id !== id);
    mockDb.controllers = mockDb.controllers.filter(c => c.id !== id);
    return new HttpResponse(null, { status: 200 });
  }),
];
