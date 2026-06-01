import { http, HttpResponse } from 'msw';

export const dashboardHandlers = [
  http.get('*/api/admin/dashboard/stats', () => {
    // Generate dates for the last 30 days
    const dailyTicketsSold = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 10, // Mock 10-60 sales per day
      };
    });

    return HttpResponse.json({
      ticketsSoldToday: 42,
      totalRevenue: 1250.75,
      activeSubscriptions: 156,
      dailyTicketsSold,
    });
  }),
];
