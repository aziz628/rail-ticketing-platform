import { api } from '@/lib/api-client';

export type DailyTicketSales = {
  date: string;
  count: number;
};

export type DashboardResponse = {
  ticketsSoldToday: number;
  totalRevenue: number;
  activeSubscriptions: number;
  dailyTicketsSold: DailyTicketSales[];
};

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get<DashboardResponse>('/admin/dashboard/stats');
    return response.data;
  },

  exportTransactions: async () => {
    const response = await api.get('/admin/dashboard/export/transactions', {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};