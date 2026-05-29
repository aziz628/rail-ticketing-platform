import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';

const API_URL = "/api";

export const schedulesHandlers = [
  // GET /schedules/{status} - Supports path variable status and optional lineId param
  http.get(`${API_URL}/schedules/:status`, ({ params, request }) => {
    const { status } = params;
    const url = new URL(request.url);
    const lineId = url.searchParams.get('lineId');
    const page = Number(url.searchParams.get('page')) || 0;
    const size = 10;

    let allSchedules = [...mockDb.schedules];

    // filter schedules by status
    if (status === 'ACTIVE') {
      allSchedules = allSchedules.filter((s) => !s.isDeleted);
    } else if (status === 'INACTIVE') {
      allSchedules = allSchedules.filter((s) => s.isDeleted);
    }

    // filter by line if provided
    if (lineId) {
      // Find the line name to filter by
      const line = mockDb.lines.find(l => l.id === lineId);
      if (line) {
        allSchedules = allSchedules.filter(s => s.lineName === line.name);
      }
    }

    // pagination
    const start = page * size;
    const end = start + size;
    const paginated = allSchedules.slice(start, end);

    return HttpResponse.json({
      content: paginated,
      page: {
        size,
        number: page,
        totalElements: allSchedules.length,
        totalPages: Math.ceil(allSchedules.length / size),
      },
    });
  }),

  // POST /schedules - Creates a new schedule
  http.post(`${API_URL}/schedules`, async ({ request }) => {
    const body = await request.json() as any;

    // find line, controller and train
    const line = mockDb.lines.find(l => l.id === body.lineId);
    const controller = mockDb.controllers.find(c => c.id === body.controllerId);
    const train = mockDb.trains.find(t => t.id === body.trainId);
    /*
    backend errors
    "Train non trouvé"
    "Le contrôleur n'est pas assigné à la ligne spécifiée"
    "Contrôleur non trouvé ou non assigné"
      */
    if (!train ) {
      return HttpResponse.json({ message: "Train non trouvé" }, { status: 400 });
    }
    if (!controller) {
      return HttpResponse.json({ message: "Contrôleur non trouvé" }, { status: 400 });
    }
    if (!line) {
      return HttpResponse.json({ message: "Le contrôleur n'est pas assigné à la ligne spécifiée" }, { status: 400 });
    }

    // Backend rule: Controller line must match
    if (controller.assignedLineName !== line.name) {
      return HttpResponse.json(
        { message: `Conflit : Le contrôleur est rattaché à "${controller.assignedLineName}"` },
        { status: 409 }
      );
    }

    const newSchedule = {
      id: `sched-${Date.now()}`,
      lineName: line.name,
      trainName: train.name,
      controllerName: controller.name,
      daysBitmask: body.daysBitmask,
      activationDate: body.activationDate,
      deactivationDate: body.deactivationDate || null,
      canDelete: true,
      canDeactivate: true,
      minDeactivationDate: body.activationDate,
      isDeleted: false,
      stops: body.stops.map((s: any) => {
        const node = line.nodes.find(n => n.id === s.lineNodeId);
        return {
          stationName: node?.stationName || 'Station',
          arrivalTime: s.arrivalTime,
          kmFromSource: node?.kmFromSource || 0,
        };
      }),
    };

    mockDb.schedules.push(newSchedule);
    return HttpResponse.json(null, { status: 201 });
  }),

  // PATCH /schedules/{id}/deactivate - Body contains deactivationDate
  http.patch(`${API_URL}/schedules/:id/deactivate`, async ({ request, params }) => {
    const { id } = params;
    const body = await request.json() as any;

    const scheduleIndex = mockDb.schedules.findIndex(s => s.id === id);
    if (scheduleIndex === -1) {
      return HttpResponse.json({ message: 'Horaire introuvable' }, { status: 404 });
    }

    // Mock deactivation logic
    mockDb.schedules[scheduleIndex] = {
      ...mockDb.schedules[scheduleIndex],
      isDeleted: true,
      canDelete: false,
      canDeactivate: false,
      deactivationDate: body.deactivationDate,
    };

    return new HttpResponse(null, { status: 204 });
  }),

  // DELETE /schedules/{id} - Hard delete
  http.delete(`${API_URL}/schedules/:id`, ({ params }) => {
    const { id } = params;
    mockDb.schedules = mockDb.schedules.filter(s => s.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  // PATCH /schedules/{id}/controller - Reassignment
  http.patch(`${API_URL}/schedules/:id/controller`, async ({ request, params }) => {
    const { id } = params;
    const body = await request.json() as any;

    // check if schedule exist
    const scheduleIndex = mockDb.schedules.findIndex(s => s.id === id);
    if (scheduleIndex === -1) {
      return HttpResponse.json({ message: 'Horaire introuvable' }, { status: 404 });
    }
    // check if controller exist
    const controller = mockDb.controllers.find(c => c.id === body.controllerId);
    if (!controller) {
      return HttpResponse.json({ message: 'Contrôleur introuvable' }, { status: 404 });
    }

    mockDb.schedules[scheduleIndex] = {
      ...mockDb.schedules[scheduleIndex],
      controllerName: controller.name,
    };

    return new HttpResponse(null, { status: 204 });
  }),
];
