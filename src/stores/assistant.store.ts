import { create } from 'zustand';
import { assistantApi, AssistantAction, AssistantMessage, AssistantScreen } from '../lib/assistant.api';

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  suggestions?: string[];
  actions?: AssistantAction[];
  createdAt: string;
}

interface AssistantState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentScreen: AssistantScreen;
  currentScreenData: Record<string, unknown>;

  open: () => void;
  close: () => void;
  setScreen: (screen: AssistantScreen, data?: Record<string, unknown>) => void;
  sendMessage: (message: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  error: null,
  currentScreen: 'general',
  currentScreenData: {},

  open: () => {
    set({ isOpen: true });
    if (get().messages.length === 0) {
      get().loadHistory();
    }
  },

  close: () => set({ isOpen: false }),

  setScreen: (screen, data = {}) =>
    set({ currentScreen: screen, currentScreenData: data }),

  sendMessage: async (message: string) => {
    const { currentScreen, currentScreenData } = get();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'USER',
      content: message,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await assistantApi.chat(message, currentScreen, currentScreenData);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ASSISTANT',
        content: response.reply,
        suggestions: response.suggestions,
        actions: response.actions,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
      }));
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || 'Failed to get response. Try again.',
      });
    }
  },

  loadHistory: async () => {
    try {
      const history = await assistantApi.getHistory();
      const messages: ChatMessage[] = history.map((m: AssistantMessage, i: number) => ({
        id: `history-${i}`,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }));
      set({ messages });
    } catch {
      // silently fail — empty chat is fine
    }
  },

  clearHistory: async () => {
    await assistantApi.clearHistory();
    set({ messages: [] });
  },
}));
