import { api } from './api';

export type AssistantScreen =
  | 'home'
  | 'explore'
  | 'venue'
  | 'booking'
  | 'profile'
  | 'settings'
  | 'coaches'
  | 'owner_dashboard'
  | 'owner_reservations'
  | 'owner_schedule'
  | 'owner_expenses'
  | 'general';

export interface AssistantAction {
  type: 'navigate' | 'suggest_booking' | 'open_filter' | 'open_venue';
  screen?: string;
  params?: Record<string, unknown>;
}

export interface AssistantMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export interface AssistantResponse {
  reply: string;
  actions: AssistantAction[];
  suggestions: string[];
}

export const assistantApi = {
  chat: async (
    message: string,
    screen: AssistantScreen = 'general',
    data: Record<string, unknown> = {},
  ): Promise<AssistantResponse> => {
    const res = await api.post<AssistantResponse>('/assistant/chat', {
      message,
      screen,
      data,
    });
    return res.data;
  },

  getHistory: async (): Promise<AssistantMessage[]> => {
    const res = await api.get<AssistantMessage[]>('/assistant/history');
    return res.data;
  },

  clearHistory: async (): Promise<void> => {
    await api.delete('/assistant/history');
  },
};
