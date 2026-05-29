import { api } from '@/lib/api-client';

export type PaymentTargetType = 'TICKET' | 'SUBSCRIPTION';

export type PspSessionResponse = {
  pspSessionId: string;
  amount: number;
  remainingTimeinSecondes: number;
};

export type PspPayRequest = {
  pspSessionId: string;
  cardNumber: string;
  cvv: string;
  expiryDate: string;
};

export const pspApi = {
  getSession: async (id: string) => {
    const response = await api.get<PspSessionResponse>(`/mock-psp/session/${id}`);
    return response.data;
  },
  processPayment: async (targetType: PaymentTargetType, data: PspPayRequest) => {
    const response = await api.post(`/mock-psp/pay/${targetType}`, data);
    return response.data;
  },
};
